import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { ResignedAgent, Employee } from '../types';

export const resignedAgentModel = {
  getAll(): ResignedAgent[] {
    return database.getResignedAgents();
  },

  getById(id: string): ResignedAgent | undefined {
    return database.getResignedAgentById(id);
  },

  createFromEmployee(
    employee: Employee, 
    resignationData: {
      workedMonths: number;
      resignedDate: string;
      resignationReason: ResignedAgent['resignationReason'];
      resignationNotes?: string;
    }
  ): ResignedAgent {
    const now = new Date().toISOString();
    const resignedAgent: ResignedAgent = {
      id: uuidv4(),
      employeeId: employee.id,
      applicationId: employee.applicationId,
      // Copy all employee fields
      familyName: employee.familyName,
      lastName: employee.lastName,
      firstName: employee.firstName,
      interestedOffice: employee.interestedOffice,
      birthPlace: employee.birthPlace,
      ethnicity: employee.ethnicity,
      gender: employee.gender,
      birthDate: employee.birthDate,
      registerNumber: employee.registerNumber,
      homeAddress: employee.homeAddress,
      phone: employee.phone,
      emergencyPhone: employee.emergencyPhone,
      email: employee.email,
      facebook: employee.facebook,
      familyMembers: employee.familyMembers,
      education: employee.education,
      languages: employee.languages,
      workExperience: employee.workExperience,
      otherSkills: employee.otherSkills,
      strengthsWeaknesses: employee.strengthsWeaknesses,
      awards: employee.awards,
      hasDriverLicense: employee.hasDriverLicense,
      photoUrl: employee.photoUrl,
      referralSource: employee.referralSource,
      signatureUrl: employee.signatureUrl,
      trainingNumber: employee.trainingNumber,
      certificateNumber: employee.certificateNumber,
      citizenRegistrationNumber: employee.citizenRegistrationNumber,
      szhCertificateNumber: employee.szhCertificateNumber,
      certificateDate: employee.certificateDate,
      remaxEmail: employee.remaxEmail,
      mls: employee.mls,
      bank: employee.bank,
      accountNumber: employee.accountNumber,
      district: employee.district,
      detailedAddress: employee.detailedAddress,
      childrenCount: employee.childrenCount,
      hiredDate: employee.hiredDate,
      employmentStartDate: employee.employmentStartDate,
      // Resignation specific
      workedMonths: resignationData.workedMonths,
      resignedDate: resignationData.resignedDate,
      resignationReason: resignationData.resignationReason,
      resignationNotes: resignationData.resignationNotes,
      createdAt: now,
      updatedAt: now
    };
    return database.createResignedAgent(resignedAgent);
  },

  update(id: string, data: Partial<ResignedAgent>): ResignedAgent | undefined {
    const now = new Date().toISOString();
    return database.updateResignedAgent(id, { ...data, updatedAt: now });
  },

  delete(id: string): boolean {
    return database.deleteResignedAgent(id);
  }
};
