-- Supabase Schema for Thai NCD Screening App
-- Run this SQL in your Supabase SQL Editor

-- 1. Users table (extended from auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- 2. Screenings table (core health assessments)
CREATE TABLE public.screenings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Raw answers (store everything for audit trail)
  answers JSONB,
  
  -- Computed scores
  bmi DECIMAL(5,2),
  tds_percent DECIMAL(5,2),
  sbp INTEGER,
  dbp INTEGER,
  diet_score INTEGER,
  stress_score INTEGER,
  
  -- Risk levels
  tds_risk_level TEXT, -- 'low', 'moderate', 'high', 'very_high'
  bp_category TEXT,
  diet_category TEXT,
  stress_level TEXT,
  
  -- Achievements
  achievement_level INTEGER,
  achievement_title TEXT,
  xp_earned INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_bmi CHECK (bmi > 0),
  CONSTRAINT valid_tds CHECK (tds_percent >= 0 AND tds_percent <= 100)
);

-- 3. Habit logs (daily tracking)
CREATE TABLE public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  log_date DATE NOT NULL,
  steps INTEGER,
  exercise_minutes INTEGER,
  sleep_hours DECIMAL(3,1),
  water_glasses INTEGER,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- 4. Community posts
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  topic TEXT, -- 'general', 'diet', 'exercise', 'smoking', 'stress'
  
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 5. Comments on posts
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 6. Post likes (track who liked)
CREATE TABLE public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 7. Reports (moderation)
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  reported_comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  reporter_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  reason TEXT, -- 'spam', 'abuse', 'misinformation', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- 8. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  plan TEXT DEFAULT 'free', -- 'free', 'premium'
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
  
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP
);

-- 9. API audit log (for compliance)
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  action TEXT, -- 'screening_created', 'data_exported', 'account_deleted'
  resource_type TEXT,
  resource_id TEXT,
  changes JSONB, -- track what changed
  ip_address TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row-Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own screenings" ON public.screenings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screenings" ON public.screenings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own habit logs" ON public.habit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs" ON public.habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Community posts: everyone can read; auth'd users can create
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Auth users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments: similar
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Auth users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: user can only see own
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Audit logs: user can view own (for GDPR compliance)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_screenings_user_id ON public.screenings(user_id);
CREATE INDEX idx_screenings_created_at ON public.screenings(created_at);
CREATE INDEX idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX idx_habit_logs_date ON public.habit_logs(log_date);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at);
CREATE INDEX idx_posts_topic ON public.posts(topic);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
