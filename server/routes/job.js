import express from 'express';
import { aiService } from '../services/aiService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/parse', async (req, res) => {
  try {
    const { description, title, userId } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const parsedData = await aiService.parseJobDescription(description);

    if (title) {
      parsedData.job_title = title;
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title: parsedData.job_title,
        description,
        parsed_data: parsedData,
        created_by: userId,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      job,
      parsed_data: parsedData
    });
  } catch (error) {
    console.error('Job parsing error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Job fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Job update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Job delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
