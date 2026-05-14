import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { personalAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import LessonCard from '../../components/education/LessonCard';
import QuizModal from '../../components/education/QuizModal';
import ProgressBar from '../../components/education/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface Lesson {
  id: string;
  title: string;
  content: string;
  xp: number;
  quiz: { question: string; options: string[]; answer: number }[];
}

export default function CoachScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const { data: level, loading: levelLoading, refetch: refetchLevel } = useApi(
    useCallback(() => personalAPI.getCoachLevel(), [])
  );
  const { mutate: askCoach, loading: asking } = useApiMutation(
    (q: string) => personalAPI.askCoach(q)
  );
  const { mutate: getLesson, loading: loadingLesson } = useApiMutation(
    (data: any) => personalAPI.getLesson(data)
  );
  const { mutate: submitQuiz } = useApiMutation(
    (data: any) => personalAPI.submitQuizResult(data)
  );

  const xp = (level as any)?.xp || 0;
  const lvl = (level as any)?.level || 1;
  const xpForNext = lvl * 200;
  const badges: string[] = (level as any)?.badges || [];

  const handleAsk = async () => {
    if (!question.trim()) return;
    try {
      const result = await askCoach(question);
      setAnswer((result as any).answer || 'Cevap alınamadı');
      setQuestion('');
    } catch {
      Alert.alert('Hata', 'Bağlantı hatası');
    }
  };

  const handleStartLesson = async () => {
    try {
      const lesson = await getLesson({ userLevel: lvl }) as Lesson;
      setActiveLesson(lesson);
      setShowQuiz(true);
    } catch {
      Alert.alert('Hata', 'Ders yüklenemedi');
    }
  };

  const handleQuizComplete = async (correct: number) => {
    if (activeLesson) {
      try {
        await submitQuiz({ lessonId: activeLesson.id, correct: correct > 0 });
        refetchLevel();
      } catch {}
    }
    setShowQuiz(false);
    setActiveLesson(null);
  };

  if (levelLoading) return <LoadingSpinner fullScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Seviye göstergesi */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNum}>{lvl}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Seviye {lvl}</Text>
              <Text style={styles.xpText}>{xp} / {xpForNext} XP</Text>
            </View>
          </View>
          <ProgressBar current={xp % xpForNext} total={xpForNext} color={colors.personal} showLabel={false} height={8} />
          {badges.length > 0 && (
            <View style={styles.badges}>
              {badges.map((b, i) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Günlük ders */}
        <Text style={styles.sectionTitle}>Günlük Ders</Text>
        <LessonCard
          title="Bugünün dersi hazır!"
          content="Finansal okuryazarlığını geliştirmek için yapay zeka destekli kişisel dersin seni bekliyor."
          xp={50}
          onStart={handleStartLesson}
        />
        {loadingLesson && <LoadingSpinner text="Ders yükleniyor..." />}

        {/* Soru Sor */}
        <Text style={styles.sectionTitle}>FinansKoç'a Sor</Text>
        <View style={styles.askCard}>
          <TextInput
            style={styles.askInput}
            placeholder="Finansal sorunuzu yazın..."
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendBtn, asking && { opacity: 0.6 }]}
            onPress={handleAsk}
            disabled={asking}
          >
            <Ionicons name={asking ? 'hourglass-outline' : 'send'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {answer ? (
          <View style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.personal} />
              <Text style={styles.answerTitle}>FinansKoç</Text>
            </View>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        ) : null}
      </ScrollView>

      {activeLesson && (
        <QuizModal
          visible={showQuiz}
          questions={activeLesson.quiz || []}
          xp={activeLesson.xp}
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  levelBadge: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.personal, alignItems: 'center', justifyContent: 'center',
  },
  levelNum: { fontSize: 22, fontWeight: '700', color: '#fff' },
  levelInfo: { flex: 1 },
  levelTitle: { ...theme.typography.h3, color: colors.text.primary },
  xpText: { ...theme.typography.caption, color: colors.text.secondary, marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  badge: {
    backgroundColor: '#FEF3C7', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },
  askCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  askInput: {
    flex: 1, fontSize: 15, color: colors.text.primary,
    padding: theme.spacing.sm, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.personal, alignItems: 'center', justifyContent: 'center',
  },
  answerCard: {
    backgroundColor: '#EDE9FE', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: theme.spacing.sm,
  },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  answerTitle: { fontSize: 14, fontWeight: '700', color: colors.personal },
  answerText: { ...theme.typography.body, color: colors.text.primary, lineHeight: 22 },
});
