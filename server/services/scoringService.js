import { aiService } from './aiService.js';

export class ScoringService {
  async scoreCandidate(candidate, job) {
    const scoreBreakdown = {
      required_skills: 0,
      good_to_have_skills: 0,
      experience: 0,
      education: 0,
      projects: 0,
      certifications: 0
    };

    const candidateData = candidate.parsed_data;
    const jobData = job.parsed_data;

    scoreBreakdown.required_skills = this.calculateRequiredSkillsScore(
      candidateData,
      jobData
    );

    scoreBreakdown.good_to_have_skills = this.calculateGoodToHaveSkillsScore(
      candidateData,
      jobData
    );

    scoreBreakdown.experience = this.calculateExperienceScore(
      candidateData,
      jobData
    );

    scoreBreakdown.education = this.calculateEducationScore(
      candidateData,
      jobData
    );

    scoreBreakdown.projects = this.calculateProjectScore(
      candidateData,
      jobData
    );

    scoreBreakdown.certifications = this.calculateCertificationScore(
      candidateData
    );

    const totalScore = (
      scoreBreakdown.required_skills * 0.35 +
      scoreBreakdown.good_to_have_skills * 0.15 +
      scoreBreakdown.experience * 0.25 +
      scoreBreakdown.education * 0.10 +
      scoreBreakdown.projects * 0.10 +
      scoreBreakdown.certifications * 0.05
    );

    const aiExplanation = await aiService.generateExplanation(
      candidate,
      job,
      scoreBreakdown
    );

    const redFlags = await aiService.detectRedFlags(candidate);

    const missingSkills = this.identifyMissingSkills(candidateData, jobData);

    const atsScore = aiService.calculateATSScore(candidateData);

    return {
      total_score: Math.round(totalScore * 100) / 100,
      score_breakdown: scoreBreakdown,
      ai_explanation: aiExplanation,
      red_flags: redFlags,
      missing_skills: missingSkills,
      ats_score: atsScore
    };
  }

  calculateRequiredSkillsScore(candidateData, jobData) {
    const requiredSkills = jobData.required_skills || [];
    if (requiredSkills.length === 0) return 100;

    const candidateSkills = [
      ...(candidateData.skills?.technical || []),
      ...(candidateData.skills?.normalized || [])
    ].map(s => s.toLowerCase());

    let matchCount = 0;
    requiredSkills.forEach(skill => {
      if (candidateSkills.some(cs =>
        cs.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cs)
      )) {
        matchCount++;
      }
    });

    return (matchCount / requiredSkills.length) * 100;
  }

  calculateGoodToHaveSkillsScore(candidateData, jobData) {
    const goodToHaveSkills = jobData.good_to_have_skills || [];
    if (goodToHaveSkills.length === 0) return 100;

    const candidateSkills = [
      ...(candidateData.skills?.technical || []),
      ...(candidateData.skills?.normalized || [])
    ].map(s => s.toLowerCase());

    let matchCount = 0;
    goodToHaveSkills.forEach(skill => {
      if (candidateSkills.some(cs =>
        cs.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cs)
      )) {
        matchCount++;
      }
    });

    return (matchCount / goodToHaveSkills.length) * 100;
  }

  calculateExperienceScore(candidateData, jobData) {
    const minYears = jobData.min_experience_years || 0;
    const experiences = candidateData.experience || [];

    const totalMonths = experiences.reduce((sum, exp) => {
      return sum + (exp.duration_months || 12);
    }, 0);

    const candidateYears = totalMonths / 12;

    if (candidateYears >= minYears) {
      return 100;
    } else if (candidateYears >= minYears * 0.7) {
      return 80;
    } else if (candidateYears >= minYears * 0.5) {
      return 60;
    } else {
      return (candidateYears / minYears) * 50;
    }
  }

  calculateEducationScore(candidateData, jobData) {
    const preferredEdu = jobData.preferred_education || '';
    if (!preferredEdu) return 100;

    const educations = candidateData.education || [];
    if (educations.length === 0) return 50;

    const hasMatch = educations.some(edu =>
      edu.degree.toLowerCase().includes(preferredEdu.toLowerCase())
    );

    return hasMatch ? 100 : 70;
  }

  calculateProjectScore(candidateData, jobData) {
    const projects = candidateData.projects || [];
    const requiredSkills = jobData.required_skills || [];

    if (projects.length === 0) return 50;

    let relevantProjects = 0;
    projects.forEach(project => {
      const projectText = `${project.name} ${project.description} ${project.tech_stack.join(' ')}`.toLowerCase();

      const hasRelevantSkills = requiredSkills.some(skill =>
        projectText.includes(skill.toLowerCase())
      );

      if (hasRelevantSkills) relevantProjects++;
    });

    if (relevantProjects >= 2) return 100;
    if (relevantProjects >= 1) return 80;
    return 60;
  }

  calculateCertificationScore(candidateData) {
    const certifications = candidateData.certifications || [];

    if (certifications.length >= 3) return 100;
    if (certifications.length >= 1) return 80;
    return 60;
  }

  identifyMissingSkills(candidateData, jobData) {
    const requiredSkills = jobData.required_skills || [];
    const candidateSkills = [
      ...(candidateData.skills?.technical || []),
      ...(candidateData.skills?.normalized || [])
    ].map(s => s.toLowerCase());

    const missing = [];

    requiredSkills.forEach(skill => {
      const hasSkill = candidateSkills.some(cs =>
        cs.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cs)
      );

      if (!hasSkill) {
        missing.push({
          skill: skill,
          priority: 'high',
          suggestion: `Consider learning ${skill} to improve your match for this role`
        });
      }
    });

    return missing;
  }

  async scoreBulk(candidates, job, blindMode = false) {
    const results = [];

    for (const candidate of candidates) {
      const score = await this.scoreCandidate(candidate, job);

      let candidateData = { ...candidate };

      if (blindMode) {
        candidateData = this.applyBlindMode(candidateData);
      }

      results.push({
        candidate: candidateData,
        score: score
      });
    }

    results.sort((a, b) => b.score.total_score - a.score.total_score);

    return results;
  }

  applyBlindMode(candidate) {
    const masked = { ...candidate };

    masked.name = 'Candidate ' + masked.id.substring(0, 8);
    masked.email = 'masked@email.com';
    masked.phone = 'XXX-XXX-XXXX';
    masked.location = '';

    if (masked.parsed_data) {
      masked.parsed_data = { ...masked.parsed_data };
      masked.parsed_data.name = masked.name;
      masked.parsed_data.email = masked.email;
      masked.parsed_data.phone = masked.phone;
      masked.parsed_data.location = '';

      if (masked.parsed_data.education) {
        masked.parsed_data.education = masked.parsed_data.education.map(edu => ({
          ...edu,
          institution: 'University'
        }));
      }
    }

    return masked;
  }
}

export const scoringService = new ScoringService();
