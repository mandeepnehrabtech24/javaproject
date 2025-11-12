# Quick Start Guide

Get the AI Resume Screening Platform running in 5 minutes.

## Prerequisites
- Node.js 18+ installed
- Supabase database configured (credentials in `.env`)

## Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Step 2: Setup Environment

Ensure your `.env` file exists in the project root with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Start the Application

**Terminal 1 - Backend API:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Step 4: Try It Out

### Test with Sample Data

1. **Create a Job Description**
   - Click "Jobs" tab
   - Click "New Job"
   - Copy contents from `sample-data/sample-job-description.txt`
   - Paste and click "Create Job"

2. **Upload a Resume**
   - Click "Upload Resumes" tab
   - Create a text file from `sample-data/sample-resume.txt` and save as PDF
   - Upload the file
   - View parsing results

3. **Score Candidates**
   - Go to "Candidates" tab
   - Check the candidate you uploaded
   - Click "Score for [Job Title]"
   - View ranked results

4. **Review Details**
   - Click "View Details" on the candidate
   - See scoring breakdown and AI explanation
   - Try marking as "Shortlisted"
   - Add internal notes

5. **Generate Email**
   - With candidate still selected, go to "Emails" tab
   - Choose "Shortlisted" email type
   - Click "Generate Email"
   - Copy the template

6. **View Analytics**
   - Go to "Analytics" tab
   - See score distribution charts
   - View missing skills analysis

## Features to Explore

### Blind Screening Mode
- Go to Candidates tab
- Toggle "Blind Mode ON"
- Personal information is hidden for unbiased screening

### Bulk Upload
- Upload multiple resumes at once (up to 500)
- System automatically detects duplicates

### Red Flags
- View candidate details to see detected red flags
- Check for job hopping, career gaps, etc.

### Export Data
- From Candidates tab, click "Export CSV"
- Download candidate data for external analysis

## Troubleshooting

### Backend won't start
- Check that port 3001 is available
- Verify `.env` file exists and has correct Supabase credentials

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify API_BASE_URL in `src/lib/api.ts` is correct

### Resume parsing fails
- Only PDF and DOCX files are supported
- File size must be under 10MB
- Ensure file is not corrupted

### Database errors
- Verify Supabase credentials are correct
- Check that migrations have been applied
- Ensure Row Level Security policies are set up

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints
- Customize scoring weights in `server/services/scoringService.js`
- Add your own skills to the normalization database
- Integrate with your existing ATS or email system

## Support

For issues or questions, refer to:
- `README.md` - Full documentation
- Code comments in source files
- Database schema in migration files
