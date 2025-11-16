/*
  # Create AI Models Table for AI Comparer

  1. New Tables
    - `models`
      - `id` (uuid, primary key) - Unique identifier untuk setiap model AI
      - `name` (text) - Nama model AI (contoh: GPT-4, Claude 3, Gemini)
      - `provider` (text) - Provider/pembuat model (contoh: OpenAI, Anthropic, Google)
      - `context_length` (integer) - Panjang context window dalam tokens
      - `capabilities` (jsonb) - Kemampuan model dalam format JSON
      - `benchmark_score` (decimal) - Skor benchmark/akurasi model (0-100)
      - `created_at` (timestamptz) - Waktu pembuatan record
      - `user_id` (uuid) - ID user yang membuat record
      
  2. Security
    - Enable RLS on `models` table
    - Policy: Authenticated users can view all models
    - Policy: Authenticated users can insert their own models
    - Policy: Users can update only their own models
    - Policy: Users can delete only their own models
    
  3. Important Notes
    - Data models dapat dibaca oleh semua authenticated users
    - Setiap user hanya bisa edit/delete model yang mereka buat sendiri
    - Benchmark score menggunakan decimal untuk presisi yang lebih baik
*/

CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  context_length integer NOT NULL DEFAULT 0,
  capabilities jsonb DEFAULT '{}',
  benchmark_score decimal(5,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all models"
  ON models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert their own models"
  ON models FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models"
  ON models FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models"
  ON models FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index untuk performa query yang lebih baik
CREATE INDEX IF NOT EXISTS models_user_id_idx ON models(user_id);
CREATE INDEX IF NOT EXISTS models_provider_idx ON models(provider);