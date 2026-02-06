import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Application } from '../types';

export const applicationModel = {
  getAll(): Application[] {
    return database.getApplications();
  },

  getById(id: string): Application | undefined {
    return database.getApplicationById(id);
  },

  create(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Application {
    const now = new Date().toISOString();
    const application: Application = {
      id: uuidv4(),
      ...data,
      status: 'new',
      createdAt: now,
      updatedAt: now
    };
    return database.createApplication(application);
  },

  update(id: string, data: Partial<Application>): Application | undefined {
    const now = new Date().toISOString();
    return database.updateApplication(id, { ...data, updatedAt: now });
  },

  delete(id: string): boolean {
    return database.deleteApplication(id);
  }
};
