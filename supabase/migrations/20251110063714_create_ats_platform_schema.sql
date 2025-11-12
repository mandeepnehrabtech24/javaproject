/*
  # AI Resume Screening Platform - Database Schema

  ## Overview
  This migration creates the complete database schema for an enterprise-grade ATS platform
  with AI-powered resume screening, bulk processing, and analytics capabilities.

  ## New Tables

  ### 1. `jobs`
  Stores job descriptions and their parsed requirements
  - `id` (uuid, primary key)
  - `title` (text) - Job title
  - `description` (text) - Full job description
  - `parsed_data` (jsonb) - Structured JD data (skills, experience, etc.)
  - `created_by` (uuid) - Reference to auth.users
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `status` (text) - active/closed/draft

  ### 2. `candidates`
  Stores parsed resume data and candidate information
  - `id` (uuid, primary key)
  - `name` (text) - Full name
  - `email` (text) - Email address
  - `phone` (text) - Phone number
  - `location` (text) - Location
  - `parsed_data` (jsonb) - Complete structured resume data
  - `original_filename` (text) - Original file name
  - `file_url` (text) - Storage URL for resume file
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `duplicate_of` (uuid) - Reference to duplicate candidate

  ### 3. `screening_sessions`
  Tracks bulk screening operations
  - `id` (uuid, primary key)
  - `job_id` (uuid) - Reference to jobs table
  - `name` (text) - Session name
  - `blind_mode` (boolean) - Whether bias-free mode is enabled
  - `total_candidates` (integer) - Total resumes processed
  - `processed_candidates` (integer) - Number completed
  - `status` (text) - processing/completed/failed
  - `created_by` (uuid) - Reference to auth.users
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `candidate_scores`
  Stores AI scoring results for each candidate-job pairing
  - `id` (uuid, primary key)
  - `candidate_id` (uuid) - Reference to candidates
  - `job_id` (uuid) - Reference to jobs
  - `session_id` (uuid) - Reference to screening_sessions
  - `total_score` (numeric) - Overall score (0-100)
  - `score_breakdown` (jsonb) - Detailed component scores
  - `ai_explanation` (text) - Why this candidate fits
  - `missing_skills` (jsonb) - Skills gaps and improvements
  - `red_flags` (jsonb) - Detected issues
  - `ats_score` (numeric) - Resume formatting score
  - `recruiter_status` (text) - shortlisted/rejected/maybe/pending
  - `recruiter_notes` (text) - Internal notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `skills_master`
  Normalized skills database with embeddings
  - `id` (uuid, primary key)
  - `canonical_name` (text) - Normalized skill name
  - `aliases` (text[]) - Alternative names
  - `category` (text) - technical/soft/domain
  - `embedding` (vector) - For similarity matching (will use pgvector)
  - `created_at` (timestamptz)

  ### 6. `email_templates`
  Generated email templates for candidate communication
  - `id` (uuid, primary key)
  - `candidate_id` (uuid) - Reference to candidates
  - `job_id` (uuid) - Reference to jobs
  - `template_type` (text) - shortlisted/rejected/assessment_request
  - `subject` (text) - Email subject
  - `body` (text) - Email content
  - `created_by` (uuid) - Reference to auth.users
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Authenticated users can manage their own data
  - Restrict access based on created_by field

  ## Indexes
  - Add indexes for common queries (email lookups, scoring queries, etc.)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  parsed_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft'))
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  location text,
  parsed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  original_filename text,
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  duplicate_of uuid REFERENCES candidates(id) ON DELETE SET NULL
);

-- Create screening_sessions table
CREATE TABLE IF NOT EXISTS screening_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  name text NOT NULL,
  blind_mode boolean DEFAULT false,
  total_candidates integer DEFAULT 0,
  processed_candidates integer DEFAULT 0,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create candidate_scores table
CREATE TABLE IF NOT EXISTS candidate_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES screening_sessions(id) ON DELETE CASCADE,
  total_score numeric(5,2) DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
  score_breakdown jsonb DEFAULT '{}'::jsonb,
  ai_explanation text,
  missing_skills jsonb DEFAULT '[]'::jsonb,
  red_flags jsonb DEFAULT '[]'::jsonb,
  ats_score numeric(5,2) DEFAULT 0 CHECK (ats_score >= 0 AND ats_score <= 100),
  recruiter_status text DEFAULT 'pending' CHECK (recruiter_status IN ('shortlisted', 'rejected', 'maybe', 'pending')),
  recruiter_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, job_id, session_id)
);

-- Create skills_master table
CREATE TABLE IF NOT EXISTS skills_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text UNIQUE NOT NULL,
  aliases text[] DEFAULT ARRAY[]::text[],
  category text DEFAULT 'technical' CHECK (category IN ('technical', 'soft', 'domain')),
  created_at timestamptz DEFAULT now()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('shortlisted', 'rejected', 'assessment_request')),
  subject text NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_scores_candidate_id ON candidate_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_scores_job_id ON candidate_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_scores_session_id ON candidate_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_candidate_scores_total_score ON candidate_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_scores_status ON candidate_scores(recruiter_status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_screening_sessions_job_id ON screening_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_screening_sessions_created_by ON screening_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_skills_master_canonical ON skills_master(canonical_name);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs table
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for candidates table (accessible to all authenticated users for screening)
CREATE POLICY "Authenticated users can view candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete candidates"
  ON candidates FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for screening_sessions table
CREATE POLICY "Users can view own screening sessions"
  ON screening_sessions FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create own screening sessions"
  ON screening_sessions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own screening sessions"
  ON screening_sessions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own screening sessions"
  ON screening_sessions FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for candidate_scores table
CREATE POLICY "Authenticated users can view candidate scores"
  ON candidate_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create candidate scores"
  ON candidate_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidate scores"
  ON candidate_scores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete candidate scores"
  ON candidate_scores FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for skills_master table (read-only for all, write for system)
CREATE POLICY "Authenticated users can view skills"
  ON skills_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create skills"
  ON skills_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for email_templates table
CREATE POLICY "Users can view own email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create own email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());