import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Employee, Application, ResignedAgent } from '../types';

export const employeeModel = {
  getAll(): Employee[] {
    return database.getEmployees();
  },

  getById(id: string): Employee | undefined {
    return database.getEmployeeById(id);
  },

  getByApplicationId(applicationId: string): Employee | undefined {
    return database.getEmployeeByApplicationId(applicationId);
  },

  createFromApplication(application: Application): Employee {
    const now = new Date().toISOString();
    const employee: Employee = {
      id: uuidv4(),
      applicationId: application.id,
      // Copy all personal info from application
      familyName: application.familyName,
      lastName: application.lastName,
      firstName: application.firstName,
      interestedOffice: application.interestedOffice,
      birthPlace: application.birthPlace,
      ethnicity: application.ethnicity,
      gender: application.gender,
      birthDate: application.birthDate,
      registerNumber: application.registerNumber,
      homeAddress: application.homeAddress,
      phone: application.phone,
      emergencyPhone: application.emergencyPhone,
      email: application.email,
      facebook: application.facebook,
      familyMembers: application.familyMembers,
      education: application.education,
      languages: application.languages,
      workExperience: application.workExperience,
      otherSkills: application.otherSkills,
      strengthsWeaknesses: application.strengthsWeaknesses,
      awards: application.awards,
      hasDriverLicense: application.hasDriverLicense,
      photoUrl: application.photoUrl,
      referralSource: application.referralSource,
      signatureUrl: application.signatureUrl,
      trainingNumber: application.trainingNumber,
      // Employee specific
      status: 'new_0_3', // Default status for new employees
      hiredDate: now,
      createdAt: now,
      updatedAt: now
    };
    return database.createEmployee(employee);
  },

  createFromResignedAgent(resignedAgent: ResignedAgent): Employee {
    const now = new Date().toISOString();
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
      employmentStartDate: resignedAgent.employmentStartDate,
      // Employee specific (reset status)
      status: 'active',
      hiredDate: now, // New hire date when re-joining
      createdAt: now,
      updatedAt: now
    };
    return database.createEmployee(employee);
  },

  create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const now = new Date().toISOString();
    const employee: Employee = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    return database.createEmployee(employee);
  },

  bulkCreate(employees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[]): Employee[] {
    return employees.map(data => this.create(data));
  },

  update(id: string, data: Partial<Employee>): Employee | undefined {
    const now = new Date().toISOString();
    return database.updateEmployee(id, { ...data, updatedAt: now });
  },

  delete(id: string): boolean {
    return database.deleteEmployee(id);
  }
};
