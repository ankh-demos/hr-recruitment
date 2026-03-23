import { useState, useRef, useEffect } from 'react';
import { FamilyMember, Education, Language, WorkExperience, Award } from '../types';
import { applicationsApi } from '../services/api';

// Mongolian Cyrillic regex - allows spaces and Mongolian letters
const MONGOLIAN_CYRILLIC_REGEX = /^[а-яА-ЯөӨүҮёЁ\s]+$/;
// Register number: 2 uppercase Cyrillic letters + 8 digits
const REGISTER_NUMBER_REGEX = /^[А-ЯӨҮЁ]{2}\d{8}$/;
// Phone: exactly 8 digits
const PHONE_REGEX = /^\d{8}$/;

// Compress image to max width and JPEG quality
function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Helper: section card wrapper (defined outside component to prevent re-creation on render)
function SectionCard({ title, icon, children, id }: { title: string; icon: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// Helper: input field with validation state (defined outside component to prevent re-creation on render)
function FormField({ label, required, error, id, children }: { label: string; required?: boolean; error?: string; id?: string; children: React.ReactNode }) {
  return (
    <div id={id}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-red-500 text-xs flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none ${hasError
    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-500'
    : 'border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 hover:border-gray-300'
  }`;

const selectClass = (hasError: boolean) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none appearance-none bg-white ${hasError
    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-500'
    : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 hover:border-gray-300'
  }`;

const addButtonClass = "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors";
const removeButtonClass = "text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors";
const dynamicItemInputClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all hover:border-gray-300";

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
    registerNumber: '',
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

  // Handle file upload with compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({ ...prev, photoUrl: 'Зураг 5MB-аас бага байх ёстой' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const raw = reader.result as string;
        const compressed = await compressImage(raw, 800, 0.7);
        setFormData(prev => ({ ...prev, [field]: compressed }));
        setValidationErrors(prev => {
          const copy = { ...prev };
          delete copy.photoUrl;
          return copy;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form before submit
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validate Cyrillic fields
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

    // Validate gender selection
    if (!formData.gender) errors.gender = 'Хүйс сонгоно уу';

    // Validate birthDate
    if (!formData.birthDate) errors.birthDate = 'Төрсөн огноо оруулна уу';

    // Validate email (optional but if provided must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Зөв имэйл хаяг оруулна уу';
    }

    // Validate signature
    if (!formData.signatureUrl) errors.signatureUrl = 'Гарын үсэг зурна уу';

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Бүх талбарыг зөв бөглөнө үү.');
      // Scroll to first error field
      const firstErrorKey = Object.keys(errors)[0];
      setTimeout(() => {
        const el = document.getElementById('field-' + firstErrorKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Try to focus the input inside
          const input = el.querySelector('input, select, textarea') as HTMLElement;
          if (input) setTimeout(() => input.focus(), 400);
        }
      }, 100);
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

      await applicationsApi.create(applicationData);

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Анкет илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Анкет амжилттай илгээгдлээ!</h2>
          <p className="text-gray-500 leading-relaxed">Таны анкетыг хүлээн авлаа. Бид тантай удахгүй холбогдох болно.</p>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-400">RE/MAX Sky Mongolia</p>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Ажилд орох анкет</h1>
          <p className="text-blue-200 text-sm">RE/MAX Sky Mongolia</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4 pb-12">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ═══════ Personal Information ═══════ */}
          <SectionCard title="Хувийн мэдээлэл" icon="👤">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Ургийн овог" required error={validationErrors.familyName} id="field-familyName">
                <input
                  type="text"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  required
                  className={inputClass(!!validationErrors.familyName)}
                  placeholder="Зөвхөн кирилл үсгээр"
                />
              </FormField>

              <FormField label="Овог" required error={validationErrors.lastName} id="field-lastName">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className={inputClass(!!validationErrors.lastName)}
                  placeholder="Зөвхөн кирилл үсгээр"
                />
              </FormField>

              <FormField label="Нэр" required error={validationErrors.firstName} id="field-firstName">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className={inputClass(!!validationErrors.firstName)}
                  placeholder="Зөвхөн кирилл үсгээр"
                />
              </FormField>

              <FormField label="Ажилд орохоор сонирхож буй оффис" required error={validationErrors.interestedOffice} id="field-interestedOffice">
                <select
                  value={formData.interestedOffice}
                  onChange={(e) => setFormData({ ...formData, interestedOffice: e.target.value })}
                  required
                  className={selectClass(!!validationErrors.interestedOffice)}
                >
                  <option value="">Сонгох</option>
                  <option value="Гэгээнтэн">Гэгээнтэн</option>
                  <option value="Ривер">Ривер</option>
                  <option value="Даун таун">Даун таун</option>
                </select>
              </FormField>

              <FormField label="Ажилд орох боломжтой огноо" required>
                <input
                  type="date"
                  value={formData.availableDate}
                  onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
                  required
                  className={inputClass(false)}
                />
              </FormField>

              <FormField label="Төрсөн газар" required error={validationErrors.birthPlace} id="field-birthPlace">
                <input
                  type="text"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  required
                  className={inputClass(!!validationErrors.birthPlace)}
                  placeholder="Зөвхөн кирилл үсгээр"
                />
              </FormField>

              <FormField label="Үндэс угсаа" required error={validationErrors.ethnicity} id="field-ethnicity">
                <input
                  type="text"
                  value={formData.ethnicity}
                  onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                  required
                  className={inputClass(!!validationErrors.ethnicity)}
                  placeholder="Зөвхөн кирилл үсгээр"
                />
              </FormField>

              <FormField label="Хүйс">
                <div className="flex gap-6 mt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Эрэгтэй</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'female' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Эмэгтэй</span>
                  </label>
                </div>
              </FormField>

              <FormField label="Төрсөн огноо" required>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                  className={inputClass(false)}
                />
              </FormField>
            </div>

            {/* Registration Number */}
            <div className="mt-5" id="field-registerNumber">
              <FormField label="Регистрийн дугаар" required error={validationErrors.registerNumber}>
                <input
                  type="text"
                  value={formData.registerNumber}
                  onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                  placeholder="Жишээ: АБ12345678"
                  className={`max-w-xs ${inputClass(!!validationErrors.registerNumber)}`}
                />
                <p className="text-gray-400 text-xs mt-1">2 кирилл үсэг + 8 тоо</p>
              </FormField>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="md:col-span-2" id="field-homeAddress">
                <FormField label="Гэрийн хаяг" required error={validationErrors.homeAddress}>
                  <textarea
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    required
                    rows={2}
                    className={inputClass(!!validationErrors.homeAddress)}
                    placeholder="Дүүрэг, хороо, байр гэх мэт"
                  />
                </FormField>
              </div>

              <FormField label="Утасны дугаар" required error={validationErrors.phone} id="field-phone">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  required
                  maxLength={8}
                  placeholder="8 оронтой тоо"
                  className={inputClass(!!validationErrors.phone)}
                />
              </FormField>

              <FormField label="Яаралтай үед холбоо барих дугаар" required error={validationErrors.emergencyPhone} id="field-emergencyPhone">
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  required
                  maxLength={8}
                  placeholder="8 оронтой тоо"
                  className={inputClass(!!validationErrors.emergencyPhone)}
                />
              </FormField>

              <FormField label="Имэйл" required>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={inputClass(false)}
                  placeholder="example@email.com"
                />
              </FormField>

              <FormField label="Facebook хаяг" required>
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  required
                  className={inputClass(false)}
                  placeholder="Facebook нэр эсвэл холбоос"
                />
              </FormField>
            </div>
          </SectionCard>

          {/* ═══════ Family Members ═══════ */}
          <SectionCard title="Гэр бүлийн байдал" icon="👨‍👩‍👧‍👦">
            <div className="space-y-4">
              {familyMembers.map((member, index) => (
                <div key={index} className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Гишүүн #{index + 1}</span>
                    <button type="button" onClick={() => removeFamilyMember(index)} className={removeButtonClass}>✕ Устгах</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" value={member.relationship} onChange={(e) => updateFamilyMember(index, 'relationship', e.target.value)} placeholder="Таны хэн болох" className={dynamicItemInputClass} />
                    <input type="text" value={member.fullName} onChange={(e) => updateFamilyMember(index, 'fullName', e.target.value)} placeholder="Овог нэр" className={dynamicItemInputClass} />
                    <input type="text" value={member.birthPlace} onChange={(e) => updateFamilyMember(index, 'birthPlace', e.target.value)} placeholder="Төрсөн аймаг хот" className={dynamicItemInputClass} />
                    <input type="text" value={member.profession} onChange={(e) => updateFamilyMember(index, 'profession', e.target.value)} placeholder="Мэргэжил" className={dynamicItemInputClass} />
                    <input type="tel" value={member.phone} onChange={(e) => updateFamilyMember(index, 'phone', e.target.value)} placeholder="Утасны дугаар" className={dynamicItemInputClass} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFamilyMember} className={addButtonClass}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Нэмэх
              </button>
            </div>
          </SectionCard>

          {/* ═══════ Education ═══════ */}
          <SectionCard title="Эзэмшсэн мэргэжил, боловсрол" icon="🎓">
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Боловсрол #{index + 1}</span>
                    <button type="button" onClick={() => removeEducation(index)} className={removeButtonClass}>✕ Устгах</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} placeholder="Ямар сургууль" className={dynamicItemInputClass} />
                    <input type="text" value={edu.enrollmentDate} onChange={(e) => updateEducation(index, 'enrollmentDate', e.target.value)} placeholder="Элссэн он сар" className={dynamicItemInputClass} />
                    <input type="text" value={edu.graduationDate} onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)} placeholder="Төгссөн он сар" className={dynamicItemInputClass} />
                    <input type="text" value={edu.major} onChange={(e) => updateEducation(index, 'major', e.target.value)} placeholder="Мэргэжил" className={dynamicItemInputClass} />
                    <input type="text" value={edu.gpa} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} placeholder="Голч оноо" className={dynamicItemInputClass} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addEducation} className={addButtonClass}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Нэмэх
              </button>
            </div>
          </SectionCard>

          {/* ═══════ Languages ═══════ */}
          <SectionCard title="Гадаад хэлний мэдлэг" icon="🌐">
            <div className="space-y-4">
              {languages.map((lang, index) => (
                <div key={index} className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Гадаад хэл #{index + 1}</span>
                    <button type="button" onClick={() => removeLanguage(index)} className={removeButtonClass}>✕ Устгах</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" value={lang.language} onChange={(e) => updateLanguage(index, 'language', e.target.value)} placeholder="Гадаад хэл" className={dynamicItemInputClass} />
                    <select value={lang.level} onChange={(e) => updateLanguage(index, 'level', e.target.value)} className={dynamicItemInputClass}>
                      <option value="Сайн">Сайн</option>
                      <option value="Дунд">Дунд</option>
                      <option value="Анхан шат">Анхан шат</option>
                    </select>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addLanguage} className={addButtonClass}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Нэмэх
              </button>
            </div>
          </SectionCard>

          {/* ═══════ Work Experience ═══════ */}
          <SectionCard title="Ажлын туршлага" icon="💼">
            <div className="space-y-4">
              {workExperience.map((work, index) => (
                <div key={index} className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Ажлын туршлага #{index + 1}</span>
                    <button type="button" onClick={() => removeWorkExperience(index)} className={removeButtonClass}>✕ Устгах</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" value={work.companyName} onChange={(e) => updateWorkExperience(index, 'companyName', e.target.value)} placeholder="Байгууллагын нэр" className={dynamicItemInputClass} />
                    <input type="text" value={work.businessType} onChange={(e) => updateWorkExperience(index, 'businessType', e.target.value)} placeholder="Бизнесийн төрөл" className={dynamicItemInputClass} />
                    <input type="text" value={work.position} onChange={(e) => updateWorkExperience(index, 'position', e.target.value)} placeholder="Албан тушаал" className={dynamicItemInputClass} />
                    <input type="text" value={work.startDate} onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)} placeholder="Ажилд орсон" className={dynamicItemInputClass} />
                    <input type="text" value={work.endDate} onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)} placeholder="Ажлаас гарсан" className={dynamicItemInputClass} />
                    <input type="text" value={work.salary} onChange={(e) => updateWorkExperience(index, 'salary', e.target.value)} placeholder="Цалин" className={dynamicItemInputClass} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addWorkExperience} className={addButtonClass}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Нэмэх
              </button>
            </div>
          </SectionCard>

          {/* ═══════ Additional Information ═══════ */}
          <SectionCard title="Нэмэлт мэдээлэл" icon="📝">
            <div className="space-y-5">
              <FormField label="Үндсэн мэргэжлээсээ гадна ямар төрлийн ажил хийх сонирхолтой, чадвар туршлагатай вэ?" required error={validationErrors.otherSkills} id="field-otherSkills">
                <textarea
                  value={formData.otherSkills}
                  onChange={(e) => setFormData({ ...formData, otherSkills: e.target.value })}
                  required
                  rows={3}
                  className={inputClass(!!validationErrors.otherSkills)}
                  placeholder="Зөвхөн кирилл үсгээр"
                />
              </FormField>

              <FormField label="Таны давуу болон сул тал" required error={validationErrors.strengthsWeaknesses} id="field-strengthsWeaknesses">
                <textarea
                  value={formData.strengthsWeaknesses}
                  onChange={(e) => setFormData({ ...formData, strengthsWeaknesses: e.target.value })}
                  required
                  rows={3}
                  className={inputClass(!!validationErrors.strengthsWeaknesses)}
                  placeholder="Зөвхөн кирилл үсгээр"
                />
              </FormField>
            </div>
          </SectionCard>

          {/* ═══════ Awards ═══════ */}
          <SectionCard title="Таны гаргаж байсан амжилт болон гавьяа шагнал" icon="🏆">
            <div className="space-y-4">
              {awards.map((award, index) => (
                <div key={index} className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Шагнал #{index + 1}</span>
                    <button type="button" onClick={() => removeAward(index)} className={removeButtonClass}>✕ Устгах</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" value={award.organization} onChange={(e) => updateAward(index, 'organization', e.target.value)} placeholder="Байгууллага" className={dynamicItemInputClass} />
                    <input type="text" value={award.year} onChange={(e) => updateAward(index, 'year', e.target.value)} placeholder="Хэдэн онд" className={dynamicItemInputClass} />
                    <input type="text" value={award.awardName} onChange={(e) => updateAward(index, 'awardName', e.target.value)} placeholder="Шагналын нэр" className={dynamicItemInputClass} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addAward} className={addButtonClass}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Нэмэх
              </button>
            </div>
          </SectionCard>

          {/* ═══════ Driver's License ═══════ */}
          <SectionCard title="Жолооны эрх" icon="🚗">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Та жолооны эрхтэй юу?</label>
              <div className="flex gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    checked={formData.hasDriverLicense === true}
                    onChange={() => setFormData({ ...formData, hasDriverLicense: true })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Тийм</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    checked={formData.hasDriverLicense === false}
                    onChange={() => setFormData({ ...formData, hasDriverLicense: false })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Үгүй</span>
                </label>
              </div>
            </div>
          </SectionCard>

          {/* ═══════ Photo Upload ═══════ */}
          <SectionCard title="Цээж зураг" icon="📷" id="field-photoUrl">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${formData.photoUrl
                ? 'border-green-300 bg-green-50'
                : validationErrors.photoUrl
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
              onClick={() => photoInputRef.current?.click()}
            >
              {formData.photoUrl ? (
                <div className="space-y-3">
                  <img src={formData.photoUrl} alt="Photo" className="max-h-48 mx-auto rounded-xl shadow-sm" />
                  <p className="text-sm text-green-600 font-medium">✓ Зураг амжилттай оруулсан</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Зураг оруулах</p>
                  <p className="text-xs text-gray-400">Дарж зураг сонгоно уу (5MB хүртэл)</p>
                </div>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'photoUrl')}
                className="hidden"
              />
            </div>
            {validationErrors.photoUrl && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {validationErrors.photoUrl}
              </p>
            )}
          </SectionCard>

          {/* ═══════ Referral Source ═══════ */}
          <SectionCard title="Оффисын талаар мэдээлэл хаанаас авсан бэ?" icon="📢">
            <select
              value={formData.referralSource}
              onChange={(e) => setFormData({ ...formData, referralSource: e.target.value, referredAgentName: e.target.value === 'Найз танил' ? formData.referredAgentName : '' })}
              required
              className={selectClass(false)}
            >
              <option value="">Сонгох</option>
              <option value="Facebook хуудас">Facebook хуудас</option>
              <option value="Найз танил">Найз танил</option>
              <option value="Вебсайт">Вебсайт</option>
              <option value="Бусад">Бусад</option>
            </select>

            {formData.referralSource === 'Найз танил' && (
              <div className="mt-4">
                <FormField label="Санал болгосон агентын нэр">
                  <input
                    type="text"
                    value={formData.referredAgentName}
                    onChange={(e) => setFormData({ ...formData, referredAgentName: e.target.value })}
                    placeholder="Агентын нэрийг оруулна уу"
                    className={inputClass(false)}
                  />
                </FormField>
              </div>
            )}
          </SectionCard>

          {/* ═══════ Signature ═══════ */}
          <SectionCard title="Гарын үсэг" icon="✍️" id="field-signatureUrl">
            <div className="space-y-4">
              <div className={`border-2 rounded-2xl p-3 bg-white transition-colors ${validationErrors.signatureUrl ? 'border-red-400' : 'border-gray-200'}`}>
                <canvas
                  ref={signatureCanvasRef}
                  width={400}
                  height={150}
                  className="border border-gray-100 rounded-xl cursor-crosshair w-full max-w-md mx-auto block touch-none bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-5 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Арилгах
                </button>
              </div>
              {validationErrors.signatureUrl && (
                <p className="text-red-500 text-xs text-center flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {validationErrors.signatureUrl}
                </p>
              )}
              <p className="text-gray-400 text-xs text-center">Хулгана эсвэл хуруугаараа гарын үсэг зурна уу</p>
            </div>
          </SectionCard>

          {/* ═══════ Submit Button ═══════ */}
          <div className="pt-2 pb-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.99]"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Илгээж байна...
                </span>
              ) : 'Анкет илгээх'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
