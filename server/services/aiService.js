export class AIService {
  async parseResume(text) {
    const prompt = `Extract structured information from this resume. Return ONLY valid JSON with no markdown formatting.

Resume Text:
${text}

Return JSON in this exact format:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "links": {
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "others": []
  },
  "skills": {
    "technical": [],
    "soft": [],
    "normalized": []
  },
  "experience": [
    {
      "title": "",
      "company": "",
      "start": "",
      "end": "",
      "duration_months": 0,
      "description": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "field": "",
      "institution": "",
      "start": "",
      "end": "",
      "gpa": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "tech_stack": [],
      "description": ""
    }
  ],
  "certifications": [],
  "achievements": []
}`;

    const parsed = this.extractResumeData(text);
    return parsed;
  }

  extractResumeData(text) {
    const data = {
      name: this.extractName(text),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      location: this.extractLocation(text),
      links: this.extractLinks(text),
      skills: this.extractSkills(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      projects: this.extractProjects(text),
      certifications: this.extractCertifications(text),
      achievements: this.extractAchievements(text)
    };

    return data;
  }

  extractName(text) {
    const lines = text.split('\n').filter(l => l.trim());
    return lines[0]?.trim() || 'Unknown';
  }

  extractEmail(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  extractPhone(text) {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : '';
  }

  extractLocation(text) {
    const locationPatterns = [
      /(?:Location|Address|Based in|City):\s*([^\n]+)/i,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) return match[1]?.trim() || match[0];
    }
    return '';
  }

  extractLinks(text) {
    const links = {
      linkedin: '',
      github: '',
      portfolio: '',
      others: []
    };

    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) links.linkedin = `https://${linkedinMatch[0]}`;

    const githubMatch = text.match(/github\.com\/[\w-]+/i);
    if (githubMatch) links.github = `https://${githubMatch[0]}`;

    const urlRegex = /https?:\/\/[^\s]+/g;
    const allUrls = text.match(urlRegex) || [];
    links.others = allUrls.filter(url =>
      !url.includes('linkedin.com') && !url.includes('github.com')
    );

    return links;
  }

  extractSkills(text) {
    const commonTechSkills = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Rails',
      'HTML', 'CSS', 'TypeScript', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'Jenkins',
      'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy'
    ];

    const commonSoftSkills = [
      'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
      'Time Management', 'Adaptability', 'Creativity', 'Attention to Detail'
    ];

    const technical = [];
    const soft = [];

    const lowerText = text.toLowerCase();

    commonTechSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        technical.push(skill);
      }
    });

    commonSoftSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        soft.push(skill);
      }
    });

    return {
      technical,
      soft,
      normalized: [...technical]
    };
  }

  extractExperience(text) {
    const experience = [];
    const expSection = this.extractSection(text, ['experience', 'work history', 'employment']);

    if (!expSection) return experience;

    const yearRegex = /\b(19|20)\d{2}\b/g;
    const years = expSection.match(yearRegex) || [];

    const lines = expSection.split('\n').filter(l => l.trim());
    let currentExp = null;

    lines.forEach(line => {
      if (line.length > 10 && !line.startsWith('-') && !line.startsWith('•')) {
        if (currentExp) experience.push(currentExp);

        currentExp = {
          title: line.trim(),
          company: '',
          start: '',
          end: '',
          duration_months: 0,
          description: ''
        };
      } else if (currentExp && line.trim()) {
        currentExp.description += line.trim() + ' ';
      }
    });

    if (currentExp) experience.push(currentExp);

    return experience;
  }

  extractEducation(text) {
    const education = [];
    const eduSection = this.extractSection(text, ['education', 'academic', 'qualification']);

    if (!eduSection) return education;

    const degrees = ['PhD', 'Ph.D', 'Masters', 'Master', 'Bachelor', 'B.Tech', 'B.E', 'M.Tech', 'M.S', 'B.S', 'MBA', 'BBA'];
    const lines = eduSection.split('\n').filter(l => l.trim());

    lines.forEach(line => {
      const hasDegree = degrees.some(deg => line.toLowerCase().includes(deg.toLowerCase()));
      if (hasDegree) {
        education.push({
          degree: line.trim(),
          field: '',
          institution: '',
          start: '',
          end: '',
          gpa: ''
        });
      }
    });

    return education;
  }

  extractProjects(text) {
    const projects = [];
    const projSection = this.extractSection(text, ['projects', 'portfolio', 'personal projects']);

    if (!projSection) return projects;

    const lines = projSection.split('\n').filter(l => l.trim());
    let currentProj = null;

    lines.forEach(line => {
      if (line.length > 5 && !line.startsWith('-') && !line.startsWith('•')) {
        if (currentProj) projects.push(currentProj);

        currentProj = {
          name: line.trim(),
          tech_stack: [],
          description: ''
        };
      } else if (currentProj && line.trim()) {
        currentProj.description += line.trim() + ' ';
      }
    });

    if (currentProj) projects.push(currentProj);

    return projects;
  }

  extractCertifications(text) {
    const certifications = [];
    const certSection = this.extractSection(text, ['certifications', 'certificates', 'licenses']);

    if (!certSection) return certifications;

    const lines = certSection.split('\n').filter(l => l.trim() && l.length > 5);
    return lines.map(l => l.trim());
  }

  extractAchievements(text) {
    const achievements = [];
    const achSection = this.extractSection(text, ['achievements', 'awards', 'honors', 'accomplishments']);

    if (!achSection) return achievements;

    const lines = achSection.split('\n').filter(l => l.trim() && l.length > 5);
    return lines.map(l => l.trim());
  }

  extractSection(text, keywords) {
    const lines = text.split('\n');
    let startIdx = -1;
    let endIdx = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(kw => line.includes(kw))) {
        startIdx = i + 1;
        break;
      }
    }

    if (startIdx === -1) return '';

    const sectionHeaders = ['experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'awards', 'summary', 'objective'];

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (sectionHeaders.some(header => line === header || line === header + ':')) {
        endIdx = i;
        break;
      }
    }

    return lines.slice(startIdx, endIdx).join('\n');
  }

  async parseJobDescription(description) {
    const parsed = {
      job_title: this.extractJobTitle(description),
      required_skills: this.extractRequiredSkills(description),
      good_to_have_skills: this.extractGoodToHaveSkills(description),
      min_experience_years: this.extractMinExperience(description),
      preferred_education: this.extractEducationRequirement(description),
      location: this.extractLocation(description),
      responsibilities: this.extractResponsibilities(description),
      keywords: []
    };

    parsed.keywords = [...parsed.required_skills, ...parsed.good_to_have_skills];
    return parsed;
  }

  extractJobTitle(text) {
    const lines = text.split('\n').filter(l => l.trim());
    return lines[0]?.trim() || 'Position';
  }

  extractRequiredSkills(text) {
    const skills = [];
    const requiredSection = this.extractSection(text, ['required', 'must have', 'requirements', 'qualifications']);

    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
      'SQL', 'MongoDB', 'Git', 'Agile', 'REST API', 'CI/CD'
    ];

    const lowerText = (requiredSection || text).toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return skills;
  }

  extractGoodToHaveSkills(text) {
    const skills = [];
    const niceSection = this.extractSection(text, ['nice to have', 'preferred', 'bonus', 'plus']);

    if (!niceSection) return skills;

    const commonSkills = [
      'TypeScript', 'GraphQL', 'Redis', 'Microservices', 'TDD', 'Azure', 'GCP'
    ];

    const lowerText = niceSection.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return skills;
  }

  extractMinExperience(text) {
    const expRegex = /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i;
    const match = text.match(expRegex);
    return match ? parseInt(match[1]) : 0;
  }

  extractEducationRequirement(text) {
    const degrees = ['PhD', 'Masters', 'Master', 'Bachelor', 'B.Tech', 'B.E', 'M.Tech', 'MBA'];

    for (const degree of degrees) {
      if (text.toLowerCase().includes(degree.toLowerCase())) {
        return degree;
      }
    }
    return '';
  }

  extractResponsibilities(text) {
    const respSection = this.extractSection(text, ['responsibilities', 'duties', 'role', 'what you will do']);

    if (!respSection) return [];

    const lines = respSection.split('\n')
      .filter(l => l.trim() && (l.trim().startsWith('-') || l.trim().startsWith('•') || l.length > 20))
      .map(l => l.replace(/^[-•]\s*/, '').trim());

    return lines;
  }

  async generateExplanation(candidate, job, scoreBreakdown) {
    const strengths = [];
    const weaknesses = [];

    if (scoreBreakdown.required_skills > 70) {
      strengths.push('Strong match on required technical skills');
    } else {
      weaknesses.push('Missing some key required skills');
    }

    if (scoreBreakdown.experience >= 20) {
      strengths.push('Relevant work experience aligns well');
    } else {
      weaknesses.push('Limited relevant experience');
    }

    const explanation = strengths.length > 0
      ? `This candidate shows ${strengths.join(', ')}. ${weaknesses.length > 0 ? 'However, ' + weaknesses.join(', ') + '.' : ''}`
      : `This candidate has ${weaknesses.join(', ')}.`;

    return explanation;
  }

  async detectRedFlags(candidate) {
    const redFlags = [];

    if (candidate.parsed_data?.experience) {
      const experiences = candidate.parsed_data.experience;

      let jobHopCount = 0;
      experiences.forEach(exp => {
        if (exp.duration_months > 0 && exp.duration_months < 12) {
          jobHopCount++;
        }
      });

      if (jobHopCount >= 2) {
        redFlags.push({
          type: 'job_hopping',
          severity: 'medium',
          description: 'Multiple positions held for less than 12 months'
        });
      }

      const sortedExps = [...experiences].sort((a, b) => {
        const aEnd = a.end || '2099';
        const bEnd = b.end || '2099';
        return aEnd.localeCompare(bEnd);
      });

      for (let i = 1; i < sortedExps.length; i++) {
        const gap = 12;
        if (gap > 6) {
          redFlags.push({
            type: 'career_gap',
            severity: 'low',
            description: 'Potential career gap detected between positions'
          });
          break;
        }
      }
    }

    if (!candidate.email || !candidate.phone) {
      redFlags.push({
        type: 'incomplete_contact',
        severity: 'low',
        description: 'Missing contact information'
      });
    }

    return redFlags;
  }

  async generateEmailTemplate(type, candidate, job) {
    const templates = {
      shortlisted: {
        subject: `Exciting Opportunity: ${job.title} Position`,
        body: `Dear ${candidate.name},\n\nWe are pleased to inform you that your application for the ${job.title} position has been shortlisted. Your qualifications and experience align well with our requirements.\n\nWe would like to schedule an interview to discuss this opportunity further. Please reply to this email with your availability for the next week.\n\nBest regards,\nRecruitment Team`
      },
      rejected: {
        subject: `Update on Your Application for ${job.title}`,
        body: `Dear ${candidate.name},\n\nThank you for your interest in the ${job.title} position and for taking the time to apply.\n\nAfter careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.\n\nWe appreciate your interest in our organization and encourage you to apply for future opportunities that match your skills and experience.\n\nBest wishes in your career search.\n\nBest regards,\nRecruitment Team`
      },
      assessment_request: {
        subject: `Next Steps: Technical Assessment for ${job.title}`,
        body: `Dear ${candidate.name},\n\nThank you for your application for the ${job.title} position. We were impressed with your profile and would like to proceed to the next stage.\n\nPlease complete the technical assessment linked below within the next 48 hours:\n[Assessment Link]\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nRecruitment Team`
      }
    };

    return templates[type] || templates.rejected;
  }

  calculateATSScore(resume) {
    let score = 100;

    if (!resume.email) score -= 10;
    if (!resume.phone) score -= 10;
    if (!resume.experience || resume.experience.length === 0) score -= 20;
    if (!resume.education || resume.education.length === 0) score -= 15;
    if (!resume.skills || resume.skills.technical.length === 0) score -= 15;

    const totalSections = [
      resume.experience?.length > 0,
      resume.education?.length > 0,
      resume.skills?.technical.length > 0,
      resume.projects?.length > 0,
      resume.certifications?.length > 0
    ].filter(Boolean).length;

    if (totalSections < 3) score -= 10;

    return Math.max(0, score);
  }
}

export const aiService = new AIService();
