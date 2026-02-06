import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Interview } from '../types';

export const interviewModel = {
  getAll(): Interview[] {
    return database.getInterviews();
  },

  getById(id: string): Interview | undefined {
    return database.getInterviewById(id);
  },

  getByCandidateId(candidateId: string): Interview[] {
    return database.getInterviewsByCandidateId(candidateId);
  },

  getByJobId(jobId: string): Interview[] {
    return database.getInterviewsByJobId(jobId);
  },

  getUpcoming(): Interview[] {
    return database.getUpcomingInterviews();
  },

  create(data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Interview {
    const now = new Date().toISOString();
    const interview: Interview = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    return database.createInterview(interview);
  },

  update(id: string, data: Partial<Interview>): Interview | undefined {
    const now = new Date().toISOString();
    return database.updateInterview(id, { ...data, updatedAt: now });
  },

  delete(id: string): boolean {
    return database.deleteInterview(id);
  }
};
