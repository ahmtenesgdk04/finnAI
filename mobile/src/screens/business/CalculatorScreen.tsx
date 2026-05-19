import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

type Tab = 'kdv' | 'kar' | 'iskonto' | 'faiz';

const TAB_COLORS: Record<Tab, string> = {
  kdv:     '#F97316',
  kar:     '#16A34A',
  iskonto: '#2563EB',
  faiz:    '#7C3AED',
};

const TABS: { id: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'kdv',     label: 'KDV',       icon: 'receipt-outline' },
  { id: 'kar',     label: 'Kar Marjı', icon: 'trending-up-outline' },
  { id: 'iskonto', label: 'İskonto',   icon: 'pricetag-outline' },
  { id: 'faiz',    label: 'Faiz',      icon: 'time-outline' },
];

function parseNum(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0;
}
function fmtMoney(n: number): string {
  if (!isFinite(n) || isNaN(n) || n < 0) return n < 0 ? `- ${Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺` : '—';
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
function fmtMoneyAbs(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—';
  return Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
function fmtPct(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—';
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

// ─── Shared UI ───────────────────────────────────────────────────────────────
function InfoCard({ text, color, icon }: { text: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={[sh.infoCard, { borderLeftColor: color, backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={16} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
      <Text style={[sh.infoText, { color: color + 'DD' }]}>{text}</Text>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={sh.fieldLabel}>{label}</Text>;
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return <View style={sh.resultCard}>{children}</View>;
}

function ResultRow({
  label, value, bold, color, sub,
}: { label: string; value: string; bold?: boolean; color?: string; sub?: string }) {
  return (
    <View style={sh.resultRow}>
      <View style={{ flex: 1 }}>
        <Text style={sh.resultLabel}>{label}</Text>
        {sub ? <Text style={sh.resultSub}>{sub}</Text> : null}
      </View>
      <Text style={[sh.resultValue, bold && sh.resultValueBold, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={sh.divider} />;
}

function HighlightResult({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[sh.highlightBox, { borderColor: color + '40', backgroundColor: color + '0E' }]}>
      <Text style={[sh.highlightLabel, { color: color + 'CC' }]}>{label}</Text>
      <Text style={[sh.highlightValue, { color }]}>{value}</Text>
    </View>
  );
}

function Toggle({ options, value, onChange }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={sh.toggleRow}>
      {options.map(o => (
        <TouchableOpacity
          key={o.id}
          style={[sh.toggleBtn, value === o.id && sh.toggleBtnActive]}
          onPress={() => onChange(o.id)}
        >
          <Text style={[sh.toggleText, value === o.id && sh.toggleTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── KDV ─────────────────────────────────────────────────────────────────────
const PRESET_RATES = [1, 10, 18, 20];

function KdvCalc() {
  const color = TAB_COLORS.kdv;
  const [tutar, setTutar]     = useState('');
  const [rateStr, setRateStr] = useState('20');
  const [customRate, setCustomRate] = useState('');
  const [useCustom, setUseCustom]   = useState(false);
  const [direction, setDir]   = useState<'haric' | 'dahil'>('haric');

  const rate = useCustom ? parseNum(customRate) : parseNum(rateStr);
  const val  = parseNum(tutar);

  let net = 0, kdv = 0, toplam = 0;
  if (direction === 'haric') {
    net    = val;
    kdv    = net * (rate / 100);
    toplam = net + kdv;
  } else {
    toplam = val;
    net    = toplam / (1 + rate / 100);
    kdv    = toplam - net;
  }
  const hasResult = val > 0 && rate > 0;

  return (
    <View style={sh.calcBody}>
      <InfoCard
        color={color}
        icon="information-circle-outline"
        text={
          'KDV (Katma Değer Vergisi), ürün ve hizmetlere devlet tarafından eklenen bir tüketim vergisidir.\n\n' +
          '• KDV Hariç → Dahil: Fiyata KDV eklemek istiyorsanız kullanın (örn: tedarikçiye ödeyeceğiniz fiyatı hesaplamak)\n' +
          '• KDV Dahil → Hariç: KDV\'li fiyattan net tutarı bulmak istiyorsanız kullanın (örn: müşteri fiyatından KDV\'yi çıkarmak)'
        }
      />

      <SectionLabel label="Hesaplama Yönü" />
      <Toggle
        value={direction}
        onChange={v => setDir(v as 'haric' | 'dahil')}
        options={[
          { id: 'haric', label: 'KDV Hariç → Dahil' },
          { id: 'dahil', label: 'KDV Dahil → Hariç' },
        ]}
      />

      <SectionLabel label="KDV Oranı" />
      <View style={sh.chipRow}>
        {PRESET_RATES.map(r => (
          <TouchableOpacity
            key={r}
            style={[sh.chip, !useCustom && parseNum(rateStr) === r && { borderColor: color, backgroundColor: color + '15' }]}
            onPress={() => { setRateStr(String(r)); setUseCustom(false); }}
          >
            <Text style={[sh.chipText, !useCustom && parseNum(rateStr) === r && { color, fontWeight: '700' }]}>%{r}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[sh.chip, useCustom && { borderColor: color, backgroundColor: color + '15' }]}
          onPress={() => setUseCustom(true)}
        >
          <Text style={[sh.chipText, useCustom && { color, fontWeight: '700' }]}>Diğer</Text>
        </TouchableOpacity>
      </View>

      {useCustom && (
        <TextInput
          style={sh.input}
          keyboardType="decimal-pad"
          placeholder="Oran girin (örn: 8)"
          placeholderTextColor={colors.text.muted}
          value={customRate}
          onChangeText={setCustomRate}
          autoFocus
        />
      )}

      <SectionLabel label={direction === 'haric' ? 'KDV Hariç Tutar (₺)' : 'KDV Dahil Tutar (₺)'} />
      <TextInput
        style={sh.input}
        keyboardType="decimal-pad"
        placeholder="0,00"
        placeholderTextColor={colors.text.muted}
        value={tutar}
        onChangeText={setTutar}
      />

      {hasResult && (
        <>
          <HighlightResult
            label={direction === 'haric' ? 'KDV Dahil Toplam' : 'KDV Hariç Net Tutar'}
            value={direction === 'haric' ? fmtMoneyAbs(toplam) : fmtMoneyAbs(net)}
            color={color}
          />
          <ResultCard>
            <ResultRow label="KDV Hariç (Net)" value={fmtMoneyAbs(net)} />
            <Divider />
            <ResultRow label={`KDV Tutarı (%${rate})`} value={fmtMoneyAbs(kdv)} color={color} />
            <Divider />
            <ResultRow label="KDV Dahil (Brüt)" value={fmtMoneyAbs(toplam)} bold />
          </ResultCard>
        </>
      )}
    </View>
  );
}

// ─── KAR MARJI ───────────────────────────────────────────────────────────────
function KarCalc() {
  const color = TAB_COLORS.kar;
  const [maliyet, setMaliyet] = useState('');
  const [value, setValue]     = useState('');
  const [mode, setMode]       = useState<'fiyat' | 'marj'>('fiyat');

  const m = parseNum(maliyet);
  const v = parseNum(value);

  let satis = 0, kar = 0, marjPct = 0, markupPct = 0;
  if (mode === 'fiyat') {
    satis     = v;
    kar       = satis - m;
    marjPct   = satis > 0 ? (kar / satis) * 100 : 0;
    markupPct = m > 0 ? (kar / m) * 100 : 0;
  } else {
    satis     = m > 0 && v > 0 && v < 100 ? m / (1 - v / 100) : 0;
    kar       = satis - m;
    marjPct   = v;
    markupPct = m > 0 ? (kar / m) * 100 : 0;
  }
  const hasResult = m > 0 && v > 0 && (mode === 'fiyat' ? true : v < 100);
  const isProfit  = kar >= 0;

  return (
    <View style={sh.calcBody}>
      <InfoCard
        color={color}
        icon="information-circle-outline"
        text={
          'Kar marjı ve markup iki farklı ölçümdür:\n\n' +
          '• Kar Marjı (%): Satış fiyatının yüzde kaçı kardır.\n  Örn: 70₺ maliyetli ürün 100₺\'ye satılırsa → Kar Marjı = %30\n\n' +
          '• Markup (%): Maliyetin üzerine ne kadar eklenmiştir.\n  Örn: 70₺ maliyet, 30₺ kar → Markup = %42,86\n\n' +
          '"Satış Fiyatı ile" modunda fiyat girip karlılığı görün.\n' +
          '"Hedef Marj ile" modunda istediğiniz marjı girin, satış fiyatı otomatik hesaplansın.'
        }
      />

      <SectionLabel label="Hesaplama Modu" />
      <Toggle
        value={mode}
        onChange={v => { setMode(v as 'fiyat' | 'marj'); setValue(''); }}
        options={[
          { id: 'fiyat', label: 'Satış Fiyatı ile' },
          { id: 'marj',  label: 'Hedef Marj ile' },
        ]}
      />

      <SectionLabel label="Maliyet Fiyatı (₺)" />
      <TextInput
        style={sh.input}
        keyboardType="decimal-pad"
        placeholder="Ürünün/hizmetin size maliyeti"
        placeholderTextColor={colors.text.muted}
        value={maliyet}
        onChangeText={setMaliyet}
      />

      <SectionLabel label={mode === 'fiyat' ? 'Satış Fiyatı (₺)' : 'Hedef Kar Marjı (%)'} />
      <TextInput
        style={sh.input}
        keyboardType="decimal-pad"
        placeholder={mode === 'fiyat' ? 'Müşteriye satış fiyatı' : 'Örn: 30 → %30 marj'}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={setValue}
      />

      {hasResult && (
        <>
          <HighlightResult
            label={mode === 'fiyat' ? (isProfit ? 'Kar Tutarı' : 'Zarar Tutarı') : 'Hesaplanan Satış Fiyatı'}
            value={mode === 'fiyat' ? fmtMoneyAbs(kar) : fmtMoneyAbs(satis)}
            color={isProfit ? color : colors.danger}
          />
          <ResultCard>
            <ResultRow label="Maliyet" value={fmtMoneyAbs(m)} />
            <Divider />
            <ResultRow
              label={mode === 'fiyat' ? 'Satış Fiyatı' : 'Hesaplanan Satış Fiyatı'}
              value={fmtMoneyAbs(satis)}
            />
            <Divider />
            <ResultRow
              label={isProfit ? 'Kar Tutarı' : 'Zarar Tutarı'}
              value={fmtMoneyAbs(kar)}
              color={isProfit ? color : colors.danger}
            />
            <Divider />
            <ResultRow
              label="Kar Marjı"
              value={fmtPct(marjPct)}
              color={isProfit ? color : colors.danger}
              sub="Satış fiyatının ne kadarı kar?"
            />
            <Divider />
            <ResultRow
              label="Markup"
              value={fmtPct(markupPct)}
              sub="Maliyet üzerine ne kadar eklendi?"
              bold
            />
          </ResultCard>
        </>
      )}
    </View>
  );
}

// ─── İSKONTO ─────────────────────────────────────────────────────────────────
const QUICK_RATES = [5, 10, 15, 20, 25, 30];

function IskontoCalc() {
  const color = TAB_COLORS.iskonto;
  const [fiyat, setFiyat]     = useState('');
  const [iskonto, setIskonto] = useState('');

  const f       = parseNum(fiyat);
  const r       = parseNum(iskonto);
  const indirim = f * (r / 100);
  const sonFiyat = f - indirim;
  const hasResult = f > 0 && r > 0;

  return (
    <View style={sh.calcBody}>
      <InfoCard
        color={color}
        icon="information-circle-outline"
        text={
          'İskonto, bir ürün veya hizmetin liste/etiket fiyatından yapılan indirimdir.\n\n' +
          'Günlük hayatta sıkça kullanıldığı yerler:\n' +
          '• Toplu alımlarda tedarikçinizin size yaptığı fiyat indirimi\n' +
          '• Müşterinize uyguladığınız kampanya/promosyon indirimi\n' +
          '• Ticari faturalarda "ticari iskonto" kalemi\n\n' +
          'Örn: 1.000₺ liste fiyatlı bir ürüne %20 iskonto → 200₺ indirim → 800₺ son fiyat'
        }
      />

      <SectionLabel label="Liste / Etiket Fiyatı (₺)" />
      <TextInput
        style={sh.input}
        keyboardType="decimal-pad"
        placeholder="İndirim öncesi fiyat"
        placeholderTextColor={colors.text.muted}
        value={fiyat}
        onChangeText={setFiyat}
      />

      <SectionLabel label="İskonto Oranı (%)" />
      <TextInput
        style={sh.input}
        keyboardType="decimal-pad"
        placeholder="İndirim oranını girin"
        placeholderTextColor={colors.text.muted}
        value={iskonto}
        onChangeText={setIskonto}
      />

      <View style={sh.chipRow}>
        {QUICK_RATES.map(r => (
          <TouchableOpacity
            key={r}
            style={[sh.chip, parseNum(iskonto) === r && { borderColor: color, backgroundColor: color + '15' }]}
            onPress={() => setIskonto(String(r))}
          >
            <Text style={[sh.chipText, parseNum(iskonto) === r && { color, fontWeight: '700' }]}>%{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasResult && (
        <>
          <HighlightResult label="İndirimli Son Fiyat" value={fmtMoneyAbs(sonFiyat)} color={color} />
          <ResultCard>
            <ResultRow label="Liste Fiyatı" value={fmtMoneyAbs(f)} />
            <Divider />
            <ResultRow
              label={`İskonto Tutarı (%${r})`}
              value={`- ${fmtMoneyAbs(indirim)}`}
              color={colors.danger}
              sub="Yapılan indirim"
            />
            <Divider />
            <ResultRow label="Son Fiyat (İndirimli)" value={fmtMoneyAbs(sonFiyat)} bold color={color} />
          </ResultCard>
        </>
      )}
    </View>
  );
}

// ─── FAİZ ────────────────────────────────────────────────────────────────────
function FaizCalc() {
  const color = TAB_COLORS.faiz;
  const [anaPara, setAnaPara]     = useState('');
  const [faizOrani, setFaizOrani] = useState('');
  const [sure, setSure]           = useState('');
  const [unit, setUnit]           = useState<'ay' | 'yil'>('ay');
  const [type, setType]           = useState<'basit' | 'bilesen'>('basit');

  const p      = parseNum(anaPara);
  const r      = parseNum(faizOrani);
  const t      = parseNum(sure);
  const aylar  = unit === 'ay' ? t : t * 12;
  const sureYil = aylar / 12;

  let faiz = 0, toplam = 0, aylikOran = 0;
  if (type === 'basit') {
    faiz   = p * (r / 100) * sureYil;
    toplam = p + faiz;
  } else {
    aylikOran = r / 100 / 12;
    toplam    = p * Math.pow(1 + aylikOran, aylar);
    faiz      = toplam - p;
  }
  const hasResult = p > 0 && r > 0 && t > 0;

  return (
    <View style={sh.calcBody}>
      <InfoCard
        color={color}
        icon="information-circle-outline"
        text={
          'Faiz, bir parayı kullanmanın bedeli ya da yatırdığınız paranın kazancıdır.\n\n' +
          '• Basit Faiz: Her dönem sadece ana para üzerinden faiz hesaplanır.\n  Formül: Ana Para × Oran × Süre\n  Kullanım: Kısa vadeli krediler, vadeli hesaplar\n\n' +
          '• Bileşik Faiz: Kazanılan faiz de ana paraya eklenerek bir sonraki dönem daha fazla faiz üretir. "Faizin faizi" olarak da bilinir.\n  Kullanım: Uzun vadeli yatırımlar, mevduat hesapları'
        }
      />

      <SectionLabel label="Faiz Türü" />
      <Toggle
        value={type}
        onChange={v => setType(v as 'basit' | 'bilesen')}
        options={[
          { id: 'basit',   label: 'Basit Faiz' },
          { id: 'bilesen', label: 'Bileşik Faiz' },
        ]}
      />

      <SectionLabel label="Ana Para (₺)" />
      <TextInput
        style={sh.input}
        keyboardType="decimal-pad"
        placeholder="Yatırılan / kredi ana parası"
        placeholderTextColor={colors.text.muted}
        value={anaPara}
        onChangeText={setAnaPara}
      />

      <SectionLabel label="Yıllık Faiz Oranı (%)" />
      <TextInput
        style={sh.input}
        keyboardType="decimal-pad"
        placeholder="Örn: 45 → %45 yıllık faiz"
        placeholderTextColor={colors.text.muted}
        value={faizOrani}
        onChangeText={setFaizOrani}
      />

      <SectionLabel label="Süre" />
      <View style={sh.sureRow}>
        <TextInput
          style={[sh.input, { flex: 1 }]}
          keyboardType="decimal-pad"
          placeholder="Süre girin"
          placeholderTextColor={colors.text.muted}
          value={sure}
          onChangeText={setSure}
        />
        <View style={sh.unitToggle}>
          {(['ay', 'yil'] as const).map(u => (
            <TouchableOpacity
              key={u}
              style={[sh.unitBtn, unit === u && [sh.unitBtnActive, { backgroundColor: color + '20' }]]}
              onPress={() => setUnit(u)}
            >
              <Text style={[sh.unitBtnText, unit === u && { color, fontWeight: '700' }]}>
                {u === 'ay' ? 'Ay' : 'Yıl'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {hasResult && (
        <>
          <HighlightResult label="Toplam Tutar" value={fmtMoneyAbs(toplam)} color={color} />
          <ResultCard>
            <ResultRow label="Ana Para" value={fmtMoneyAbs(p)} />
            <Divider />
            <ResultRow
              label="Yıllık Oran"
              value={fmtPct(r)}
              sub={type === 'bilesen' ? `Aylık: ${fmtPct(aylikOran * 100)}` : undefined}
            />
            <Divider />
            <ResultRow
              label="Süre"
              value={`${t} ${unit === 'ay' ? 'Ay' : 'Yıl'}`}
              sub={`${aylar} ay = ${(sureYil).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} yıl`}
            />
            <Divider />
            <ResultRow
              label={type === 'basit' ? 'Faiz Kazancı' : 'Bileşik Faiz Kazancı'}
              value={fmtMoneyAbs(faiz)}
              color={color}
              sub={type === 'bilesen' ? 'Faizin faizi dahil' : undefined}
            />
            <Divider />
            <ResultRow label="Toplam (Ana Para + Faiz)" value={fmtMoneyAbs(toplam)} bold />
          </ResultCard>

          {type === 'bilesen' && p > 0 && r > 0 && (
            <View style={sh.noteCard}>
              <Ionicons name="bulb-outline" size={14} color={color} />
              <Text style={[sh.noteText, { color: color + 'CC' }]}>
                Bileşik faiz, aynı tutar ve oranla basit faize kıyasla {fmtMoneyAbs(faiz - p * (r / 100) * sureYil)} daha fazla kazandırır.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CalculatorScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('kdv');
  const accentColor = TAB_COLORS[activeTab];

  return (
    <SafeAreaView style={sh.safe}>
      <View style={sh.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={sh.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={sh.title}>Finansal Hesap Makinesi</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={sh.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const tc = TAB_COLORS[tab.id];
          return (
            <TouchableOpacity
              key={tab.id}
              style={[sh.tab, isActive && { borderBottomColor: tc, borderBottomWidth: 2.5 }]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[sh.tabIconWrap, isActive && { backgroundColor: tc + '18' }]}>
                <Ionicons name={tab.icon} size={16} color={isActive ? tc : colors.text.muted} />
              </View>
              <Text style={[sh.tabText, isActive && { color: tc, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={sh.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'kdv'     && <KdvCalc />}
        {activeTab === 'kar'     && <KarCalc />}
        {activeTab === 'iskonto' && <IskontoCalc />}
        {activeTab === 'faiz'    && <FaizCalc />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: colors.text.primary },

  tabBar: {
    flexDirection: 'row', backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  tabText: { fontSize: 10, fontWeight: '600', color: colors.text.muted },

  scrollContent: { padding: 16, paddingBottom: 60 },

  calcBody: { gap: 2 },

  infoCard: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14,
    borderLeftWidth: 3, marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 19, fontWeight: '500' },

  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: colors.text.secondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 14, marginBottom: 8,
  },

  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 16,
    color: colors.text.primary, backgroundColor: colors.card,
    marginBottom: 2,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },

  toggleRow: {
    flexDirection: 'row', backgroundColor: colors.background,
    borderRadius: 12, padding: 3, gap: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  toggleText: { fontSize: 12, fontWeight: '600', color: colors.text.muted },
  toggleTextActive: { color: colors.text.primary, fontWeight: '700' },

  sureRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  unitToggle: {
    flexDirection: 'row', backgroundColor: colors.background,
    borderRadius: 10, padding: 3, gap: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  unitBtnActive: {},
  unitBtnText: { fontSize: 13, fontWeight: '600', color: colors.text.muted },

  highlightBox: {
    borderRadius: 14, borderWidth: 1.5, padding: 16,
    alignItems: 'center', marginTop: 20, marginBottom: 10,
  },
  highlightLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  highlightValue: { fontSize: 28, fontWeight: '800' },

  resultCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 12,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  resultLabel: { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
  resultSub: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  resultValue: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  resultValueBold: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border },

  noteCard: {
    flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12,
    backgroundColor: TAB_COLORS.faiz + '10', borderWidth: 1, borderColor: TAB_COLORS.faiz + '30',
    marginTop: 4,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },
});
