import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/unifiedDb';
import { Employee, Application, ResignedAgent } from '../types';

export const employeeModel = {
  async getAll(): Promise<Employee[]> {
    return db.getEmployees();
  },

  async getById(id: string): Promise<Employee | undefined> {
    return db.getEmployeeById(id);
  },

  async getByApplicationId(applicationId: string): Promise<Employee | undefined> {
    return db.getEmployeeByApplicationId(applicationId);
  },

  async createFromApplication(application: Application): Promise<Employee> {
    const now = new Date().toISOString();
    const startDate = now.slice(0, 10);
    const safeString = (value?: string) => value || '';
    const safeArray = <T>(value?: T[]) => Array.isArray(value) ? value : [];
    const employee: Employee = {
      id: uuidv4(),
      applicationId: application.id,
      // Copy all personal info from application
      familyName: safeString(application.familyName),
      lastName: safeString(application.lastName),
      firstName: safeString(application.firstName),
      interestedOffice: safeString(application.interestedOffice),
      birthPlace: safeString(application.birthPlace),
      ethnicity: safeString(application.ethnicity),
      gender: application.gender || 'male',
      birthDate: safeString(application.birthDate),
      registerNumber: safeString(application.registerNumber),
      homeAddress: safeString(application.homeAddress),
      phone: safeString(application.phone),
      emergencyPhone: safeString(application.emergencyPhone),
      email: safeString(application.email),
      facebook: safeString(application.facebook),
      familyMembers: safeArray(application.familyMembers),
      education: safeArray(application.education),
      languages: safeArray(application.languages),
      workExperience: safeArray(application.workExperience),
      otherSkills: safeString(application.otherSkills),
      strengthsWeaknesses: safeString(application.strengthsWeaknesses),
      awards: safeArray(application.awards),
      hasDriverLicense: application.hasDriverLicense || false,
      photoUrl: safeString(application.photoUrl),
      referralSource: safeString(application.referralSource),
      signatureUrl: safeString(application.signatureUrl),
      trainingNumber: safeString(application.trainingNumber),
      // Training dates and transfer info from application
      trainingStartDate: application.trainingStartDate,
      trainingEndDate: application.trainingEndDate,
      fireupDate: application.fireupDate,
      isTransfer: application.isTransfer || false,
      // Employee specific
      officeName: safeString(application.interestedOffice), // Default to interested office
      status: 'active_no_transaction', // Default status for new employees
      employmentStartDate: startDate,
      hiredDate: now,
      createdAt: now,
      updatedAt: now
    };
    return db.createEmployee(employee);
  },

  async createFromResignedAgent(resignedAgent: ResignedAgent): Promise<Employee> {
    const now = new Date().toISOString();
    const startDate = now.slice(0, 10);
    const employee: Employee = {
      id: uuidv4(),
      applicationId: resignedAgent.applicationId,
      // Copy all fields from resigned agent
      familyName: resignedAgent.familyName,
      lastName: resignedAgent.lastName,
      firstName: resignedAgent.firstName,
      interestedOffice: resignedAgent.interestedOffice,
      birthPlace: resignedAgent.birthPlace,
      ethnicity: resignedAgent.ethnicity,
      gender: resignedAgent.gender,
      birthDate: resignedAgent.birthDate,
      registerNumber: resignedAgent.registerNumber,
      homeAddress: resignedAgent.homeAddress,
      phone: resignedAgent.phone,
      emergencyPhone: resignedAgent.emergencyPhone,
      email: resignedAgent.email,
      facebook: resignedAgent.facebook,
      familyMembers: resignedAgent.familyMembers,
      education: resignedAgent.education,
      languages: resignedAgent.languages,
      workExperience: resignedAgent.workExperience,
      otherSkills: resignedAgent.otherSkills,
      strengthsWeaknesses: resignedAgent.strengthsWeaknesses,
      awards: resignedAgent.awards,
      hasDriverLicense: resignedAgent.hasDriverLicense,
      photoUrl: resignedAgent.photoUrl,
      referralSource: resignedAgent.referralSource,
      signatureUrl: resignedAgent.signatureUrl,
      trainingNumber: resignedAgent.trainingNumber,
      certificateNumber: resignedAgent.certificateNumber,
      citizenRegistrationNumber: resignedAgent.citizenRegistrationNumber,
      szhCertificateNumber: resignedAgent.szhCertificateNumber,
      certificateDate: resignedAgent.certificateDate,
      remaxEmail: resignedAgent.remaxEmail,
      mls: resignedAgent.mls,
      bank: resignedAgent.bank,
      accountNumber: resignedAgent.accountNumber,
      district: resignedAgent.district,
      detailedAddress: resignedAgent.detailedAddress,
      childrenCount: resignedAgent.childrenCount,
      employmentStartDate: startDate,
      officeName: resignedAgent.officeName,
      // Employee specific (reset status)
      status: 'active_no_transaction',
      hiredDate: now, // New hire date when re-joining
      createdAt: now,
      updatedAt: now
    };
    return db.createEmployee(employee);
  },

  async create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const now = new Date().toISOString();
    const employee: Employee = {
      ...data,
      employmentStartDate: data.employmentStartDate || now.slice(0, 10),
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    return db.createEmployee(employee);
  },

  async bulkCreate(employees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Employee[]> {
    const results: Employee[] = [];
    for (const data of employees) {
      const created = await this.create(data);
      results.push(created);
    }
    return results;
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee | undefined> {
    const now = new Date().toISOString();
    return db.updateEmployee(id, { ...data, updatedAt: now });
  },

  async delete(id: string): Promise<boolean> {
    return db.deleteEmployee(id);
  }
};
