import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import Button from '../common/Button';

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface QuizModalProps {
  visible: boolean;
  questions: Question[];
  xp: number;
  onComplete: (correct: number) => void;
  onClose: () => void;
}

export default function QuizModal({ visible, questions, xp, onComplete, onClose }: QuizModalProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const q = questions[current];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.answer) setCorrect((c) => c + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleClose = () => {
    if (finished) onComplete(correct);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setCorrect(0);
    setFinished(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {finished ? (
            <View style={styles.result}>
              <Ionicons name="trophy" size={64} color="#F59E0B" />
              <Text style={styles.resultTitle}>Quiz Tamamlandı!</Text>
              <Text style={styles.resultSub}>{correct}/{questions.length} doğru</Text>
              <Text style={styles.xpEarned}>+{Math.round(xp * (correct / questions.length))} XP kazandın</Text>
              <Button title="Kapat" onPress={handleClose} style={styles.closeBtn} />
            </View>
          ) : (
            <>
              <View style={styles.topRow}>
                <Text style={styles.progress}>{current + 1}/{questions.length}</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.question}>{q.question}</Text>
              <View style={styles.options}>
                {q.options.map((opt, idx) => {
                  let bg = colors.card;
                  let border = colors.border;
                  if (answered) {
                    if (idx === q.answer) { bg = '#D1FAE5'; border = '#10B981'; }
                    else if (idx === selected) { bg = '#FEE2E2'; border = '#EF4444'; }
                  } else if (selected === idx) {
                    border = colors.primary;
                  }
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                      onPress={() => handleSelect(idx)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {answered && (
                <Button
                  title={current + 1 >= questions.length ? 'Bitir' : 'Sonraki'}
                  onPress={handleNext}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    paddingBottom: 40,
    minHeight: 420,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progress: {
    ...theme.typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  question: {
    ...theme.typography.h3,
    color: colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  options: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  option: {
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  optionText: {
    ...theme.typography.body,
    color: colors.text.primary,
  },
  result: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  resultTitle: {
    ...theme.typography.h2,
    color: colors.text.primary,
  },
  resultSub: {
    ...theme.typography.body,
    color: colors.text.secondary,
  },
  xpEarned: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  closeBtn: {
    marginTop: theme.spacing.md,
    width: 160,
  },
});
