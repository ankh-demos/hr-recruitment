import { Router, Request, Response } from 'express';
import { jobModel } from '../models';

const router = Router();

// Get all jobs
router.get('/', (req: Request, res: Response) => {
  try {
    const jobs = jobModel.getAll();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const job = jobModel.getById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create job
router.post('/', (req: Request, res: Response) => {
  try {
    const job = jobModel.create(req.body);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', (req: Request, res: Response) => {
  try {
    const job = jobModel.update(req.params.id, req.body);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = jobModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
