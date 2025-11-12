import express from 'express';
import { aiService } from '../services/aiService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { candidateId, jobId, templateType, userId } = req.body;

    if (!candidateId || !jobId || !templateType) {
      return res.status(400).json({ error: 'Candidate ID, Job ID, and template type are required' });
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

    const template = await aiService.generateEmailTemplate(
      templateType,
      candidate,
      job
    );

    const { data: savedTemplate, error: saveError } = await supabase
      .from('email_templates')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        template_type: templateType,
        subject: template.subject,
        body: template.body,
        created_by: userId
      })
      .select()
      .single();

    if (saveError) throw saveError;

    res.json({
      success: true,
      template: savedTemplate
    });
  } catch (error) {
    console.error('Email generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-bulk', async (req, res) => {
  try {
    const { candidateIds, jobId, templateType, userId } = req.body;

    if (!candidateIds || !Array.isArray(candidateIds) || !jobId || !templateType) {
      return res.status(400).json({ error: 'Candidate IDs array, Job ID, and template type are required' });
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    const templates = [];

    for (const candidateId of candidateIds) {
      try {
        const { data: candidate } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();

        if (!candidate) continue;

        const template = await aiService.generateEmailTemplate(
          templateType,
          candidate,
          job
        );

        const { data: savedTemplate } = await supabase
          .from('email_templates')
          .insert({
            candidate_id: candidateId,
            job_id: jobId,
            template_type: templateType,
            subject: template.subject,
            body: template.body,
            created_by: userId
          })
          .select()
          .single();

        templates.push(savedTemplate);
      } catch (error) {
        console.error(`Error generating email for candidate ${candidateId}:`, error);
      }
    }

    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Bulk email generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { userId, candidateId, jobId } = req.query;

    let query = supabase
      .from('email_templates')
      .select(`
        *,
        candidates (*),
        jobs (*)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('created_by', userId);
    }

    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    }

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data: templates, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
