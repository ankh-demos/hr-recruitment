import { Router, Request, Response } from 'express';
import { resignedAgentModel, employeeModel } from '../models';

const router = Router();

// Get all resigned agents
router.get('/', (req: Request, res: Response) => {
  try {
    const resignedAgents = resignedAgentModel.getAll();
    res.json(resignedAgents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resigned agents' });
  }
});

// Get resigned agent by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const resignedAgent = resignedAgentModel.getById(req.params.id);
    if (!resignedAgent) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }
    res.json(resignedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resigned agent' });
  }
});

// Move employee to resigned agents
router.post('/from-employee/:employeeId', (req: Request, res: Response) => {
  try {
    const { workedMonths, resignedDate, resignationReason, resignationNotes } = req.body;
    
    const employee = employeeModel.getById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Create resigned agent from employee
    const resignedAgent = resignedAgentModel.createFromEmployee(employee, {
      workedMonths,
      resignedDate,
      resignationReason,
      resignationNotes
    });

    // Delete employee from employees table
    employeeModel.delete(req.params.employeeId);

    res.status(201).json(resignedAgent);
  } catch (error) {
    console.error('Error moving employee to resigned:', error);
    res.status(500).json({ error: 'Failed to move employee to resigned agents' });
  }
});

// Move resigned agent back to employees
router.post('/to-employee/:resignedAgentId', (req: Request, res: Response) => {
  try {
    const resignedAgent = resignedAgentModel.getById(req.params.resignedAgentId);
    if (!resignedAgent) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }

    // Create employee from resigned agent
    const employee = employeeModel.createFromResignedAgent(resignedAgent);

    // Delete resigned agent
    resignedAgentModel.delete(req.params.resignedAgentId);

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error moving resigned agent back to employees:', error);
    res.status(500).json({ error: 'Failed to move resigned agent back to employees' });
  }
});

// Update resigned agent
router.put('/:id', (req: Request, res: Response) => {
  try {
    const resignedAgent = resignedAgentModel.update(req.params.id, req.body);
    if (!resignedAgent) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }
    res.json(resignedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resigned agent' });
  }
});

// Delete resigned agent
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = resignedAgentModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Resigned agent not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resigned agent' });
  }
});

export default router;
