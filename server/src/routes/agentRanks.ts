import { Router, Request, Response } from 'express';
import { agentRankModel } from '../models';
import { RankLevel } from '../types';

const router = Router();

// Get all agent ranks
router.get('/', async (req: Request, res: Response) => {
  try {
    const agentRanks = await agentRankModel.getAll();
    res.json(agentRanks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent ranks' });
  }
});

// Get agent rank by agent ID (MLS) - must be before /:id to avoid shadowing
router.get('/by-agent/:agentId', async (req: Request, res: Response) => {
  try {
    const agentRank = await agentRankModel.getByAgentId(req.params.agentId);
    if (!agentRank) {
      return res.status(404).json({ error: 'Agent rank not found' });
    }
    res.json(agentRank);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent rank' });
  }
});

// Get current valid rank for agent - must be before /:id to avoid shadowing
router.get('/current/:agentId', async (req: Request, res: Response) => {
  try {
    const checkDate = req.query.date as string | undefined;
    const currentRank = await agentRankModel.getCurrentRankByAgentId(req.params.agentId, checkDate);
    res.json({ rank: currentRank });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get current rank' });
  }
});

// Get agent rank by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agentRank = await agentRankModel.getById(req.params.id);
    if (!agentRank) {
      return res.status(404).json({ error: 'Agent rank not found' });
    }
    res.json(agentRank);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent rank' });
  }
});

// Create new agent rank
router.post('/', async (req: Request, res: Response) => {
  try {
    const { agentId, agentName, contractNumber, rank, startDate } = req.body;
    
    // Check if agent already has a rank record
    const existing = await agentRankModel.getByAgentId(agentId);
    if (existing) {
      return res.status(400).json({ error: 'Agent already has a rank record. Use PUT to update.' });
    }

    const agentRank = await agentRankModel.create({
      agentId,
      agentName,
      contractNumber,
      rank: rank as RankLevel,
      startDate
    });
    res.status(201).json(agentRank);
  } catch (error) {
    console.error('Error creating agent rank:', error);
    res.status(500).json({ error: 'Failed to create agent rank' });
  }
});

// Update rank (promote/change) - adds to history
router.put('/:id/rank', async (req: Request, res: Response) => {
  try {
    const { rank, startDate, agentName } = req.body;
    const agentRank = await agentRankModel.updateRank(req.params.id, {
      rank: rank as RankLevel,
      startDate,
      agentName
    });
    if (!agentRank) {
      return res.status(404).json({ error: 'Agent rank not found' });
    }
    res.json(agentRank);
  } catch (error) {
    console.error('Error updating rank:', error);
    res.status(500).json({ error: 'Failed to update rank' });
  }
});

// Update agent rank general info
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const agentRank = await agentRankModel.update(req.params.id, req.body);
    if (!agentRank) {
      return res.status(404).json({ error: 'Agent rank not found' });
    }
    res.json(agentRank);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent rank' });
  }
});

// Delete agent rank
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await agentRankModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Agent rank not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent rank' });
  }
});

export default router;
