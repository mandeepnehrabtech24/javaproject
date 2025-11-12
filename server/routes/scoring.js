import express from 'express';
import { scoringService } from '../services/scoringService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/score-candidate', async (req, res) => {
  try {
    const { candidateId, jobId, sessionId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ error: 'Candidate ID and Job ID are required' });
    }

    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError) throw candidateError;

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    const score = await scoringService.scoreCandidate(candidate, job);

    const { data: savedScore, error: scoreError } = await supabase
      .from('candidate_scores')
      .upsert({
        candidate_id: candidateId,
        job_id: jobId,
        session_id: sessionId,
        total_score: score.total_score,
        score_breakdown: score.score_breakdown,
        ai_explanation: score.ai_explanation,
        missing_skills: score.missing_skills,
        red_flags: score.red_flags,
        ats_score: score.ats_score,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'candidate_id,job_id,session_id'
      })
      .select()
      .single();

    if (scoreError) throw scoreError;

    res.json({
      success: true,
      score: savedScore,
      candidate,
      job
    });
  } catch (error) {
    console.error('Scoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/score-bulk', async (req, res) => {
  try {
    const { candidateIds, jobId, blindMode = false, sessionName, userId } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: 'Candidate IDs array is required' });
    }

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    const { data: session, error: sessionError } = await supabase
      .from('screening_sessions')
      .insert({
        job_id: jobId,
        name: sessionName || `Screening ${new Date().toISOString()}`,
        blind_mode: blindMode,
        total_candidates: candidateIds.length,
        processed_candidates: 0,
        status: 'processing',
        created_by: userId
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    const results = [];
    let processed = 0;

    for (const candidateId of candidateIds) {
      try {
        const { data: candidate } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();

        if (!candidate) continue;

        const score = await scoringService.scoreCandidate(candidate, job);

        const { data: savedScore } = await supabase
          .from('candidate_scores')
          .upsert({
            candidate_id: candidateId,
            job_id: jobId,
            session_id: session.id,
            total_score: score.total_score,
            score_breakdown: score.score_breakdown,
            ai_explanation: score.ai_explanation,
            missing_skills: score.missing_skills,
            red_flags: score.red_flags,
            ats_score: score.ats_score
          }, {
            onConflict: 'candidate_id,job_id,session_id'
          })
          .select()
          .single();

        let displayCandidate = candidate;
        if (blindMode) {
          displayCandidate = scoringService.applyBlindMode(candidate);
        }

        results.push({
          candidate: displayCandidate,
          score: savedScore
        });

        processed++;

        await supabase
          .from('screening_sessions')
          .update({ processed_candidates: processed })
          .eq('id', session.id);

      } catch (error) {
        console.error(`Error scoring candidate ${candidateId}:`, error);
      }
    }

    await supabase
      .from('screening_sessions')
      .update({ status: 'completed' })
      .eq('id', session.id);

    results.sort((a, b) => b.score.total_score - a.score.total_score);

    res.json({
      success: true,
      session,
      results,
      total: results.length
    });
  } catch (error) {
    console.error('Bulk scoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data: session, error: sessionError } = await supabase
      .from('screening_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    const { data: scores, error: scoresError } = await supabase
      .from('candidate_scores')
      .select(`
        *,
        candidates (*),
        jobs (*)
      `)
      .eq('session_id', sessionId)
      .order('total_score', { ascending: false });

    if (scoresError) throw scoresError;

    res.json({
      success: true,
      session,
      scores
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const { data: scores, error } = await supabase
      .from('candidate_scores')
      .select('*')
      .eq('job_id', jobId);

    if (error) throw error;

    const analytics = {
      total_candidates: scores.length,
      average_score: scores.reduce((sum, s) => sum + parseFloat(s.total_score), 0) / scores.length || 0,
      score_distribution: {
        excellent: scores.filter(s => s.total_score >= 80).length,
        good: scores.filter(s => s.total_score >= 60 && s.total_score < 80).length,
        average: scores.filter(s => s.total_score >= 40 && s.total_score < 60).length,
        poor: scores.filter(s => s.total_score < 40).length
      },
      status_breakdown: {
        shortlisted: scores.filter(s => s.recruiter_status === 'shortlisted').length,
        rejected: scores.filter(s => s.recruiter_status === 'rejected').length,
        maybe: scores.filter(s => s.recruiter_status === 'maybe').length,
        pending: scores.filter(s => s.recruiter_status === 'pending').length
      },
      missing_skills_frequency: {},
      red_flags_summary: {
        job_hopping: 0,
        career_gap: 0,
        incomplete_contact: 0
      }
    };

    scores.forEach(score => {
      if (score.missing_skills) {
        score.missing_skills.forEach(ms => {
          analytics.missing_skills_frequency[ms.skill] =
            (analytics.missing_skills_frequency[ms.skill] || 0) + 1;
        });
      }

      if (score.red_flags) {
        score.red_flags.forEach(rf => {
          if (analytics.red_flags_summary[rf.type] !== undefined) {
            analytics.red_flags_summary[rf.type]++;
          }
        });
      }
    });

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
