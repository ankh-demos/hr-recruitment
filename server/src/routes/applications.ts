import { Router, Request, Response } from 'express';
import { applicationModel, employeeModel } from '../models';

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
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application' });
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

export default router;
