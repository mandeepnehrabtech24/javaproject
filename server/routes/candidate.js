import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, skills, minScore, location } = req.query;

    let query = supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data: candidates, error } = await query;

    if (error) throw error;

    let filtered = candidates;

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      filtered = candidates.filter(c => {
        const candidateSkills = [
          ...(c.parsed_data?.skills?.technical || []),
          ...(c.parsed_data?.skills?.normalized || [])
        ].map(s => s.toLowerCase());

        return skillsArray.some(skill =>
          candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
        );
      });
    }

    res.json({
      success: true,
      candidates: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('Candidates fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidateError) throw candidateError;

    const { data: scores, error: scoresError } = await supabase
      .from('candidate_scores')
      .select(`
        *,
        jobs (*)
      `)
      .eq('candidate_id', id)
      .order('created_at', { ascending: false });

    if (scoresError) throw scoresError;

    res.json({
      success: true,
      candidate,
      scores
    });
  } catch (error) {
    console.error('Candidate fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/score/:scoreId', async (req, res) => {
  try {
    const { scoreId } = req.params;
    const { recruiter_status, recruiter_notes } = req.body;

    const updates = {};
    if (recruiter_status) updates.recruiter_status = recruiter_status;
    if (recruiter_notes !== undefined) updates.recruiter_notes = recruiter_notes;

    const { data: score, error } = await supabase
      .from('candidate_scores')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', scoreId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      score
    });
  } catch (error) {
    console.error('Score update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
  } catch (error) {
    console.error('Candidate delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
