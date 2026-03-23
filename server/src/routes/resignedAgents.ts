import { Router, Request, Response } from 'express';
import { resignedAgentModel, employeeModel } from '../models';
import { getCachedResponse, invalidateCacheByPrefixes, setCachedResponse } from '../utils/routeCache';

const router = Router();
const LIST_TTL_MS = 60 * 1000;

// Get all resigned agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const cacheKey = req.originalUrl;
    const cached = getCachedResponse<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const resignedAgents = await resignedAgentModel.getAll();
    setCachedResponse(cacheKey, resignedAgents, LIST_TTL_MS);
    res.setHeader('X-Cache', 'MISS');
    res.json(resignedAgents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resigned agents' });
  }
});

// Get resigned agent by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const resignedAgent = await resignedAgentModel.getById(req.params.id);
    if (!resignedAgent) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }
    res.json(resignedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resigned agent' });
  }
});

// Move employee to resigned agents
router.post('/from-employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const { workedMonths, resignedDate, resignationReason, resignationNotes } = req.body;
    
    const employee = await employeeModel.getById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Create resigned agent from employee
    const resignedAgent = await resignedAgentModel.createFromEmployee(employee, {
      workedMonths,
      resignedDate,
      resignationReason,
      resignationNotes
    });

    // Delete employee from employees table
    await employeeModel.delete(req.params.employeeId);

    invalidateCacheByPrefixes(['/api/resigned-agents', '/api/employees', '/api/applications/statistics']);

    res.status(201).json(resignedAgent);
  } catch (error) {
    console.error('Error moving employee to resigned:', error);
    res.status(500).json({ error: 'Failed to move employee to resigned agents' });
  }
});

// Move resigned agent back to employees
router.post('/to-employee/:resignedAgentId', async (req: Request, res: Response) => {
  try {
    const resignedAgent = await resignedAgentModel.getById(req.params.resignedAgentId);
    if (!resignedAgent) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }

    // Create employee from resigned agent
    const employee = await employeeModel.createFromResignedAgent(resignedAgent);

    // Delete resigned agent
    await resignedAgentModel.delete(req.params.resignedAgentId);

    invalidateCacheByPrefixes(['/api/resigned-agents', '/api/employees', '/api/applications/statistics']);

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error moving resigned agent back to employees:', error);
    res.status(500).json({ error: 'Failed to move resigned agent back to employees' });
  }
});

// Update resigned agent
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const resignedAgent = await resignedAgentModel.update(req.params.id, req.body);
    if (!resignedAgent) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }
    invalidateCacheByPrefixes(['/api/resigned-agents']);
    res.json(resignedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resigned agent' });
  }
});

// Delete resigned agent
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await resignedAgentModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }
    invalidateCacheByPrefixes(['/api/resigned-agents']);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resigned agent' });
  }
});

export default router;
