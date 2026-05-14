/**
 * Demo verisi oluşturur.
 * Çalıştırma: node src/scripts/seedPersonal.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const db = require('../config/database');
const bcrypt = require('bcryptjs');

const DEMO_USER = {
  name: 'Ali Demo',
  email: 'ali@demo.com',
  password: 'demo123',
  mode: 'personal',
};

const CATEGORIES = ['Market', 'Kira', 'Fatura', 'Sağlık', 'Eğlence', 'Ulaşım', 'Giyim', 'Diğer'];

const randomAmount = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

const seed = async () => {
  console.log('Seed başlıyor...');

  // Kullanıcı oluştur veya bul
  let user = (await db.query('SELECT * FROM users WHERE email = $1', [DEMO_USER.email])).rows[0];
  if (!user) {
    const hash = await bcrypt.hash(DEMO_USER.password, 12);
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password, mode) VALUES ($1, $2, $3, $4) RETURNING *',
      [DEMO_USER.name, DEMO_USER.email, hash, DEMO_USER.mode]
    );
    user = rows[0];
    console.log('Demo kullanıcı oluşturuldu:', user.email);
  } else {
    console.log('Demo kullanıcı zaten var:', user.email);
    // Temizle
    await db.query('DELETE FROM personal_expenses WHERE user_id = $1', [user.id]);
    await db.query('DELETE FROM savings_goals WHERE user_id = $1', [user.id]);
    await db.query('DELETE FROM budget_limits WHERE user_id = $1', [user.id]);
    await db.query('DELETE FROM coach_progress WHERE user_id = $1', [user.id]);
  }

  // 3 ay geriye dönük harcama verisi
  const now = new Date();
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    for (let i = 0; i < 25; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const amount = category === 'Kira' ? 15000 : randomAmount(50, 800);
      await db.query(
        'INSERT INTO personal_expenses (user_id, amount, category, date) VALUES ($1, $2, $3, $4)',
        [user.id, amount, category, date]
      );
    }
  }
  console.log('Harcama verisi eklendi (75 kayıt)');

  // Bütçe limitleri
  const limits = [
    ['Market', 3000], ['Kira', 15000], ['Fatura', 1500],
    ['Sağlık', 1000], ['Eğlence', 1000], ['Ulaşım', 800],
  ];
  for (const [cat, lim] of limits) {
    await db.query(
      `INSERT INTO budget_limits (user_id, category, monthly_limit)
       VALUES ($1, $2, $3) ON CONFLICT (user_id, category) DO UPDATE SET monthly_limit = $3`,
      [user.id, cat, lim]
    );
  }
  console.log('Bütçe limitleri eklendi');

  // 2 birikim hedefi
  const goals = [
    { name: 'Yaz Tatili', targetAmount: 30000, targetDate: '2026-08-01', currentAmount: 8500 },
    { name: 'Acil Fon', targetAmount: 50000, targetDate: '2026-12-31', currentAmount: 12000 },
  ];
  for (const g of goals) {
    await db.query(
      'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date) VALUES ($1,$2,$3,$4,$5)',
      [user.id, g.name, g.targetAmount, g.currentAmount, g.targetDate]
    );
  }
  console.log('Birikim hedefleri eklendi');

  // FinansKoç progress — seviye 3, 450 XP
  await db.query(
    `INSERT INTO coach_progress (user_id, xp, level, badges)
     VALUES ($1, 450, 3, $2)
     ON CONFLICT (user_id) DO UPDATE SET xp = 450, level = 3, badges = $2`,
    [user.id, ['Başlangıç Ustası', 'Bütçe Kahramanı', 'Seviye 3 Ustası']]
  );
  console.log('FinansKoç ilerlemesi eklendi');

  console.log('\n✅ Seed tamamlandı!');
  console.log(`   E-posta: ${DEMO_USER.email}`);
  console.log(`   Şifre: ${DEMO_USER.password}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed hatası:', err.message);
  process.exit(1);
});
