export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  skills: string[];
  experience: number;
  status: 'new' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected';
  appliedJobId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'draft' | 'open' | 'closed' | 'on-hold';
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobId: string;
  scheduledAt: string;
  duration: number;
  type: 'phone' | 'video' | 'onsite' | 'technical';
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

// Application Form Types
export interface FamilyMember {
  relationship: string;
  fullName: string;
  birthPlace: string;
  profession: string;
  phone: string;
}

export interface Education {
  school: string;
  enrollmentDate: string;
  graduationDate: string;
  major: string;
  gpa: string;
}

export interface Language {
  language: string;
  level: string;
}

export interface WorkExperience {
  companyName: string;
  businessType: string;
  position: string;
  startDate: string;
  endDate: string;
  salary: string;
}

export interface Award {
  organization: string;
  year: string;
  awardName: string;
}

// Application Meeting (for 3-level interviews)
export interface ApplicationMeeting {
  date: string; // Уулзалт хийсэн огноо
  interviewerId: string; // Уулзалт хийсэн ажилтны ID
  interviewerName: string; // Уулзалт хийсэн ажилтны нэр
  notes: string; // Нэмэлт тэмдэглэл
}

export interface Application {
  id: string;
  // Personal Information
  familyName: string; // Ургийн овог
  lastName: string; // Овог
  firstName: string; // Нэр
  interestedOffice: string; // Ажилд орохоор сонирхож буй оффис
  availableDate: string; // Ажилд орох боломжтой огноо
  birthPlace: string; // Төрсөн газар
  ethnicity: string; // Үндэс угсаа
  gender: 'male' | 'female'; // Хүйс
  birthDate: string; // Төрсөн огноо
  registerNumber: string; // 2 кирилл үсэг + 8 тоо (жишээ: АБ12345678)
  homeAddress: string; // Гэрийн хаяг
  phone: string; // Утасны дугаар
  emergencyPhone: string; // Яаралтай үед холбоо барих дугаар
  email: string; // Имэйл
  facebook: string; // Facebook хаяг

  // Family Members
  familyMembers: FamilyMember[];

  // Education
  education: Education[];

  // Languages
  languages: Language[];

  // Work Experience
  workExperience: WorkExperience[];

  // Additional Info
  otherSkills: string; // Үндсэн мэргэжлээсээ гадна...
  strengthsWeaknesses: string; // Таны давуу болон сул тал

  // Awards
  awards: Award[];

  // Driver's License
  hasDriverLicense: boolean; // Та жолооны эрхтэй юу?

  // Photo
  photoUrl: string; // Цээж зураг

  // How did you hear about us
  referralSource: string; // Оффисын талаар мэдээлэл хаанаас авсан бэ?
  referredAgentName?: string; // Санал болгосон агентын нэр (Найз танил сонгосон үед)

  // Signature
  signatureUrl: string; // Гарын үсэг

  // Meetings (3-level interviews)
  meeting1?: ApplicationMeeting; // Уулзалт 1
  meeting2?: ApplicationMeeting; // Уулзалт 2
  meeting3?: ApplicationMeeting; // Уулзалт 3

  // Fire UP training number
  trainingNumber?: string; // Сургалтын дугаар
  fireupDate?: string; // Fire UP огноо (хэзээ товлосон)
  trainingStartDate?: string; // Сургалт эхлэх хугацаа
  trainingEndDate?: string; // Сургалт дуусах хугацаа

  // Transfer flag
  isTransfer?: boolean; // Шилжиж орж ирсэн эсэх

  // Metadata
  status: 'new' | 'interviewing' | 'fireup' | 'iconnect' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Employee from iConnect applications
export interface Employee {
  id: string;
  applicationId: string;
  // Personal Information from Application
  iConnectName?: string; // iConnect нэр
  familyName: string;
  lastName: string;
  firstName: string;
  interestedOffice: string;
  birthPlace: string;
  ethnicity: string;
  gender: 'male' | 'female';
  birthDate: string;
  registerNumber: string;
  homeAddress: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  facebook: string;
  familyMembers: FamilyMember[];
  education: Education[];
  languages: Language[];
  workExperience: WorkExperience[];
  otherSkills: string;
  strengthsWeaknesses: string;
  awards: Award[];
  hasDriverLicense: boolean;
  photoUrl: string;
  referralSource: string;
  signatureUrl: string;
  // Training number from Fire UP
  trainingNumber?: string;
  // New Employee fields
  certificateNumber?: string; // Certificate дугаар
  citizenRegistrationNumber?: string; // Иргэний бүртгэлийн дугаар
  szhCertificateNumber?: string; // СЗХ-ы сертификатын дугаар
  certificateDate?: string; // Сертификат авсан огноо
  remaxEmail?: string; // Remax имэйл
  mls?: string; // МЛС
  bank?: string; // Банк
  accountNumber?: string; // Дансны дугаар
  district?: string; // Дүүрэг
  detailedAddress?: string; // Гэрийн хаяг (detailed)
  childrenCount?: number; // Хүүхдийн тоо
  // Employee specific
  employmentStartDate?: string; // Ажилд орсон огноо
  officeName?: string; // Ажилладаг оффис
  status: 'active' | 'new_0_6' | 'month_6_12' | 'experienced_1_3' | 'over_3_years' | 'inactive_transaction' | 'inactive' | 'active_no_transaction' | 'on_leave' | 'maternity_leave' | 'team_member' | 'top';
  // Additional tag fields
  hasIConnect?: boolean; // iConnect-тэй эсэх
  isAssistant?: boolean; // Туслах эсэх
  assistantOf?: string; // Хэний туслах
  hasSzhTraining?: boolean; // СЗХ сургалт суусан эсэх
  szhTrainingDate?: string; // Суусан огноо
  szhOfficialLetterNumber?: string; // СЗХ албан бичгийн дугаар
  hiredDate: string;
  createdAt: string;
  updatedAt: string;
}

// Resigned Agent - employees who have left
export interface ResignedAgent {
  id: string;
  employeeId: string; // Original employee ID
  applicationId: string;
  // All employee fields
  iConnectName?: string; // iConnect нэр
  familyName: string;
  lastName: string;
  firstName: string;
  interestedOffice: string;
  birthPlace: string;
  ethnicity: string;
  gender: 'male' | 'female';
  birthDate: string;
  registerNumber: string;
  homeAddress: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  facebook: string;
  familyMembers: FamilyMember[];
  education: Education[];
  languages: Language[];
  workExperience: WorkExperience[];
  otherSkills: string;
  strengthsWeaknesses: string;
  awards: Award[];
  hasDriverLicense: boolean;
  photoUrl: string;
  referralSource: string;
  signatureUrl: string;
  trainingNumber?: string;
  certificateNumber?: string;
  citizenRegistrationNumber?: string;
  szhCertificateNumber?: string;
  certificateDate?: string;
  remaxEmail?: string;
  mls?: string;
  bank?: string;
  accountNumber?: string;
  district?: string;
  detailedAddress?: string;
  childrenCount?: number;
  hiredDate: string;
  employmentStartDate?: string; // Ажилд орсон огноо
  officeName?: string; // Ажилладаг оффис
  // Resignation specific fields
  workedMonths: number; // Ажилласан хугацаа сараар (auto-calculated)
  resignedDate: string; // Гарсан он сар
  resignationReason: 'Шилжсэн' | 'Ажиллах чадваргүй' | 'Зайлшгүй шалтгаан' | 'Байгууллагын соёл таалагдаагүй' | 'Давхар ажилтай' | 'Оффисын зүгээс гэрээ цуцалсан' | 'Урт хугацааны чөлөө авсан'; // Гарсан шалтгаан
  resignationNotes?: string; // Нэмэлт тэмдэглэл
  createdAt: string;
  updatedAt: string;
}

// User/Auth Types
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Agent Rank Types
export type RankLevel = 'Стандарт' | 'Силвер' | 'Голд' | 'Платиниум' | 'Даймонд';

export interface AgentRankHistory {
  rank: RankLevel;
  startDate: string; // Гэрээ эхэлсэн огноо
  endDate: string; // Гэрээ дуусах огноо (+1 year)
  createdAt: string;
}

export interface AgentRank {
  id: string;
  agentId: string; // Primary key - same as MLS in employees
  agentName: string; // Агентын нэр
  contractNumber?: string; // Гэрээний дугаар
  currentRank: RankLevel; // Current Цол
  currentStartDate: string; // Current Гэрээ эхэлсэн огноо
  currentEndDate: string; // Current Гэрээ дуусах огноо
  rankHistory: AgentRankHistory[]; // All rank achievements history
  createdAt: string;
  updatedAt: string;
}
