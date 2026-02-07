import { Router, Request, Response } from 'express';
import { interviewModel } from '../models';

const router = Router();

// Get all interviews
router.get('/', async (req: Request, res: Response) => {
  try {
    const interviews = await interviewModel.getAll();
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get upcoming interviews
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const interviews = await interviewModel.getUpcoming();
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming interviews' });
  }
});

// Get interview by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const interview = await interviewModel.getById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Get interviews by candidate ID
router.get('/candidate/:candidateId', async (req: Request, res: Response) => {
  try {
    const interviews = await interviewModel.getByCandidateId(req.params.candidateId);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get interviews by job ID
router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const interviews = await interviewModel.getByJobId(req.params.jobId);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Create interview
router.post('/', async (req: Request, res: Response) => {
  try {
    const interview = await interviewModel.create(req.body);
    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const interview = await interviewModel.update(req.params.id, req.body);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Delete interview
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await interviewModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

export default router;
