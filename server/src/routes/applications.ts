import { Router, Request, Response } from 'express';
import { applicationModel, employeeModel } from '../models';
import { db } from '../database/unifiedDb';
import { emailService } from '../services/emailService';

const router = Router();

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
    const stats = await db.getStatistics(month, period);
    res.json(stats);
  } catch (error) {
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

// Update application status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, ...rest } = req.body;
    const currentApplication = await applicationModel.getById(req.params.id);

    if (!currentApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // If status is changing to 'fireup', set fireupDate
    if (status === 'fireup' && currentApplication.status !== 'fireup') {
      rest.fireupDate = new Date().toISOString().split('T')[0];
    }

    // If status is changing to 'iconnect', create an employee and delete application
    if (status === 'iconnect' && currentApplication.status !== 'iconnect') {
      // Check if employee already exists for this application
      const existingEmployee = await employeeModel.getByApplicationId(req.params.id);
      if (!existingEmployee) {
        // Update application with any additional data before creating employee
        const updatedApp = await applicationModel.update(req.params.id, { status, ...rest });
        if (updatedApp) {
          await employeeModel.createFromApplication(updatedApp);
          // Delete the application after moving to employees
          await applicationModel.delete(req.params.id);
          return res.json({ moved: true, message: 'Application moved to employees' });
        }
      }
    }

    const application = await applicationModel.update(req.params.id, { status, ...rest });
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk import applications' });
  }
});

export default router;
