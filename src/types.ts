export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: {
    linkedin: string;
    github: string;
    portfolio: string;
    others: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
    normalized: string[];
  };
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: string[];
  achievements: string[];
}

export interface Experience {
  title: string;
  company: string;
  start: string;
  end: string;
  duration_months: number;
  description: string;
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  start: string;
  end: string;
  gpa: string;
}

export interface Project {
  name: string;
  tech_stack: string[];
  description: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  parsed_data: ParsedResume;
  original_filename: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  duplicate_of?: string;
}

export interface ParsedJobDescription {
  job_title: string;
  required_skills: string[];
  good_to_have_skills: string[];
  min_experience_years: number;
  preferred_education: string;
  location: string;
  responsibilities: string[];
  keywords: string[];
}

export interface Job {
  id: string;
  title: string;
  description: string;
  parsed_data: ParsedJobDescription;
  created_by?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'closed' | 'draft';
}

export interface ScoreBreakdown {
  required_skills: number;
  good_to_have_skills: number;
  experience: number;
  education: number;
  projects: number;
  certifications: number;
}

export interface RedFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface MissingSkill {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface CandidateScore {
  id: string;
  candidate_id: string;
  job_id: string;
  session_id?: string;
  total_score: number;
  score_breakdown: ScoreBreakdown;
  ai_explanation: string;
  missing_skills: MissingSkill[];
  red_flags: RedFlag[];
  ats_score: number;
  recruiter_status: 'shortlisted' | 'rejected' | 'maybe' | 'pending';
  recruiter_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScreeningSession {
  id: string;
  job_id: string;
  name: string;
  blind_mode: boolean;
  total_candidates: number;
  processed_candidates: number;
  status: 'processing' | 'completed' | 'failed';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  total_candidates: number;
  average_score: number;
  score_distribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  status_breakdown: {
    shortlisted: number;
    rejected: number;
    maybe: number;
    pending: number;
  };
  missing_skills_frequency: Record<string, number>;
  red_flags_summary: {
    job_hopping: number;
    career_gap: number;
    incomplete_contact: number;
  };
}

export interface EmailTemplate {
  id: string;
  candidate_id: string;
  job_id: string;
  template_type: 'shortlisted' | 'rejected' | 'assessment_request';
  subject: string;
  body: string;
  created_by?: string;
  created_at: string;
}
