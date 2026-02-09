import { Router, Request, Response } from 'express';
import { employeeModel, agentRankModel } from '../models';

const router = Router();

// Helper to add rank info to employee
async function addRankInfo(employee: any) {
  if (employee.mls) {
    const agentRank = await agentRankModel.getByAgentId(employee.mls);
    if (agentRank) {
      employee.currentRank = agentRank.currentRank;
      employee.rankContractNumber = agentRank.contractNumber;
      employee.rankStartDate = agentRank.currentStartDate;
      employee.rankEndDate = agentRank.currentEndDate;
    }
  }
  return employee;
}

// Get all employees
router.get('/', async (req: Request, res: Response) => {
  try {
    const employees = await employeeModel.getAll();
    // Add rank info to each employee
    const employeesWithRank = await Promise.all(
      employees.map(e => addRankInfo({ ...e }))
    );
    res.json(employeesWithRank);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Bulk import employees
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const employees = req.body;
    if (!Array.isArray(employees)) {
      return res.status(400).json({ error: 'Request body must be an array of employees' });
    }
    const created = await employeeModel.bulkCreate(employees);
    res.status(201).json({ success: true, count: created.length, employees: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk import employees' });
  }
});

// Get employee by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await employeeModel.getById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    // Add rank info
    const employeeWithRank = await addRankInfo({ ...employee });
    res.json(employeeWithRank);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Update employee
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const employee = await employeeModel.update(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await employeeModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;
