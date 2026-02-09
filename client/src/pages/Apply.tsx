import { useState, useRef, useEffect } from 'react';
import { FamilyMember, Education, Language, WorkExperience, Award } from '../types';

const API_BASE = '/api';

// Mongolian Cyrillic regex - allows spaces and Mongolian letters
const MONGOLIAN_CYRILLIC_REGEX = /^[а-яА-ЯөӨүҮёЁ\s]+$/;
// Register number: 2 uppercase Cyrillic letters + 8 digits
const REGISTER_NUMBER_REGEX = /^[А-ЯӨҮЁ]{2}\d{8}$/;
// Phone: exactly 8 digits
const PHONE_REGEX = /^\d{8}$/;

export function Apply() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [formData, setFormData] = useState({
    familyName: '',
    lastName: '',
    firstName: '',
    interestedOffice: '',
    availableDate: '',
    birthPlace: '',
    ethnicity: '',
    gender: '' as 'male' | 'female' | '',
    birthDate: '',
    registerNumber: '', // Changed: now single field for 2 letters + 8 digits
    homeAddress: '',
    phone: '',
    emergencyPhone: '',
    email: '',
    facebook: '',
    otherSkills: '',
    strengthsWeaknesses: '',
    hasDriverLicense: false,
    photoUrl: '',
    referralSource: '',
    referredAgentName: '',
    signatureUrl: ''
  });

  // Validation function for Mongolian Cyrillic fields
  const validateCyrillicField = (value: string, fieldName: string): string => {
    if (!value.trim()) return `${fieldName} оруулна уу`;
    if (!MONGOLIAN_CYRILLIC_REGEX.test(value)) return `${fieldName} зөвхөн Монгол кирилл үсэг оруулна уу`;
    return '';
  };

  // Validate register number format
  const validateRegisterNumber = (value: string): string => {
    if (!value) return 'Регистрийн дугаар оруулна уу';
    if (!REGISTER_NUMBER_REGEX.test(value.toUpperCase())) return 'Регистрийн дугаар: 2 том кирилл үсэг + 8 тоо (жишээ: АБ12345678)';
    return '';
  };

  // Validate phone number (8 digits)
  const validatePhone = (value: string): string => {
    if (!value) return 'Утасны дугаар оруулна уу';
    if (!PHONE_REGEX.test(value)) return 'Утасны дугаар: 8 оронтой тоо оруулна уу';
    return '';
  };

  // Initialize signature canvas
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Save signature to formData
    const canvas = signatureCanvasRef.current;
    if (canvas && hasSignature) {
      setFormData(prev => ({ ...prev, signatureUrl: canvas.toDataURL('image/png') }));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasSignature(false);
    setFormData(prev => ({ ...prev, signatureUrl: '' }));
  };

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);

  // Add new family member
  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, {
      relationship: '',
      fullName: '',
      birthPlace: '',
      profession: '',
      phone: ''
    }]);
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Add new education
  const addEducation = () => {
    setEducation([...education, {
      school: '',
      enrollmentDate: '',
      graduationDate: '',
      major: '',
      gpa: ''
    }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Add new language
  const addLanguage = () => {
    setLanguages([...languages, { language: '', level: 'Сайн' }]);
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    setLanguages(updated);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Add new work experience
  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      companyName: '',
      businessType: '',
      position: '',
      startDate: '',
      endDate: '',
      salary: ''
    }]);
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  // Add new award
  const addAward = () => {
    setAwards([...awards, { organization: '', year: '', awardName: '' }]);
  };

  const updateAward = (index: number, field: keyof Award, value: string) => {
    const updated = [...awards];
    updated[index] = { ...updated[index], [field]: value };
    setAwards(updated);
  };

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  // Handle file upload and convert to base64 (only for photo now)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form before submit
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate Cyrillic fields (homeAddress removed - allows all characters)
    const cyrillicFields = [
      { field: 'familyName', name: 'Ургийн овог' },
      { field: 'lastName', name: 'Овог' },
      { field: 'firstName', name: 'Нэр' },
      { field: 'birthPlace', name: 'Төрсөн газар' },
      { field: 'ethnicity', name: 'Үндэс угсаа' }
    ];
    
    // Validate homeAddress - required but allows all characters
    if (!formData.homeAddress.trim()) {
      errors.homeAddress = 'Гэрийн хаяг оруулна уу';
    }
    
    // Validate optional Cyrillic fields only if they have a value
    const optionalCyrillicFields = [
      { field: 'otherSkills', name: 'Бусад ур чадвар' },
      { field: 'strengthsWeaknesses', name: 'Давуу болон сул тал' }
    ];
    
    for (const { field, name } of cyrillicFields) {
      const err = validateCyrillicField(formData[field as keyof typeof formData] as string, name);
      if (err) errors[field] = err;
    }
    
    // Validate optional Cyrillic fields only if they have a value
    for (const { field, name } of optionalCyrillicFields) {
      const value = formData[field as keyof typeof formData] as string;
      if (value && value.trim() && !MONGOLIAN_CYRILLIC_REGEX.test(value)) {
        errors[field] = `${name} зөвхөн Монгол кирилл үсэг оруулна уу`;
      }
    }
    
    // Validate register number
    const regErr = validateRegisterNumber(formData.registerNumber);
    if (regErr) errors.registerNumber = regErr;
    
    // Validate phone numbers
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) errors.phone = phoneErr;
    
    const emergencyPhoneErr = validatePhone(formData.emergencyPhone);
    if (emergencyPhoneErr) errors.emergencyPhone = emergencyPhoneErr;
    
    // Validate office selection
    if (!formData.interestedOffice) errors.interestedOffice = 'Оффис сонгоно уу';
    
    // Validate signature
    if (!formData.signatureUrl) errors.signatureUrl = 'Гарын үсэг зурна уу';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Бүх талбарыг зөв бөглөнө үү.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const applicationData = {
        ...formData,
        gender: formData.gender as 'male' | 'female',
        familyMembers,
        education,
        languages,
        workExperience,
        awards
      };

      const response = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Анкет илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Анкет амжилттай илгээгдлээ!</h2>
          <p className="text-gray-600">Таны анкетыг хүлээн авлаа. Бид тантай удахгүй холбогдох болно.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Ажилд орох анкет</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Хувийн мэдээлэл</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ургийн овог <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    required
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.familyName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.familyName && <p className="text-red-500 text-xs mt-1">{validationErrors.familyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Овог <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.lastName && <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Нэр <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.firstName && <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ажилд орохоор сонирхож буй оффис <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.interestedOffice}
                    onChange={(e) => setFormData({ ...formData, interestedOffice: e.target.value })}
                    required
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.interestedOffice ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Сонгох</option>
                    <option value="Гэгээнтэн">Гэгээнтэн</option>
                    <option value="Ривер">Ривер</option>
                    <option value="Даун таун">Даун таун</option>
                  </select>
                  {validationErrors.interestedOffice && <p className="text-red-500 text-xs mt-1">{validationErrors.interestedOffice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ажилд орох боломжтой огноо <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.availableDate}
                    onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Төрсөн газар <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    required
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.birthPlace ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.birthPlace && <p className="text-red-500 text-xs mt-1">{validationErrors.birthPlace}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Үндэс угсаа <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                    required
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.ethnicity ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.ethnicity && <p className="text-red-500 text-xs mt-1">{validationErrors.ethnicity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Хүйс</label>
                  <div className="mt-2 flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' })}
                        className="form-radio"
                      />
                      <span className="ml-2">Эрэгтэй</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'female' })}
                        className="form-radio"
                      />
                      <span className="ml-2">Эмэгтэй</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Төрсөн огноо <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              {/* Registration Number */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Регистрийн дугаар <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.registerNumber}
                  onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                  placeholder="Жишээ: АБ12345678"
                  className={`w-full max-w-xs border rounded-md shadow-sm p-2 ${validationErrors.registerNumber ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.registerNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.registerNumber}</p>}
                <p className="text-gray-500 text-xs mt-1">2 кирилл үсэг + 8 тоо</p>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Гэрийн хаяг <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    required
                    rows={2}
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.homeAddress ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.homeAddress && <p className="text-red-500 text-xs mt-1">{validationErrors.homeAddress}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Утасны дугаар <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    required
                    maxLength={8}
                    placeholder="8 оронтой тоо"
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Яаралтай үед холбоо барих дугаар <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    required
                    maxLength={8}
                    placeholder="8 оронтой тоо"
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.emergencyPhone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {validationErrors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{validationErrors.emergencyPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Имэйл <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Facebook хаяг <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
            </section>

            {/* Family Members */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Гэр бүлийн байдал</h2>
              {familyMembers.map((member, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Гэр бүлийн гишүүн #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFamilyMember(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Устгах
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={member.relationship}
                      onChange={(e) => updateFamilyMember(index, 'relationship', e.target.value)}
                      placeholder="Таны хэн болох"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={member.fullName}
                      onChange={(e) => updateFamilyMember(index, 'fullName', e.target.value)}
                      placeholder="Овог нэр"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={member.birthPlace}
                      onChange={(e) => updateFamilyMember(index, 'birthPlace', e.target.value)}
                      placeholder="Төрсөн аймаг хот"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={member.profession}
                      onChange={(e) => updateFamilyMember(index, 'profession', e.target.value)}
                      placeholder="Мэргэжил"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => updateFamilyMember(index, 'phone', e.target.value)}
                      placeholder="Утасны дугаар"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addFamilyMember}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                + Нэмэх
              </button>
            </section>

            {/* Education */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Эзэмшсэн мэргэжил, боловсрол</h2>
              {education.map((edu, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Боловсрол #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Устгах
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(index, 'school', e.target.value)}
                      placeholder="Ямар сургууль"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={edu.enrollmentDate}
                      onChange={(e) => updateEducation(index, 'enrollmentDate', e.target.value)}
                      placeholder="Элссэн он сар"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={edu.graduationDate}
                      onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                      placeholder="Төгссөн он сар"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={edu.major}
                      onChange={(e) => updateEducation(index, 'major', e.target.value)}
                      placeholder="Мэргэжил"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={edu.gpa}
                      onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                      placeholder="Голч оноо"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addEducation}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                + Нэмэх
              </button>
            </section>

            {/* Languages */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Гадаад хэлний мэдлэг</h2>
              {languages.map((lang, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Гадаад хэл #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Устгах
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                      placeholder="Гадаад хэл"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <select
                      value={lang.level}
                      onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    >
                      <option value="Сайн">Сайн</option>
                      <option value="Дунд">Дунд</option>
                      <option value="Анхан шат">Анхан шат</option>
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addLanguage}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                + Нэмэх
              </button>
            </section>

            {/* Work Experience */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Ажлын туршлага</h2>
              {workExperience.map((work, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Ажлын туршлага #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeWorkExperience(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Устгах
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={work.companyName}
                      onChange={(e) => updateWorkExperience(index, 'companyName', e.target.value)}
                      placeholder="Байгууллагын нэр"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={work.businessType}
                      onChange={(e) => updateWorkExperience(index, 'businessType', e.target.value)}
                      placeholder="Бизнесийн төрөл"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={work.position}
                      onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                      placeholder="Албан тушаал"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={work.startDate}
                      onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                      placeholder="Ажилд орсон"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={work.endDate}
                      onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                      placeholder="Ажлаас гарсан"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={work.salary}
                      onChange={(e) => updateWorkExperience(index, 'salary', e.target.value)}
                      placeholder="Цалин"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addWorkExperience}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                + Нэмэх
              </button>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Нэмэлт мэдээлэл</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Үндсэн мэргэжлээсээ гадна ямар төрлийн ажил хийх сонирхолтой, чадвар туршлагатай вэ? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.otherSkills}
                    onChange={(e) => setFormData({ ...formData, otherSkills: e.target.value })}
                    required
                    rows={3}
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.otherSkills ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.otherSkills && <p className="text-red-500 text-xs mt-1">{validationErrors.otherSkills}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Таны давуу болон сул тал <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.strengthsWeaknesses}
                    onChange={(e) => setFormData({ ...formData, strengthsWeaknesses: e.target.value })}
                    required
                    rows={3}
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${validationErrors.strengthsWeaknesses ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Зөвхөн кирилл үсгээр"
                  />
                  {validationErrors.strengthsWeaknesses && <p className="text-red-500 text-xs mt-1">{validationErrors.strengthsWeaknesses}</p>}
                </div>
              </div>
            </section>

            {/* Awards */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Таны гаргаж байсан амжилт болон гавьяа шагнал</h2>
              {awards.map((award, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">Шагнал #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAward(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Устгах
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={award.organization}
                      onChange={(e) => updateAward(index, 'organization', e.target.value)}
                      placeholder="Байгууллага"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={award.year}
                      onChange={(e) => updateAward(index, 'year', e.target.value)}
                      placeholder="Хэдэн онд"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={award.awardName}
                      onChange={(e) => updateAward(index, 'awardName', e.target.value)}
                      placeholder="Шагналын нэр"
                      className="border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addAward}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                + Нэмэх
              </button>
            </section>

            {/* Driver's License */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Жолооны эрх</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Та жолооны эрхтэй юу?</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={formData.hasDriverLicense === true}
                      onChange={() => setFormData({ ...formData, hasDriverLicense: true })}
                      className="form-radio"
                    />
                    <span className="ml-2">Тийм</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={formData.hasDriverLicense === false}
                      onChange={() => setFormData({ ...formData, hasDriverLicense: false })}
                      className="form-radio"
                    />
                    <span className="ml-2">Үгүй</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Photo Upload */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Цээж зураг <span className="text-red-500">*</span></h2>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500"
                onClick={() => photoInputRef.current?.click()}
              >
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Photo" className="max-h-40 mx-auto" />
                ) : (
                  <div>
                    <p className="text-gray-500">Upload</p>
                    <p className="text-gray-400 text-sm">or drag files here.</p>
                  </div>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'photoUrl')}
                  className="hidden"
                  required={!formData.photoUrl}
                />
              </div>
            </section>

            {/* Referral Source */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Оффисын талаар мэдээлэл хаанаас авсан бэ? <span className="text-red-500">*</span>
              </h2>
              <select
                value={formData.referralSource}
                onChange={(e) => setFormData({ ...formData, referralSource: e.target.value, referredAgentName: e.target.value === 'Найз танил' ? formData.referredAgentName : '' })}
                required
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">Сонгох</option>
                <option value="Facebook хуудас">Facebook хуудас</option>
                <option value="Найз танил">Найз танил</option>
                <option value="Вебсайт">Вебсайт</option>
                <option value="Бусад">Бусад</option>
              </select>
              
              {/* Conditional field for agent name when Найз танил is selected */}
              {formData.referralSource === 'Найз танил' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Санал болгосон агентын нэр
                  </label>
                  <input
                    type="text"
                    value={formData.referredAgentName}
                    onChange={(e) => setFormData({ ...formData, referredAgentName: e.target.value })}
                    placeholder="Агентын нэрийг оруулна уу"
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              )}
            </section>

            {/* Signature - Drawing Pad */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Гарын үсэг <span className="text-red-500">*</span></h2>
              <div className="space-y-3">
                <div 
                  className={`border-2 rounded-lg p-2 bg-white ${validationErrors.signatureUrl ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <canvas
                    ref={signatureCanvasRef}
                    width={400}
                    height={150}
                    className="border border-gray-200 rounded cursor-crosshair w-full max-w-md mx-auto block touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Арилгах
                  </button>
                </div>
                {validationErrors.signatureUrl && <p className="text-red-500 text-xs text-center">{validationErrors.signatureUrl}</p>}
                <p className="text-gray-500 text-xs text-center">Хулгана эсвэл хуруугаараа гарын үсэг зурна уу</p>
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Илгээж байна...' : 'Анкет илгээх'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
