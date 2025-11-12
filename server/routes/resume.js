import express from 'express';
import multer from 'multer';
import { fileParser } from '../services/fileParser.js';
import { aiService } from '../services/aiService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await fileParser.parseFile(req.file.buffer, req.file.mimetype);

    const parsedData = await aiService.parseResume(text);

    const atsScore = aiService.calculateATSScore(parsedData);

    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('email', parsedData.email)
      .maybeSingle();

    let candidate;

    if (existingCandidate) {
      const { data, error } = await supabase
        .from('candidates')
        .update({
          name: parsedData.name,
          phone: parsedData.phone,
          location: parsedData.location,
          parsed_data: parsedData,
          original_filename: req.file.originalname,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCandidate.id)
        .select()
        .single();

      if (error) throw error;
      candidate = data;
    } else {
      const { data, error } = await supabase
        .from('candidates')
        .insert({
          name: parsedData.name,
          email: parsedData.email,
          phone: parsedData.phone,
          location: parsedData.location,
          parsed_data: parsedData,
          original_filename: req.file.originalname
        })
        .select()
        .single();

      if (error) throw error;
      candidate = data;
    }

    res.json({
      success: true,
      candidate,
      ats_score: atsScore,
      is_duplicate: !!existingCandidate
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/parse-bulk', upload.array('files', 500), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const text = await fileParser.parseFile(file.buffer, file.mimetype);
        const parsedData = await aiService.parseResume(text);
        const atsScore = aiService.calculateATSScore(parsedData);

        const { data: existingCandidate } = await supabase
          .from('candidates')
          .select('id')
          .eq('email', parsedData.email)
          .maybeSingle();

        let candidate;

        if (existingCandidate) {
          const { data } = await supabase
            .from('candidates')
            .update({
              name: parsedData.name,
              phone: parsedData.phone,
              location: parsedData.location,
              parsed_data: parsedData,
              original_filename: file.originalname,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCandidate.id)
            .select()
            .single();

          candidate = data;
        } else {
          const { data } = await supabase
            .from('candidates')
            .insert({
              name: parsedData.name,
              email: parsedData.email,
              phone: parsedData.phone,
              location: parsedData.location,
              parsed_data: parsedData,
              original_filename: file.originalname
            })
            .select()
            .single();

          candidate = data;
        }

        results.push({
          filename: file.originalname,
          candidate,
          ats_score: atsScore,
          is_duplicate: !!existingCandidate
        });
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Bulk parsing error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
