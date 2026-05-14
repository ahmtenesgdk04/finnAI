# FinnAI — Türkiye'ye Özel AI Destekli Finansal Sağlık Platformu

Türkiye'de KOBİ sahibi ile birey çoğunlukla aynı kişidir.
FinnAI, her ikisini tek çatı altında toplayan, Türkiye'nin enflasyonlu
ortamını anlayan, sadece veri göstermeyen aynı zamanda öğreten bir AI platformudur.

## Modlar
- **İşletme Modu** — Akıllı Gider Analizi, NakitRadar, TahsilatAI, GüvenliAlış
- **Kişisel Mod** — BütçePilot, FinansKoç, GüvenliAlış, Finansal Sağlık Skoru

## Stack
- Mobile: React Native (Expo) + TypeScript
- Backend: Node.js + Express (MVC)
- DB: PostgreSQL
- AI: Claude API (Anthropic)

## Kurulum
### Backend
cd backend && npm install && cp .env.example .env && npm run dev

### Mobile
cd mobile && npm install && npx expo start

### Telefonda Görme (Expo Go)
1. App Store / Play Store'dan Expo Go'yu indir
2. Telefon ve bilgisayar aynı WiFi'da olsun
3. npx expo start çalıştır → QR çıkar → tara → uygulama açılır
