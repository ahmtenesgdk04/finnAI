-- FinnAI Veritabanı Şeması

-- KULLANICILAR
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  mode VARCHAR(20) DEFAULT 'personal',  -- 'personal' | 'business'
  created_at TIMESTAMP DEFAULT NOW()
);

-- İŞLETME: GELİR-GİDER
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50),  -- kira, hammadde, lojistik, personel, vergi, enerji
  description TEXT,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  receipt_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE incomes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  source VARCHAR(100),
  customer_id INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MÜŞTERİLER & TAHSİLAT
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  payment_score INTEGER DEFAULT 50,  -- 0-100 tahsilat skoru
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE receivables (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id),
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, paid, overdue
  days_overdue INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- KİŞİSEL: BÜTÇE
CREATE TABLE personal_expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50),
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE personal_budget (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50),
  monthly_limit DECIMAL(12,2),
  month VARCHAR(7)  -- 'YYYY-MM'
);

-- KİŞİSEL: HEDEFLER & TAKİP
CREATE TABLE savings_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  target_amount DECIMAL(12,2),
  current_amount DECIMAL(12,2) DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  amount DECIMAL(10,2),
  renewal_date DATE,
  last_used_date DATE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE debts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(100),
  amount DECIMAL(12,2),
  type VARCHAR(10),  -- 'given' | 'taken'
  due_date DATE,
  is_settled BOOLEAN DEFAULT FALSE,
  note TEXT
);

CREATE TABLE installments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150),
  total_amount DECIMAL(12,2),
  monthly_amount DECIMAL(10,2),
  remaining_count INTEGER,
  next_due_date DATE
);

-- KOÇLUK
CREATE TABLE coach_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  completed_lessons JSONB DEFAULT '[]',
  badges JSONB DEFAULT '[]'
);

-- GÜVENLİ ALIŞ
CREATE TABLE safe_shop_queries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  score INTEGER,
  risk_level VARCHAR(10),  -- green, yellow, red
  analysis_result JSONB,
  queried_at TIMESTAMP DEFAULT NOW()
);

-- BELGELER
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200),
  category VARCHAR(50),  -- fatura, sozlesme, vergi, diger
  file_path VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- NOTLAR
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  reminder_date TIMESTAMP,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
