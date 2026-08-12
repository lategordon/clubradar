-- ==============================================================================
-- NYU Bay Area Alumni Club Event Planner - Supabase Initial Schema & Seed Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Idea' CHECK (status IN ('Idea', 'Planning', 'Submitted', 'Confirmed', 'Completed')),
    location_name VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL DEFAULT 'SF' CHECK (region IN ('SF', 'East Bay', 'South Bay', 'Virtual', 'NYC')),
    cost_per_person NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    primary_host VARCHAR(255) NOT NULL,
    co_hosts TEXT[] DEFAULT '{}',
    notes TEXT,
    workflow_progress_current INTEGER DEFAULT 0,
    workflow_progress_total INTEGER DEFAULT 14,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Event Ideas & Brainstorming Backlog Table
CREATE TABLE IF NOT EXISTS public.event_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    proposed_timeframe VARCHAR(100),
    suggested_region VARCHAR(50) NOT NULL DEFAULT 'SF' CHECK (suggested_region IN ('SF', 'East Bay', 'South Bay', 'Virtual', 'NYC')),
    submitted_by VARCHAR(255) NOT NULL DEFAULT 'Leighton Gordon',
    submitted_avatar VARCHAR(10) DEFAULT 'L&A',
    upvotes INTEGER NOT NULL DEFAULT 1,
    upvoters TEXT[] DEFAULT ARRAY['Leighton'],
    tags TEXT[] DEFAULT '{}',
    estimated_cost_tier VARCHAR(50) DEFAULT 'Free',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Under Consideration', 'Ready to Plan', 'Promoted')),
    promoted_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Awareness & City Context Events Table
CREATE TABLE IF NOT EXISTS public.awareness_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Community / Conference' CHECK (category IN ('Community / Conference', 'Civic / Holiday', 'Cultural', 'Campus / Sports')),
    is_multi_day BOOLEAN DEFAULT false,
    color_tag VARCHAR(50) DEFAULT 'emerald',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    assignee VARCHAR(255) NOT NULL DEFAULT 'Leighton',
    completed BOOLEAN DEFAULT false,
    due_date DATE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    warning_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_avatar_initials VARCHAR(10) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Helper View for Events with Calculated Deadlines
CREATE OR REPLACE VIEW public.events_with_deadlines AS
SELECT 
    e.*,
    (e.event_date - INTERVAL '56 days')::DATE AS eight_week_deadline,
    (e.event_date - INTERVAL '42 days')::DATE AS six_week_deadline,
    (e.event_date - CURRENT_DATE) AS days_until_event,
    ((e.event_date - INTERVAL '42 days')::DATE - CURRENT_DATE) AS days_until_six_week,
    ((e.event_date - INTERVAL '56 days')::DATE - CURRENT_DATE) AS days_until_eight_week
FROM public.events e;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awareness_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow read and write for authenticated & anon clients for club collaboration
CREATE POLICY "Allow public read on events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on events" ON public.events FOR DELETE USING (true);

CREATE POLICY "Allow public read on event_ideas" ON public.event_ideas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on event_ideas" ON public.event_ideas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on event_ideas" ON public.event_ideas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on event_ideas" ON public.event_ideas FOR DELETE USING (true);

CREATE POLICY "Allow public read on awareness_events" ON public.awareness_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on awareness_events" ON public.awareness_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on awareness_events" ON public.awareness_events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on awareness_events" ON public.awareness_events FOR DELETE USING (true);

CREATE POLICY "Allow public read on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on tasks" ON public.tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read on activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- 8. Seed Initial Data
INSERT INTO public.events (id, title, event_date, status, location_name, region, cost_per_person, primary_host, co_hosts, notes, workflow_progress_current, workflow_progress_total)
VALUES
  ('a1111111-1111-1111-1111-111111111101', 'Equinox Pilates', '2026-10-03', 'Submitted', 'San Francisco', 'SF', 15.00, 'Leighton Gordon', ARRAY['Adi'], 'Pilates morning session for Bay Area alumni at Equinox Sports Club.', 20, 15),
  ('a1111111-1111-1111-1111-111111111102', 'Dolores Park Picnic', '2026-10-08', 'Planning', 'San Francisco', 'SF', 0.00, 'Janice K.', ARRAY['Leighton Gordon', 'Adi'], 'Annual fall alumni picnic at Mission Dolores Park. Bring blankets and snacks.', 20, 14),
  ('a1111111-1111-1111-1111-111111111103', 'Wine Tasting Napa', '2026-10-19', 'Planning', 'San Francisco', 'SF', 65.00, 'Janice K.', ARRAY['Tammy'], 'Day trip wine tasting excursion with chartered bus from Downtown SF.', 9, 13),
  ('a1111111-1111-1111-1111-111111111104', 'Quarterly Cafe Meetup', '2026-10-22', 'Planning', 'San Francisco', 'SF', 5.00, 'Tammy Chen', ARRAY['Leighton Gordon', 'Adi'], 'Coffee and casual networking morning in SOMA.', 9, 13),
  ('a1111111-1111-1111-1111-111111111105', 'Alumni Volunteer Meeting', '2026-11-15', 'Planning', 'San Francisco', 'SF', 0.00, 'Tammy Chen', ARRAY['Brian T.'], 'Quarterly leadership & committee check-in for upcoming 2027 initiatives.', 0, 13),
  ('a1111111-1111-1111-1111-111111111106', 'Thanksgiving Dinner', '2026-11-26', 'Idea', 'San Francisco', 'SF', 45.00, 'Janice K.', ARRAY[]::TEXT[], 'Friendsgiving dinner for alumni remaining in the Bay Area over the holidays.', 0, 10),
  ('a1111111-1111-1111-1111-111111111107', 'Holiday Party', '2026-12-12', 'Planning', 'San Francisco', 'SF', 35.00, 'Leighton Gordon', ARRAY['Adi'], 'Annual winter holiday celebration cocktail reception in Financial District.', 4, 14),
  ('a1111111-1111-1111-1111-111111111108', 'New Year Mixer', '2027-01-08', 'Planning', 'San Francisco', 'SF', 15.00, 'Janice K.', ARRAY[]::TEXT[], 'Kick off 2027 with alumni networking and goal setting.', 2, 12);

INSERT INTO public.event_ideas (id, title, description, proposed_timeframe, suggested_region, submitted_by, submitted_avatar, upvotes, upvoters, tags, estimated_cost_tier, status)
VALUES
  ('e5555555-5555-5555-5555-555555555501', 'Silicon Valley AI Founders & Investor Roundtable', 'A curated fireside chat and networking circle connecting NYU founders building with generative AI/LLMs with top Bay Area seed & Series A VCs.', 'October 2026 (During SF Tech Week)', 'South Bay', 'Leighton Gordon', 'L&A', 14, ARRAY['Leighton', 'Janice', 'Adi', 'Tammy', 'Brian'], ARRAY['Tech & AI', 'Founders', 'Networking', 'Venture Capital'], 'Free', 'Ready to Plan'),
  ('e5555555-5555-5555-5555-555555555502', 'Alumni Rooftop Sunset Jazz & Cocktails', 'Golden hour drinks and light bites on an open-air downtown SF terrace with a live student/alumni jazz quartet.', 'Fall 2026', 'SF', 'Janice K.', 'J', 9, ARRAY['Janice', 'Adi', 'Tammy'], ARRAY['Social', 'Live Music', 'Cocktails'], '$$ ($25-$60)', 'Ready to Plan'),
  ('e5555555-5555-5555-5555-555555555503', 'Marin Headlands Golden Gate Sunrise Hike', 'Early morning brisk 4-mile scenic loop overlooking the Golden Gate Bridge and Pacific ocean, followed by sourdough pastries and coffee in Sausalito.', 'November 2026', 'East Bay', 'Adi', 'A', 7, ARRAY['Adi', 'Leighton', 'Brian'], ARRAY['Wellness', 'Outdoors', 'Casual'], 'Free', 'Under Consideration'),
  ('e5555555-5555-5555-5555-555555555504', 'Stern Bay Area Private Equity & VC Dinner', 'Private dining room dinner bringing together Stern MBA alumni and undergraduate finance grads working across Bay Area funds.', 'January 2027 (J.P. Morgan Week)', 'SF', 'Tammy Chen', 'T', 11, ARRAY['Tammy', 'Leighton', 'Janice', 'Adi'], ARRAY['Finance', 'Stern Alumni', 'Dinner'], '$$$ ($60+)', 'Under Consideration');

INSERT INTO public.awareness_events (id, title, start_date, end_date, location, category, is_multi_day, color_tag, notes)
VALUES
  ('b2222222-2222-2222-2222-222222222201', 'SF Tech Week Social Event', '2026-10-05', '2026-10-11', 'San Francisco', 'Community / Conference', true, 'emerald', 'Major tech ecosystem event with thousands of founders and investors across SF.'),
  ('b2222222-2222-2222-2222-222222222202', 'SF Tech Week Happy Hour', '2026-10-09', '2026-10-09', 'San Francisco', 'Community / Conference', false, 'emerald', 'Community networking during SF Tech Week.'),
  ('b2222222-2222-2222-2222-222222222203', 'SOCAP', '2026-10-13', '2026-10-16', 'San Francisco', 'Community / Conference', true, 'emerald', 'Social Capital Markets annual conference for impact investors and social entrepreneurs.'),
  ('b2222222-2222-2222-2222-222222222204', 'Indigenous Peoples'' Day', '2026-10-12', '2026-10-12', 'Bay Area', 'Civic / Holiday', false, 'blue', 'Official civic holiday.'),
  ('b2222222-2222-2222-2222-222222222205', 'Halloween', '2026-10-31', '2026-10-31', 'Bay Area', 'Civic / Holiday', false, 'amber', 'Citywide festivities and parties.'),
  ('b2222222-2222-2222-2222-222222222206', 'Christmas', '2026-12-25', '2026-12-25', 'Global', 'Civic / Holiday', false, 'emerald', 'Winter holiday.'),
  ('b2222222-2222-2222-2222-222222222207', 'J.P. Morgan Healthcare Conference', '2027-01-11', '2027-01-14', 'San Francisco (Union Square)', 'Community / Conference', true, 'emerald', 'Largest healthcare investment symposium in the world; hotel rates and downtown venues book fast.'),
  ('b2222222-2222-2222-2222-222222222208', 'Lunar New Year', '2027-02-06', '2027-02-06', 'San Francisco (Chinatown)', 'Cultural', false, 'rose', 'San Francisco Chinatown festival & parade.'),
  ('b2222222-2222-2222-2222-222222222209', 'Holi Festival of Colors', '2027-03-22', '2027-03-22', 'Bay Area', 'Cultural', false, 'violet', 'Spring festival celebration.');

INSERT INTO public.tasks (id, title, assignee, completed, due_date, warning_type)
VALUES
  ('c3333333-3333-3333-3333-333333333301', 'Submit Dolores Park details (6w warning)', 'Leighton', false, '2026-08-27', '6w'),
  ('c3333333-3333-3333-3333-333333333302', 'Follow up on Equinox proposal', 'Leighton', false, '2026-08-20', 'standard'),
  ('c3333333-3333-3333-3333-333333333303', 'Draft newsletter copy for Napa trip', 'Leighton', false, '2026-09-01', 'standard'),
  ('c3333333-3333-3333-3333-333333333304', 'Draft newsletter tasks details planned', 'Leighton', false, '2026-09-10', 'standard');

INSERT INTO public.activity_logs (id, user_name, user_avatar_initials, action, target, created_at)
VALUES
  ('d4444444-4444-4444-4444-444444444401', 'Jan', 'J', 'added new Grad event', 'Young Alumni Social', timezone('utc'::text, now() - INTERVAL '1 day')),
  ('d4444444-4444-4444-4444-444444444402', 'Tammy', 'T', 'updated Wine Tasting Napa status to Planning', 'Wine Tasting Napa', timezone('utc'::text, now() - INTERVAL '17 days')),
  ('d4444444-4444-4444-4444-444444444403', 'Adi', 'A', 'edited Quarterly Cafe details', 'Quarterly Cafe Meetup', timezone('utc'::text, now() - INTERVAL '7 days'));
