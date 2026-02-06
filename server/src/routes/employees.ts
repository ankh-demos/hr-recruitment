import { Router, Request, Response } from 'express';
import { employeeModel } from '../models';

const router = Router();

// Get all employees
router.get('/', (req: Request, res: Response) => {
  try {
    const employees = employeeModel.getAll();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Bulk import employees
router.post('/bulk', (req: Request, res: Response) => {
  try {
    const employees = req.body;
    if (!Array.isArray(employees)) {
      return res.status(400).json({ error: 'Request body must be an array of employees' });
    }
    const created = employeeModel.bulkCreate(employees);
    res.status(201).json({ success: true, count: created.length, employees: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk import employees' });
  }
});

// Get employee by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const employee = employeeModel.getById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Update employee
router.put('/:id', (req: Request, res: Response) => {
  try {
    const employee = employeeModel.update(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = employeeModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;
