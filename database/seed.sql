-- SupaChat Blog Analytics Schema + Seed Data
-- Run this in your Supabase SQL editor

-- Tables
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT
);

CREATE TABLE IF NOT EXISTS article_views (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  country TEXT
);

CREATE TABLE IF NOT EXISTS article_engagements (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  engagement_type TEXT CHECK (engagement_type IN ('like', 'share', 'comment')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed articles
INSERT INTO articles (title, topic, author, published_at) VALUES
  ('Introduction to Large Language Models', 'AI', 'Alice Chen', NOW() - INTERVAL '45 days'),
  ('GPT-4 vs Claude: A Comparison', 'AI', 'Bob Smith', NOW() - INTERVAL '38 days'),
  ('Building RAG Applications', 'AI', 'Alice Chen', NOW() - INTERVAL '30 days'),
  ('React 19 New Features', 'Frontend', 'Carol White', NOW() - INTERVAL '28 days'),
  ('Next.js App Router Deep Dive', 'Frontend', 'David Lee', NOW() - INTERVAL '25 days'),
  ('Tailwind CSS v4 Guide', 'Frontend', 'Carol White', NOW() - INTERVAL '20 days'),
  ('Kubernetes for Beginners', 'DevOps', 'Eve Johnson', NOW() - INTERVAL '18 days'),
  ('GitHub Actions CI/CD Patterns', 'DevOps', 'Frank Brown', NOW() - INTERVAL '15 days'),
  ('Docker Best Practices 2025', 'DevOps', 'Eve Johnson', NOW() - INTERVAL '12 days'),
  ('PostgreSQL Performance Tuning', 'Database', 'Grace Kim', NOW() - INTERVAL '10 days'),
  ('Supabase Row Level Security', 'Database', 'Grace Kim', NOW() - INTERVAL '8 days'),
  ('Vector Databases Explained', 'AI', 'Alice Chen', NOW() - INTERVAL '5 days'),
  ('Fine-tuning LLMs on Custom Data', 'AI', 'Bob Smith', NOW() - INTERVAL '3 days'),
  ('Vite 6 Migration Guide', 'Frontend', 'David Lee', NOW() - INTERVAL '2 days'),
  ('Monitoring with Grafana & Loki', 'DevOps', 'Frank Brown', NOW() - INTERVAL '1 day');

-- Seed views (generate ~500 view events spread over 45 days)
INSERT INTO article_views (article_id, viewed_at, country)
SELECT
  (RANDOM() * 14 + 1)::INT,
  NOW() - (RANDOM() * 45)::INT * INTERVAL '1 day' - (RANDOM() * 24)::INT * INTERVAL '1 hour',
  (ARRAY['US', 'IN', 'UK', 'DE', 'CA', 'AU', 'FR', 'BR', 'JP', 'SG'])[CEIL(RANDOM() * 10)::INT]
FROM generate_series(1, 500);

-- Seed engagements
INSERT INTO article_engagements (article_id, engagement_type, created_at)
SELECT
  (RANDOM() * 14 + 1)::INT,
  (ARRAY['like', 'share', 'comment'])[CEIL(RANDOM() * 3)::INT],
  NOW() - (RANDOM() * 45)::INT * INTERVAL '1 day'
FROM generate_series(1, 200);
