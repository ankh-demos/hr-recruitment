import { Router, Request, Response } from 'express';
import { applicationModel, employeeModel } from '../models';
import { db } from '../database/unifiedDb';
import { emailService } from '../services/emailService';

const router = Router();

async function moveApplicationToEmployees(applicationId: string, applicationData: any) {
  console.log('[iConnect] Starting iConnect flow for application:', applicationId);

  const existingEmployee = await employeeModel.getByApplicationId(applicationId);
  console.log('[iConnect] Existing employee check:', existingEmployee ? 'FOUND' : 'NOT FOUND');

  if (!existingEmployee) {
    console.log('[iConnect] Creating employee from application...');
    const employee = await employeeModel.createFromApplication(applicationData);
    console.log('[iConnect] Employee created:', employee.id);
    await applicationModel.delete(applicationId);
    console.log('[iConnect] Application deleted');
    return { alreadyExisted: false };
  }

  console.log('[iConnect] Employee already exists, deleting application to complete move');
  await applicationModel.delete(applicationId);
  return { alreadyExisted: true };
}

function normalizeStatus(status: unknown) {
  if (typeof status !== 'string') {
    return status;
  }
  return status.trim().toLowerCase();
}

// Get all applications
router.get('/', async (req: Request, res: Response) => {
  try {
    const applications = await applicationModel.getAll();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    const period = req.query.period as 'monthly' | 'quarterly' | 'yearly' | undefined;
    console.log('[Statistics Route] Fetching statistics - month:', month || 'current', 'period:', period || 'monthly');
    const stats = await db.getStatistics(month, period);
    res.json(stats);
  } catch (error: any) {
    console.error('[Statistics Route] Error:', error?.message || error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get application by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const application = await applicationModel.getById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Create application (public endpoint for applicants)
router.post('/', async (req: Request, res: Response) => {
  try {
    const application = await applicationModel.create(req.body);

    // Send email notification to admins (async, don't wait)
    emailService.notifyNewApplication(application).catch(err => {
      console.error('Failed to send new application notification:', err);
    });

    res.status(201).json(application);
  } catch (error: any) {
    console.error('Failed to create application:', error);
    const message = error?.message || 'Failed to create application';
    res.status(500).json({ error: message });
  }
});

// Backfill: move all applications with status 'iconnect' into employees
router.post('/sync-iconnect', async (_req: Request, res: Response) => {
  try {
    const applications = await applicationModel.getAll();
    const iconnectApplications = applications.filter(app => app.status === 'iconnect');

    const summary = {
      total: iconnectApplications.length,
      moved: 0,
      alreadyMoved: 0,
      failed: 0,
      errors: [] as Array<{ applicationId: string; error: string }>
    };

    for (const application of iconnectApplications) {
      try {
        const result = await moveApplicationToEmployees(application.id, application);
        if (result.alreadyExisted) {
          summary.alreadyMoved += 1;
        } else {
          summary.moved += 1;
        }
      } catch (error: any) {
        summary.failed += 1;
        summary.errors.push({
          applicationId: application.id,
          error: error?.message || 'Unknown error'
        });
      }
    }

    res.json(summary);
  } catch (error: any) {
    console.error('Failed to sync iConnect applications:', error);
    res.status(500).json({
      error: 'Failed to sync iConnect applications',
      details: error?.message
    });
  }
});

// Update application status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, ...rest } = req.body;
    const normalizedStatus = normalizeStatus(status) as typeof status;
    const currentApplication = await applicationModel.getById(req.params.id);

    if (!currentApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // If status is changing to 'fireup', set fireupDate
    if (normalizedStatus === 'fireup' && currentApplication.status !== 'fireup') {
      rest.fireupDate = new Date().toISOString().split('T')[0];
    }

    // If status is iconnect, or this row is already iconnect, move to employees
    if (normalizedStatus === 'iconnect' || currentApplication.status === 'iconnect') {
      try {
        const result = await moveApplicationToEmployees(req.params.id, currentApplication);
        if (result.alreadyExisted) {
          return res.json({ moved: true, message: 'Application already moved to employees' });
        }
        return res.json({ moved: true, message: 'Application moved to employees' });
      } catch (createError: any) {
        console.error('[iConnect] Failed to create employee:', createError?.message, createError?.code, createError?.details);
        return res.status(500).json({
          error: 'Failed to create employee',
          details: createError?.message || 'Database error - check status constraint'
        });
      }
    }

    const updates = normalizedStatus === undefined ? rest : { status: normalizedStatus, ...rest };
    const application = await applicationModel.update(req.params.id, updates);
    res.json(application);
  } catch (error: any) {
    console.error('Failed to update application:', error);
    res.status(500).json({ error: 'Failed to update application', details: error?.message });
  }
});

// Delete application
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await applicationModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Bulk import applications
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const applications = req.body;
    if (!Array.isArray(applications)) {
      return res.status(400).json({ error: 'Request body must be an array of applications' });
    }
    const created = await applicationModel.bulkCreate(applications);
    res.status(201).json({ success: true, count: created.length, applications: created });
  } catch (error: any) {
    console.error('Failed to bulk import applications:', error?.message || error);
    res.status(500).json({ error: 'Failed to bulk import applications', details: error?.message });
  }
});

export default router;
