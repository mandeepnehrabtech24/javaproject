# AI Resume Screening Platform

A production-grade ATS (Applicant Tracking System) with AI-powered resume screening, bulk processing, bias-free screening mode, analytics, and recruiter workflow tools.

## Features

### Core Features
- **Bulk Resume Upload**: Upload up to 500 resumes (PDF/DOCX) simultaneously
- **AI Resume Parsing**: Extract structured data including skills, experience, education, projects, and certifications
- **Job Description Parsing**: Automatically extract requirements, skills, and qualifications from JD
- **Smart Scoring System**: Weighted scoring (0-100) based on:
  - Required Skills Match (35%)
  - Good-to-Have Skills (15%)
  - Experience Alignment (25%)
  - Education Match (10%)
  - Project Relevance (10%)
  - Certifications (5%)
- **AI Explanations**: Get detailed reasoning for each candidate's score
- **Red Flag Detection**: Automatically detect job hopping, career gaps, and incomplete profiles
- **Blind Screening Mode**: Remove identifying information for unbiased evaluation
- **Analytics Dashboard**: Visualize candidate distribution, missing skills, and recruitment metrics
- **Email Generator**: Create personalized emails (shortlist, rejection, assessment requests)
- **Recruiter Workflow**: Mark candidates as shortlisted/rejected/maybe with internal notes
- **ATS Score**: Evaluate resume formatting and optimization
- **Export Functionality**: Export candidate data to CSV

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Recharts for analytics visualizations
- Lucide React for icons

### Backend
- Node.js + Express
- Supabase (PostgreSQL) for database
- PDF parsing (pdf-parse)
- DOCX parsing (mammoth)
- AI-powered parsing and scoring

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account (database is pre-configured)
- `.env` file with Supabase credentials

### 1. Environment Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Database Setup

The database schema is already created via migrations. The following tables are available:
- `jobs` - Job descriptions and parsed requirements
- `candidates` - Parsed resume data
- `screening_sessions` - Bulk screening operations
- `candidate_scores` - Scoring results with AI explanations
- `skills_master` - Normalized skills database
- `email_templates` - Generated email templates

### 4. Run the Application

```bash
# Terminal 1: Start the backend API server
cd server
npm start

# Terminal 2: Start the frontend dev server
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3001`.

## Usage Guide

### 1. Upload Resumes
- Navigate to "Upload Resumes"
- Drag and drop or select multiple PDF/DOCX files
- Click "Upload" to process resumes
- View parsing results and duplicate detection

### 2. Create Job Description
- Go to "Jobs" tab
- Click "New Job"
- Enter job title and paste the full job description
- AI will automatically extract requirements, skills, and qualifications

### 3. Screen Candidates
- Go to "Candidates" tab
- Select candidates using checkboxes
- Toggle "Blind Mode" if you want bias-free screening
- Click "Score for [Job Title]" to run AI screening
- View ranked results with detailed scoring

### 4. Review Candidate Details
- Click "View Details" on any candidate
- See comprehensive scoring breakdown
- View AI explanation and red flags
- Mark as Shortlisted/Maybe/Rejected
- Add internal notes

### 5. Analytics
- Go to "Analytics" tab
- View score distribution charts
- See top missing skills across applicants
- Analyze red flags summary
- Track recruiter status breakdown

### 6. Generate Emails
- Go to "Emails" tab
- Select candidates from the Candidates page
- Choose email type (Shortlisted/Rejected/Assessment)
- Generate personalized templates
- Copy and use in your email client

## API Documentation

### Resume Parsing
```
POST /api/resume/parse
Body: multipart/form-data with 'file' field
Response: { success, candidate, ats_score, is_duplicate }
```

### Bulk Upload
```
POST /api/resume/parse-bulk
Body: multipart/form-data with 'files[]' field
Response: { success, processed, failed, results, errors }
```

### Job Description Parsing
```
POST /api/job/parse
Body: { description, title, userId }
Response: { success, job, parsed_data }
```

### Score Candidate
```
POST /api/scoring/score-candidate
Body: { candidateId, jobId, sessionId }
Response: { success, score, candidate, job }
```

### Bulk Scoring
```
POST /api/scoring/score-bulk
Body: { candidateIds[], jobId, blindMode, sessionName, userId }
Response: { success, session, results, total }
```

### Analytics
```
GET /api/scoring/analytics/:jobId
Response: { success, analytics }
```

### Generate Email
```
POST /api/email/generate
Body: { candidateId, jobId, templateType, userId }
Response: { success, template }
```

## Data Structures

### Parsed Resume Format
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "links": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe",
    "portfolio": "https://johndoe.com"
  },
  "skills": {
    "technical": ["JavaScript", "React", "Node.js"],
    "soft": ["Leadership", "Communication"],
    "normalized": ["JavaScript", "React", "Node.js"]
  },
  "experience": [...],
  "education": [...],
  "projects": [...],
  "certifications": [],
  "achievements": []
}
```

### Score Breakdown
```json
{
  "total_score": 85.5,
  "score_breakdown": {
    "required_skills": 90,
    "good_to_have_skills": 80,
    "experience": 85,
    "education": 100,
    "projects": 75,
    "certifications": 60
  },
  "ai_explanation": "This candidate shows...",
  "missing_skills": [...],
  "red_flags": [...],
  "ats_score": 92
}
```

## Key Features Explained

### Blind Screening Mode
When enabled, the system masks:
- Candidate names (replaced with "Candidate XXXXX")
- Email addresses (masked@email.com)
- Phone numbers (XXX-XXX-XXXX)
- Location information
- University/college names (replaced with "University")

This ensures unbiased evaluation based solely on skills and experience.

### Red Flag Detection
The system automatically detects:
- **Job Hopping**: Multiple positions < 12 months
- **Career Gaps**: Gaps > 6 months between positions
- **Incomplete Contact**: Missing email or phone

### Scoring Weights
The scoring algorithm uses industry-standard weights:
- Required Skills: 35% (most important)
- Experience: 25% (second priority)
- Good-to-Have Skills: 15%
- Education: 10%
- Projects: 10%
- Certifications: 5%

## Production Deployment

For production deployment:

1. Set up environment variables on your hosting platform
2. Build the frontend: `npm run build`
3. Deploy the backend to a Node.js hosting service
4. Ensure Supabase database is properly configured
5. Set up CORS for your production domain
6. Configure file upload limits based on your needs

## Security Considerations

- All API routes should be protected with authentication in production
- Row Level Security (RLS) is enabled on all database tables
- File uploads are validated and size-limited
- Sensitive candidate data is protected

## Support

For issues or questions, please refer to the codebase documentation or create an issue in the repository.
