require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const db = require('../config/database');
const bcrypt = require('bcryptjs');

const PASSWORD = 'demo123';

const FIRMS = [
  {
    name: 'Anadolu Tekstil A.Ş.',
    email: 'firma1@demo.com',
    city: 'İstanbul',
    listings: [
      {
        title: 'Pamuklu Dokuma Kumaş – 200 gr/m²',
        category: 'Tekstil',
        description: '%100 pamuk, beyaz ham bez. Konfeksiyon üretimi için uygun. Minimum sipariş 500 metre. Sertifikalı üretim.',
        unitPrice: 85,
        currency: 'TRY',
        minOrderQty: 500,
        unit: 'metre',
        totalStock: 50000,
        deliveryTime: '5 iş günü',
        deliveryMethod: 'Kargo',
        paymentTerms: 'Peşin veya 30 gün vadeli',
        contactPreference: ['Telefon'],
      },
      {
        title: 'Polyester İplik – 150 Denye',
        category: 'Tekstil',
        description: 'Yüksek mukavemetli polyester iplik. Dokuma ve örme sektörüne uygun. Makara başı 5 kg, palet alımlarında indirim.',
        unitPrice: 42,
        currency: 'TRY',
        minOrderQty: 100,
        unit: 'kg',
        totalStock: 20000,
        deliveryTime: '3 iş günü',
        deliveryMethod: 'Kargo veya teslim',
        paymentTerms: 'Peşin',
        contactPreference: ['WhatsApp'],
      },
    ],
  },
  {
    name: 'Güneş Gıda Ltd. Şti.',
    email: 'firma2@demo.com',
    city: 'Gaziantep',
    listings: [
      {
        title: 'Naturel Sızma Zeytinyağı – 5 lt Teneke',
        category: 'Gıda & İçecek',
        description: 'Soğuk sıkım, erken hasat. Asitlik %0.3 altında. Gıda sicil belgeli tesis. İhracat belgeli ürün.',
        unitPrice: 620,
        currency: 'TRY',
        minOrderQty: 20,
        unit: 'adet',
        totalStock: 2000,
        deliveryTime: '2 iş günü',
        deliveryMethod: 'Kargo',
        paymentTerms: 'Peşin veya havale',
        contactPreference: ['E-posta'],
      },
      {
        title: 'Antep Fıstıklı Baklava – Kg',
        category: 'Gıda & İçecek',
        description: 'El açması yufka, %30 fıstık dolgu. Toptan satış için özel ambalaj seçenekleri mevcuttur. HACCP belgeli.',
        unitPrice: 950,
        currency: 'TRY',
        minOrderQty: 5,
        unit: 'kg',
        totalStock: 500,
        deliveryTime: '1 iş günü',
        deliveryMethod: 'Soğuk zincir kargo',
        paymentTerms: 'Peşin',
        contactPreference: ['Telefon'],
      },
    ],
  },
  {
    name: 'Metro İnşaat Malzemeleri',
    email: 'firma3@demo.com',
    city: 'İzmir',
    listings: [
      {
        title: 'CEM I 42.5R Portland Çimento – Ton',
        category: 'İnşaat Malzemesi',
        description: 'Yüksek erken dayanımlı çimento. TSE belgeli. Dökme veya torbalı (50 kg) seçeneği. Bölge bayiliği müsait.',
        unitPrice: 2850,
        currency: 'TRY',
        minOrderQty: 10,
        unit: 'ton',
        totalStock: 5000,
        deliveryTime: '1-2 iş günü',
        deliveryMethod: 'Vinçli araç ile teslim',
        paymentTerms: '15 gün vadeli',
        contactPreference: ['Telefon'],
      },
      {
        title: 'Kırmızı Delikli Tuğla – Palet',
        category: 'İnşaat Malzemesi',
        description: '19x13.5x8.5 cm standart kırmızı tuğla. Palet: 330 adet. Fabrika çıkışı fiyatı. İzmir ve çevre illere nakliye.',
        unitPrice: 3200,
        currency: 'TRY',
        minOrderQty: 5,
        unit: 'palet',
        totalStock: 800,
        deliveryTime: '3 iş günü',
        deliveryMethod: 'Şantiyeye teslim',
        paymentTerms: 'Peşin veya 30 gün',
        contactPreference: ['WhatsApp'],
      },
    ],
  },
  {
    name: 'TechPro Elektronik San.',
    email: 'firma4@demo.com',
    city: 'Bursa',
    listings: [
      {
        title: 'Endüstriyel LED Panel Aydınlatma – 60W',
        category: 'Elektronik',
        description: '60W, 6000 lümen, IP65 korumalı. Fabrika ve depo aydınlatması için ideal. 5 yıl üretici garantisi. CE belgeli.',
        unitPrice: 480,
        currency: 'TRY',
        minOrderQty: 10,
        unit: 'adet',
        totalStock: 5000,
        deliveryTime: '3 iş günü',
        deliveryMethod: 'Kargo',
        paymentTerms: '30 gün vadeli',
        contactPreference: ['E-posta'],
      },
      {
        title: 'Online UPS – 10 kVA Rack Tipi',
        category: 'Elektronik',
        description: 'Çift dönüşümlü online UPS. 10 kVA / 9 kW. Rack mount 6U. Paralel bağlantı özelliği. Yerinde kurulum hizmeti.',
        unitPrice: 28500,
        currency: 'TRY',
        minOrderQty: 1,
        unit: 'adet',
        totalStock: 50,
        deliveryTime: '5 iş günü',
        deliveryMethod: 'Kurulum ekibi ile teslim',
        paymentTerms: '%30 peşin, kalan teslimat',
        contactPreference: ['Telefon'],
      },
    ],
  },
  {
    name: 'Özdemir Hammadde Tic.',
    email: 'firma5@demo.com',
    city: 'Ankara',
    listings: [
      {
        title: 'Alüminyum Alaşım Granül – A380',
        category: 'Hammadde',
        description: 'Döküm kalitesinde A380 alüminyum granül. Analiz sertifikası ile teslim. Çuval veya big-bag ambalaj seçeneği.',
        unitPrice: 125,
        currency: 'TRY',
        minOrderQty: 1000,
        unit: 'kg',
        totalStock: 100000,
        deliveryTime: '5 iş günü',
        deliveryMethod: 'TIR ile teslim',
        paymentTerms: '60 gün vadeli',
        contactPreference: ['E-posta'],
      },
      {
        title: 'Bakır Hurda – Parlak Tel',
        category: 'Hammadde',
        description: 'Parlak bakır tel hurda. Safsızlık <%2. Spot fiyat üzerinden alım satım. Günlük fiyat güncelleme.',
        unitPrice: 420,
        currency: 'TRY',
        minOrderQty: 500,
        unit: 'kg',
        totalStock: 30000,
        deliveryTime: 'Anlaşmaya göre',
        deliveryMethod: 'Alıcı taşır veya biz göndeririz',
        paymentTerms: 'Peşin',
        contactPreference: ['WhatsApp'],
      },
    ],
  },
  {
    name: 'Hızlı Lojistik A.Ş.',
    email: 'firma6@demo.com',
    city: 'Kocaeli',
    listings: [
      {
        title: 'Tam Kamyon Yük Taşımacılığı (FTL)',
        category: 'Lojistik & Taşımacılık',
        description: 'Türkiye geneli tam kamyon taşımacılık. 33 ton kapasiteli tır filosu. GPS takip, sigortalı taşıma. Günlük sefer.',
        unitPrice: 8500,
        currency: 'TRY',
        minOrderQty: 1,
        unit: 'sefer',
        totalStock: null,
        deliveryTime: 'Rota mesafesine göre',
        deliveryMethod: 'Kapıdan kapıya',
        paymentTerms: 'Teslimatta ödeme',
        contactPreference: ['Telefon'],
      },
      {
        title: 'Soğuk Zincir Lojistik – Gıda Sektörü',
        category: 'Lojistik & Taşımacılık',
        description: '-18°C ile +6°C arası kontrollü taşıma. Frigorifik araç filosu. HACCP uyumlu süreç. 7/24 sıcaklık takibi.',
        unitPrice: 12000,
        currency: 'TRY',
        minOrderQty: 1,
        unit: 'sefer',
        totalStock: null,
        deliveryTime: 'Anlaşmaya göre',
        deliveryMethod: 'Kapıdan kapıya soğuk zincir',
        paymentTerms: '15 gün vadeli',
        contactPreference: ['E-posta'],
      },
    ],
  },
  {
    name: 'Kimsan Kimya ve Plastik',
    email: 'firma7@demo.com',
    city: 'Adana',
    listings: [
      {
        title: 'Endüstriyel Alkalin Temizleyici – 25 lt',
        category: 'Kimya & Plastik',
        description: 'Metal ve sert zemin temizliği için konsantre alkali formül. 1:20 oranında kullanım. SDS belgesi mevcuttur.',
        unitPrice: 380,
        currency: 'TRY',
        minOrderQty: 20,
        unit: 'adet',
        totalStock: 3000,
        deliveryTime: '3 iş günü',
        deliveryMethod: 'Kargo',
        paymentTerms: 'Peşin veya 30 gün',
        contactPreference: ['WhatsApp'],
      },
      {
        title: 'PVC Granül – K-70 Sert',
        category: 'Kimya & Plastik',
        description: 'Sert PVC profil üretimine uygun K-70 granül. 25 kg çuvallı. Renk masterbatch ile birlikte satış yapılır.',
        unitPrice: 68,
        currency: 'TRY',
        minOrderQty: 1000,
        unit: 'kg',
        totalStock: 50000,
        deliveryTime: '5 iş günü',
        deliveryMethod: 'Palet ile kargo veya TIR',
        paymentTerms: '45 gün vadeli',
        contactPreference: ['E-posta'],
      },
    ],
  },
  {
    name: 'Ambalaj Plus Ltd. Şti.',
    email: 'firma8@demo.com',
    city: 'Antalya',
    listings: [
      {
        title: 'Çift Oluklu Karton Kutu – Özel Ölçü',
        category: 'Ambalaj',
        description: 'B/C flüt çift oluklu mukavva kutu. Özel ölçü ve baskı imkânı. Minimum sipariş 500 adet. Gıda temasına uygun.',
        unitPrice: 18,
        currency: 'TRY',
        minOrderQty: 500,
        unit: 'adet',
        totalStock: 200000,
        deliveryTime: '7 iş günü (baskılı)',
        deliveryMethod: 'Kargo veya nakliye',
        paymentTerms: '%50 avans, kalan teslimat',
        contactPreference: ['E-posta'],
      },
      {
        title: 'Şeffaf Streç Film – 500 mm x 23 mic',
        category: 'Ambalaj',
        description: 'Palet sarma için makine tipi streç film. 23 mikron, 500 mm en. Kol başı 17 kg. Palet alımında kargo bedava.',
        unitPrice: 290,
        currency: 'TRY',
        minOrderQty: 10,
        unit: 'kol',
        totalStock: 10000,
        deliveryTime: '2 iş günü',
        deliveryMethod: 'Kargo',
        paymentTerms: 'Peşin',
        contactPreference: ['WhatsApp'],
      },
    ],
  },
  {
    name: 'Makson Makine San. Tic.',
    email: 'firma9@demo.com',
    city: 'Konya',
    listings: [
      {
        title: 'CNC Freze Tezgahı – 3 Eksen 1060x600',
        category: 'Makine & Ekipman',
        description: '3 eksen, 1060x600x600 mm işleme alanı. 8000 rpm iş mili. Fanuc kontrol sistemi. Yerinde kurulum ve eğitim dahil.',
        unitPrice: 850000,
        currency: 'TRY',
        minOrderQty: 1,
        unit: 'adet',
        totalStock: 5,
        deliveryTime: '15 iş günü',
        deliveryMethod: 'Vinçli araç + kurulum ekibi',
        paymentTerms: '%40 avans, kalan teslimat',
        contactPreference: ['Telefon'],
      },
      {
        title: 'Hidrolik Sac Bükme Presi – 100 Ton',
        category: 'Makine & Ekipman',
        description: '100 ton, 3200 mm tabla genişliği. CNC arka durduruculu. Avrupa kalıp uyumlu. İkinci el A sınıfı, revizyon yapılmış.',
        unitPrice: 420000,
        currency: 'TRY',
        minOrderQty: 1,
        unit: 'adet',
        totalStock: 2,
        deliveryTime: '10 iş günü',
        deliveryMethod: 'Nakliye + montaj',
        paymentTerms: 'Peşin veya kredi kartı',
        contactPreference: ['WhatsApp'],
      },
    ],
  },
  {
    name: 'Bereketli Tarım Koop.',
    email: 'firma10@demo.com',
    city: 'Şanlıurfa',
    listings: [
      {
        title: 'Ekmeklik Buğday – Sertifikalı Tohum',
        category: 'Tarım & Hayvancılık',
        description: 'Bezostaya-1 çeşidi sertifikalı buğday. Rutubet <%12, protein >%12. Çuval veya dökme. TMO uyumlu analiz belgesi.',
        unitPrice: 11.5,
        currency: 'TRY',
        minOrderQty: 10000,
        unit: 'kg',
        totalStock: 500000,
        deliveryTime: '3 iş günü',
        deliveryMethod: 'TIR ile çiftlik çıkışı',
        paymentTerms: 'Peşin veya banka havalesi',
        contactPreference: ['Telefon'],
      },
      {
        title: 'Ham Pamuk Balyası – Birinci Sınıf',
        category: 'Tarım & Hayvancılık',
        description: 'Birinci sınıf pamuk, lif uzunluğu 28-30 mm. Balya ağırlığı ~220 kg. Hasat dönemi Ekim-Kasım. İhracat belgeli.',
        unitPrice: 38,
        currency: 'TRY',
        minOrderQty: 5000,
        unit: 'kg',
        totalStock: 200000,
        deliveryTime: 'Hasat döneminde anında',
        deliveryMethod: 'Alıcı taşır veya biz organize ederiz',
        paymentTerms: '30 gün vadeli',
        contactPreference: ['WhatsApp'],
      },
    ],
  },
];

const seedBusiness = async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const firm of FIRMS) {
    let user = (await db.query('SELECT * FROM users WHERE email = $1', [firm.email])).rows[0];

    if (!user) {
      const { rows } = await db.query(
        'INSERT INTO users (name, email, password, mode) VALUES ($1,$2,$3,$4) RETURNING *',
        [firm.name, firm.email, hash, 'business']
      );
      user = rows[0];
      console.log(`[seed] Oluşturuldu: ${firm.email}`);
    } else {
      await db.query('DELETE FROM marketplace_listings WHERE user_id = $1', [user.id]);
      console.log(`[seed] Güncellendi: ${firm.email}`);
    }

    for (const l of firm.listings) {
      await db.query(
        `INSERT INTO marketplace_listings
          (user_id, title, category, description, unit_price, currency,
           min_order_qty, unit, total_stock, delivery_time, delivery_method,
           payment_terms, contact_preference, city)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          user.id, l.title, l.category, l.description, l.unitPrice, l.currency,
          l.minOrderQty, l.unit, l.totalStock || null, l.deliveryTime || null,
          l.deliveryMethod || null, l.paymentTerms || null,
          l.contactPreference, firm.city,
        ]
      );
    }
  }

  console.log(`[seed] İşletme seed tamamlandı — ${FIRMS.length} firma, ${FIRMS.reduce((s, f) => s + f.listings.length, 0)} ilan`);
};

module.exports = seedBusiness;

// Doğrudan çalıştırılırsa
if (require.main === module) {
  seedBusiness()
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
