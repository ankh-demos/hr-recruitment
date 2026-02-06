import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Job } from '../types';

export const jobModel = {
  getAll(): Job[] {
    return database.getJobs();
  },

  getById(id: string): Job | undefined {
    return database.getJobById(id);
  },

  create(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Job {
    const now = new Date().toISOString();
    const job: Job = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    return database.createJob(job);
  },

  update(id: string, data: Partial<Job>): Job | undefined {
    const now = new Date().toISOString();
    return database.updateJob(id, { ...data, updatedAt: now });
  },

  delete(id: string): boolean {
    return database.deleteJob(id);
  }
};
