import { Router, Request, Response } from 'express';
import { employeeModel, agentRankModel } from '../models';
import { getCachedResponse, invalidateCacheByPrefixes, setCachedResponse } from '../utils/routeCache';

const router = Router();
const LIST_TTL_MS = 60 * 1000;

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
    const cacheKey = req.originalUrl;
    const cached = getCachedResponse<any[]>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const employees = await employeeModel.getAll();
    // Return employees directly - frontend fetches ranks separately
    // This avoids N+1 query problem (100+ employees = 100+ rank queries)
    setCachedResponse(cacheKey, employees, LIST_TTL_MS);
    res.setHeader('X-Cache', 'MISS');
    res.json(employees);
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
    invalidateCacheByPrefixes(['/api/employees', '/api/applications/statistics']);
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
    const id = req.params.id;
    console.log('PUT /employees/:id - ID:', id, 'Body:', JSON.stringify(req.body).substring(0, 300));
    
    // First check if employee exists
    const existing = await employeeModel.getById(id);
    if (!existing) {
      console.log('Employee not found for ID:', id);
      return res.status(404).json({ 
        error: 'Employee not found', 
        details: 'Ажилтан олдсонгүй. Энэ ID Supabase дээр бүртгэлгүй байж магадгүй.' 
      });
    }
    console.log('Employee found, updating...');
    
    const employee = await employeeModel.update(id, req.body);
    if (!employee) {
      console.error('Update returned null/undefined for ID:', id);
      return res.status(500).json({ 
        error: 'Update failed', 
        details: 'Мэдээлэл шинэчлэхэд алдаа гарлаа. Консол дээр дэлгэрэнгүй мэдээлэл харна уу.' 
      });
    }
    invalidateCacheByPrefixes(['/api/employees', '/api/applications/statistics']);
    res.json(employee);
  } catch (error: any) {
    console.error('Failed to update employee:', error);
    if (error?.message?.includes('employees_mls_key')) {
      return res.status(400).json({
        error: 'Failed to update employee',
        details: 'MLS давхардсан байна. Өөр MLS дугаар оруулна уу.'
      });
    }
    res.status(500).json({ error: 'Failed to update employee', details: error?.message });
  }
});

// Delete employee
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await employeeModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    invalidateCacheByPrefixes(['/api/employees', '/api/applications/statistics']);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

export default router;
