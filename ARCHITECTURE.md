# Project Architecture

## Overview

This is a full-stack AI Resume Screening Platform built with React (frontend) and Node.js/Express (backend), using Supabase as the database.

## Project Structure

```
project/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── Layout.tsx           # Main layout with navigation
│   │   ├── UploadView.tsx       # Resume upload interface
│   │   ├── JobsView.tsx         # Job management
│   │   ├── JobForm.tsx          # Create/edit job form
│   │   ├── CandidatesView.tsx   # Candidate listing with filters
│   │   ├── CandidateDetails.tsx # Detailed candidate profile
│   │   ├── AnalyticsView.tsx    # Charts and metrics
│   │   └── EmailsView.tsx       # Email template generator
│   ├── lib/
│   │   └── api.ts               # API client functions
│   ├── store/
│   │   └── useStore.ts          # Zustand state management
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles
│
├── server/                      # Backend source code
│   ├── routes/                  # API route handlers
│   │   ├── resume.js            # Resume parsing endpoints
│   │   ├── job.js               # Job CRUD operations
│   │   ├── scoring.js           # Scoring and analytics
│   │   ├── candidate.js         # Candidate management
│   │   └── email.js             # Email generation
│   ├── services/                # Business logic
│   │   ├── aiService.js         # AI parsing and analysis
│   │   ├── scoringService.js    # Candidate scoring engine
│   │   └── fileParser.js        # PDF/DOCX parsing
│   ├── config/
│   │   └── supabase.js          # Supabase client setup
│   └── server.js                # Express server setup
│
├── sample-data/                 # Sample files for testing
│   ├── sample-job-description.txt
│   └── sample-resume.txt
│
└── Configuration files
    ├── package.json             # Frontend dependencies
    ├── vite.config.ts           # Vite configuration
    ├── tailwind.config.js       # Tailwind CSS setup
    └── tsconfig.json            # TypeScript configuration
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management (lightweight alternative to Redux)
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX text extraction
- **@supabase/supabase-js** - Database client

### Database
- **Supabase (PostgreSQL)** - Primary database
- **Row Level Security (RLS)** - Access control
- **JSONB columns** - Structured data storage

## Data Flow

### 1. Resume Upload Flow
```
User uploads file
  → Multer receives file
  → FileParser extracts text
  → AIService parses structured data
  → Save to candidates table
  → Check for duplicates
  → Return parsed data + ATS score
```

### 2. Job Description Flow
```
User pastes JD text
  → AIService extracts requirements
  → Parse skills, experience, education
  → Save to jobs table
  → Return structured data
```

### 3. Candidate Scoring Flow
```
User selects candidates + job
  → Create screening session
  → For each candidate:
      → ScoringService calculates scores
      → Apply weighted criteria
      → AIService generates explanation
      → Detect red flags
      → Save to candidate_scores
  → Return ranked results
```

### 4. Blind Mode Flow
```
User enables blind mode
  → System masks identifying data:
      - Name → "Candidate XXXXX"
      - Email → "masked@email.com"
      - Phone → "XXX-XXX-XXXX"
      - Location → ""
      - University → "University"
  → Display masked data
  → Scoring remains unaffected
```

## Key Components

### Frontend Components

#### Layout.tsx
- Navigation bar with route switching
- Consistent header across all views
- Responsive design

#### UploadView.tsx
- Drag-and-drop file upload
- Multiple file selection
- Upload progress tracking
- Results display with stats

#### CandidatesView.tsx
- Searchable/filterable candidate table
- Bulk selection
- Blind mode toggle
- Score trigger button
- CSV export

#### CandidateDetails.tsx
- Complete profile view
- Score breakdown visualization
- AI explanation display
- Red flag alerts
- Recruiter action buttons
- Internal notes

#### AnalyticsView.tsx
- Score distribution pie chart
- Status breakdown chart
- Missing skills bar chart
- Red flags summary

### Backend Services

#### aiService.js
Core AI functionality:
- `parseResume()` - Extract structured data from resume text
- `parseJobDescription()` - Parse JD requirements
- `generateExplanation()` - Create scoring explanation
- `detectRedFlags()` - Identify potential issues
- `calculateATSScore()` - Evaluate resume quality
- `generateEmailTemplate()` - Create personalized emails

#### scoringService.js
Scoring engine:
- `scoreCandidate()` - Calculate overall score
- `calculateRequiredSkillsScore()` - Match required skills
- `calculateExperienceScore()` - Evaluate experience fit
- `scoreBulk()` - Process multiple candidates
- `applyBlindMode()` - Mask identifying information

#### fileParser.js
File processing:
- `parsePDF()` - Extract text from PDF files
- `parseDOCX()` - Extract text from Word documents
- `parseFile()` - Unified parsing interface

## Database Schema

### Tables

1. **jobs**
   - Stores job descriptions and parsed requirements
   - Fields: title, description, parsed_data (JSONB), status

2. **candidates**
   - Stores parsed resume data
   - Fields: name, email, phone, location, parsed_data (JSONB)
   - Includes duplicate detection

3. **screening_sessions**
   - Tracks bulk screening operations
   - Fields: job_id, name, blind_mode, total_candidates, status

4. **candidate_scores**
   - Stores scoring results
   - Fields: candidate_id, job_id, total_score, score_breakdown (JSONB)
   - Includes AI explanation, red flags, missing skills

5. **skills_master**
   - Normalized skills database
   - Fields: canonical_name, aliases, category

6. **email_templates**
   - Generated email templates
   - Fields: candidate_id, job_id, template_type, subject, body

## State Management

Using Zustand for global state:

```typescript
interface Store {
  candidates: Candidate[]        // All candidates
  jobs: Job[]                    // All jobs
  currentJob: Job | null         // Selected job for scoring
  currentSession: Session | null // Active screening session
  scores: CandidateScore[]       // Scoring results
  blindMode: boolean             // Blind screening toggle
  selectedCandidates: string[]   // Selected for bulk ops
}
```

## API Endpoints

### Resume Operations
- `POST /api/resume/parse` - Single resume upload
- `POST /api/resume/parse-bulk` - Bulk upload

### Job Operations
- `POST /api/job/parse` - Create job with parsing
- `GET /api/job` - List all jobs
- `GET /api/job/:id` - Get single job
- `PUT /api/job/:id` - Update job
- `DELETE /api/job/:id` - Delete job

### Scoring Operations
- `POST /api/scoring/score-candidate` - Score single candidate
- `POST /api/scoring/score-bulk` - Score multiple candidates
- `GET /api/scoring/session/:sessionId` - Get session results
- `GET /api/scoring/analytics/:jobId` - Get analytics

### Candidate Operations
- `GET /api/candidates` - List with filters
- `GET /api/candidates/:id` - Get single candidate
- `PUT /api/candidates/:id/score/:scoreId` - Update recruiter status
- `DELETE /api/candidates/:id` - Delete candidate

### Email Operations
- `POST /api/email/generate` - Generate single email
- `POST /api/email/generate-bulk` - Generate multiple emails
- `GET /api/email` - List generated templates

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only access their own data
- Authenticated users required
- Cascade deletes for referential integrity

### Input Validation
- File size limits (10MB per file)
- File type restrictions (PDF, DOCX only)
- SQL injection prevention via parameterized queries

### CORS
- Configured for development (localhost)
- Must be restricted in production

## Performance Considerations

### Frontend
- Component lazy loading (can be added)
- Pagination for large candidate lists
- Debounced search inputs
- Memoization of expensive calculations

### Backend
- Database indexes on frequently queried fields
- JSONB indexes for nested queries
- Batch processing for bulk operations
- File streaming for large uploads

### Database
- Indexed columns: email, created_at, total_score
- JSONB GIN indexes for parsed_data
- Foreign key constraints with indexes

## Scalability

### Current Limitations
- Synchronous file processing (500 files max)
- In-memory file handling
- Single server deployment

### Recommended Improvements for Production
1. Add job queue (Bull, BullMQ) for async processing
2. Implement file storage (S3, Cloud Storage)
3. Add Redis for caching
4. Implement proper authentication (Supabase Auth)
5. Add rate limiting
6. Implement WebSocket for real-time progress
7. Add horizontal scaling with load balancer

## Testing Strategy

### Unit Tests (Recommended)
- Service functions (scoring, parsing)
- Utility functions
- API endpoint handlers

### Integration Tests (Recommended)
- End-to-end API flows
- Database operations
- File upload/parsing

### E2E Tests (Recommended)
- User workflows
- Critical paths (upload → parse → score → export)

## Deployment Guide

### Frontend Deployment
```bash
npm run build
# Upload dist/ to static hosting (Netlify, Vercel, S3)
```

### Backend Deployment
- Deploy to Node.js hosting (Heroku, Railway, Render)
- Set environment variables
- Ensure Supabase connection

### Database
- Supabase handles hosting
- Apply migrations on new database
- Configure RLS policies

## Monitoring & Logging

### Recommended Tools
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - Performance monitoring
- **Supabase Dashboard** - Database metrics

### Key Metrics to Track
- Upload success rate
- Parsing accuracy
- Average scoring time
- API response times
- Error rates
- User engagement

## Future Enhancements

### Planned Features
1. Real-time collaboration
2. Advanced AI models (GPT-4, Claude)
3. Custom scoring weights per job
4. Interview scheduling integration
5. Video resume support
6. Skills assessment integration
7. Chrome extension for LinkedIn
8. Mobile app
9. Advanced analytics (ML predictions)
10. Multi-language support

### Technical Improvements
1. GraphQL API
2. Microservices architecture
3. Event-driven processing
4. Advanced caching strategy
5. Better error handling
6. Comprehensive logging
7. API rate limiting
8. Webhook support
9. Third-party integrations (ATS, Slack)
10. Advanced search (Elasticsearch)
