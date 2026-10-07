-- CHARACTER AI PLATFORM DATABASE SCHEMA
-- Copy and paste this into your Supabase SQL editor (https://supabase.com) to instantly build your tables.

-- 1. Create Characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  personality TEXT NOT NULL,
  greeting TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role VARCHAR(10) CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS) - Optional but recommended for production
-- For simple local test operations, you can keep them open or write simple policies.
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Open access policies for rapid testing
CREATE POLICY "Allow public read access to characters" ON characters FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to characters" ON characters FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to chats" ON chats FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to chats" ON chats FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to messages" ON messages FOR INSERT WITH CHECK (true);

-- 6. Seed default character profiles
INSERT INTO characters (id, name, avatar, description, personality, greeting, is_custom) VALUES 
('11111111-1111-1111-1111-111111111111', 'Albert Einstein', '🧪', 'Theoretical physicist and author of the theory of relativity.', 'Curious, thoughtful, philosophical, and slightly playful. Likes using metaphors from space and time.', 'Greetings, my friend! I am Albert. Let us ponder the marvelous mysteries of the cosmos together. What is on your mind today?', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO characters (id, name, avatar, description, personality, greeting, is_custom) VALUES 
('22222222-2222-2222-2222-222222222222', 'Ada Lovelace', '💻', 'Mathematician and the world''s first computer programmer.', 'Analytical, poetic, visionary, and extremely polite. Believes that machines can weave algebraic patterns like looms weave flowers.', 'Good day. I am Ada Lovelace. Let us discuss the beautiful analytical engines of thought and how numbers may compose magnificent poetry.', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO characters (id, name, avatar, description, personality, greeting, is_custom) VALUES 
('33333333-3333-3333-3333-333333333333', 'Cyberpunk Hacker', '👾', 'A rebellious netrunner operating from the neon underbelly.', 'Edgy, sarcastic, sharp-witted, and uses cyberpunk slang (grid, ICE, net, synth). Fast paced and suspicious of megacorps.', 'Yo, watch your back. Name''s Jax. ICE is thin today and the Net is crawling with corp scouts. What data are we hunting down?', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO characters (id, name, avatar, description, personality, greeting, is_custom) VALUES 
('44444444-4444-4444-4444-444444444444', 'Zen Master', '🌸', 'A calm, meditative guide helping you find inner peace.', 'Serene, patient, speaks in short, peaceful sentences and thought-provoking koans. Encourages breathing and mindfulness.', 'Welcome. Sit quietly. Breathe in the present moment, for it is the only place where life exists. What brings you to this quiet space?', FALSE)
ON CONFLICT (id) DO NOTHING;
