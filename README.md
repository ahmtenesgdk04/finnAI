# FinnAI — Yapay Zeka Destekli Kişisel Finans ve İşletme Yönetim Uygulaması

FinnAI, hem bireysel kullanıcılara hem de küçük işletme sahiplerine yönelik, yapay zeka destekli bir mobil finans ve e-ticaret uygulamasıdır. Türkiye'ye özgü enflasyon ortamı, döviz dalgalanmaları ve KOBİ dinamikleri gözetilerek geliştirilmiştir.

---

## Uygulama Modları

Kullanıcılar kayıt sırasında iki moddan birini seçer. Her mod kendi arayüzü ve özellik setiyle çalışır.

### Kişisel Mod
- **Harcama Takibi** — Gelir ve giderler kategorilere göre kaydedilir; aylık özet ve trend grafikleri sunulur
- **BütçePilot** — Kategorilere göre aylık limit tanımlanır; aşım durumunda yapay zeka uyarı ve öneri üretir
- **Tasarruf Hedefleri** — Hedefe ne kadar kaldığı takip edilir
- **Finansal Sağlık Skoru** — Gelir-gider dengesi, birikim oranı ve borç durumu tek bir skorla gösterilir
- **FinansKoç** — 3 seviye, 9 konu, 27 ders içeren finansal okuryazarlık müfredatı; her dersin sonunda quiz; kullanıcı istediği zaman yapay zekaya finans sorusu sorabilir
- **GüvenliAlış** — Bir e-ticaret sitesinin URL'si girilir; yapay zeka SSL, domain yaşı, içerik ve itibar analizini 5 katmanlı güvenlik raporu olarak sunar
- **Döviz Kurları** — Anlık kur bilgisi ve geçmiş grafik

### İşletme Modu
- **NakitRadar** — Gelir ve giderler kaydedilir; yapay zeka kısa (30-60-90 gün), orta (6-9-12 ay) ve uzun vadeli (1-2-3 yıl) nakit akışı tahmini üretir
- **Akıllı Gider Analizi** — Gider geçmişi yapay zeka tarafından analiz edilir; tasarruf fırsatları, anomaliler ve optimizasyon önerileri raporlanır
- **TahsilatAI** — Müşteri alacakları kaydedilir; yapay zeka her alacak için tahsilat olasılık skoru ve iletişim taslağı üretir
- **GüvenliAlış / Tedarikçi Analizi** — Tedarikçi adı ve ürün bilgisi girilerek piyasa itibarı, fiyat analizi, ödeme koşulları riski ve yasal uyumluluk değerlendirmesi alınır
- **Pazar Yeri** — İşletmeler ürün ve hizmetlerini listeler; alıcı-satıcı eşleşmesi, mesajlaşma ve sipariş takibi
- **Rehber** — Uygulama içi ticari iletişim için müşteri/tedarikçi rehberi

---

## Teknoloji Altyapısı

| Katman | Teknoloji |
|---|---|
| Mobil | React Native, Expo, TypeScript |
| Backend | Node.js, Express.js |
| Veritabanı | PostgreSQL |
| Yapay Zeka | Google Gemini API (gemini-2.5-flash) |
| Kimlik Doğrulama | JWT |
| E-posta | Gmail SMTP |

---

## Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL
- Expo CLI (`npm install -g expo-cli`)
- Expo Go uygulaması (telefonda test için)

---

### 1. Repoyu Klonla

```bash
git clone https://github.com/ahmtenesgdk04/finnAI.git
cd finnAI
```

---

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

`backend/.env` dosyası oluştur ve aşağıdaki değişkenleri doldur:

```env
PORT=3000
DATABASE_URL=postgresql://kullanici:sifre@localhost:5432/finnai
JWT_SECRET=gizli_anahtar
GEMINI_API_KEY=google_gemini_api_anahtarin
SMTP_USER=gmail_adresin@gmail.com
SMTP_PASS=gmail_uygulama_sifresi
```

Veritabanını başlat:

```bash
npm run db:migrate
```

Backend'i çalıştır:

```bash
npm run dev
```

Backend varsayılan olarak `http://localhost:3000` adresinde çalışır.

---

### 3. Mobil Kurulum

```bash
cd mobile
npm install
```

`mobile/.env` dosyasındaki API adresini güncelle:

```env
EXPO_PUBLIC_API_URL=http://BILGISAYAR_IP:3000
```

> Bilgisayarın yerel IP adresini öğrenmek için Windows'ta `ipconfig`, Mac/Linux'ta `ifconfig` komutunu kullan.

---

## Uygulamayı Çalıştırma

### Expo Go ile Telefonda Test (Önerilen)

1. Telefona **Expo Go** uygulamasını indir
   - [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Bilgisayar ve telefon **aynı WiFi ağına** bağlı olsun

3. Terminalde çalıştır:

```bash
cd mobile
npx expo start
```

4. Terminalde bir QR kodu belirecek
   - **iPhone:** Kamerayı QR'a tut → Expo Go'da aç
   - **Android:** Expo Go uygulamasını aç → QR kodu tara

Uygulama telefonda açılır ve kaydedilen değişiklikler anında yansır.

---

### Android Emülatör

```bash
npx expo start --android
```

### iOS Simülatör (sadece Mac)

```bash
npx expo start --ios
```

---

## Proje Yapısı

```
finnAI/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API endpoint işleyicileri
│   │   ├── routes/          # Express route tanımları
│   │   ├── services/        # Yapay zeka ve iş mantığı
│   │   ├── middleware/      # Auth ve diğer middleware'ler
│   │   └── config/          # Veritabanı bağlantısı
│   └── .env                 # Ortam değişkenleri (commit edilmez)
│
└── mobile/
    └── src/
        ├── screens/
        │   ├── personal/    # Kişisel mod ekranları
        │   └── business/    # İşletme modu ekranları
        ├── components/      # Ortak UI bileşenleri
        ├── services/        # API çağrıları
        ├── navigation/      # Ekran yönlendirme
        └── constants/       # Renkler ve sabitler
```

---

## Notlar

- `backend/.env` dosyası `.gitignore`'a eklenmiştir, asla commit edilmemelidir
- Gemini API anahtarı [Google AI Studio](https://aistudio.google.com) üzerinden alınabilir
- Gmail SMTP için Google hesabında **Uygulama Şifresi** oluşturulması gerekmektedir
