import { Router, Request, Response } from 'express';
import { candidateModel } from '../models';

const router = Router();

// Get all candidates
router.get('/', (req: Request, res: Response) => {
  try {
    const candidates = candidateModel.getAll();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const candidate = candidateModel.getById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// Get candidates by job ID
router.get('/job/:jobId', (req: Request, res: Response) => {
  try {
    const candidates = candidateModel.getByJobId(req.params.jobId);
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Create candidate
router.post('/', (req: Request, res: Response) => {
  try {
    const candidate = candidateModel.create(req.body);
    res.status(201).json(candidate);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// Update candidate
router.put('/:id', (req: Request, res: Response) => {
  try {
    const candidate = candidateModel.update(req.params.id, req.body);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Delete candidate
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = candidateModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

export default router;
