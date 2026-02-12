import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/unifiedDb';
import { Application } from '../types';

export const applicationModel = {
  async getAll(): Promise<Application[]> {
    return db.getApplications();
  },

  async getById(id: string): Promise<Application | undefined> {
    return db.getApplicationById(id);
  },

  async create(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Application> {
    const now = new Date().toISOString();
    const application: Application = {
      id: uuidv4(),
      ...data,
      status: 'new',
      createdAt: now,
      updatedAt: now
    };
    return db.createApplication(application);
  },

  async update(id: string, data: Partial<Application>): Promise<Application | undefined> {
    const now = new Date().toISOString();
    return db.updateApplication(id, { ...data, updatedAt: now });
  },

  async delete(id: string): Promise<boolean> {
    return db.deleteApplication(id);
  },

  async bulkCreate(applications: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status'>[]): Promise<Application[]> {
    const now = new Date().toISOString();
    const applicationsWithDefaults = applications.map(app => ({
      id: uuidv4(),
      ...app,
      status: 'new' as const,
      createdAt: now,
      updatedAt: now
    }));
    return db.bulkCreateApplications(applicationsWithDefaults);
  }
};
