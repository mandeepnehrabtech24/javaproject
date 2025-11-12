const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  async parseResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/resume/parse`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  },

  async parseResumeBulk(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/resume/parse-bulk`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  },

  async parseJobDescription(description: string, title: string, userId?: string) {
    const response = await fetch(`${API_BASE_URL}/job/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, title, userId }),
    });

    return response.json();
  },

  async getJobs(userId?: string) {
    const url = new URL(`${API_BASE_URL}/job`);
    if (userId) url.searchParams.append('userId', userId);

    const response = await fetch(url.toString());
    return response.json();
  },

  async getJob(id: string) {
    const response = await fetch(`${API_BASE_URL}/job/${id}`);
    return response.json();
  },

  async scoreCandidate(candidateId: string, jobId: string, sessionId?: string) {
    const response = await fetch(`${API_BASE_URL}/scoring/score-candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, jobId, sessionId }),
    });

    return response.json();
  },

  async scoreBulk(candidateIds: string[], jobId: string, blindMode: boolean, sessionName: string, userId?: string) {
    const response = await fetch(`${API_BASE_URL}/scoring/score-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds, jobId, blindMode, sessionName, userId }),
    });

    return response.json();
  },

  async getSession(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/scoring/session/${sessionId}`);
    return response.json();
  },

  async getAnalytics(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/scoring/analytics/${jobId}`);
    return response.json();
  },

  async getCandidates(filters?: { search?: string; skills?: string; location?: string }) {
    const url = new URL(`${API_BASE_URL}/candidates`);
    if (filters?.search) url.searchParams.append('search', filters.search);
    if (filters?.skills) url.searchParams.append('skills', filters.skills);
    if (filters?.location) url.searchParams.append('location', filters.location);

    const response = await fetch(url.toString());
    return response.json();
  },

  async getCandidate(id: string) {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`);
    return response.json();
  },

  async updateCandidateScore(candidateId: string, scoreId: string, data: { recruiter_status?: string; recruiter_notes?: string }) {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/score/${scoreId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  async generateEmail(candidateId: string, jobId: string, templateType: string, userId?: string) {
    const response = await fetch(`${API_BASE_URL}/email/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, jobId, templateType, userId }),
    });

    return response.json();
  },

  async generateBulkEmails(candidateIds: string[], jobId: string, templateType: string, userId?: string) {
    const response = await fetch(`${API_BASE_URL}/email/generate-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds, jobId, templateType, userId }),
    });

    return response.json();
  },
};
