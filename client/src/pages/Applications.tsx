import { useEffect, useState, useMemo } from 'react';
import { Application, ApplicationMeeting, User } from '../types';
import { usersApi, applicationsApi } from '../services/api';
import { Pagination } from '../components/Pagination';

const API_BASE = '/api';

// Application status options
const APPLICATION_STATUSES = [
  { value: 'new', label: 'Шинэ анкет', color: 'bg-blue-100 text-blue-800' },
  { value: 'interviewing', label: 'Ярилцлага хийж байгаа', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'fireup', label: 'Fire UP товлосон', color: 'bg-purple-100 text-purple-800' },
  { value: 'iconnect', label: 'iConnect нээлгэсэн', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Ажиллахаа больсон', color: 'bg-red-100 text-red-800' }
];

// Office options
const OFFICES = ['Бүгд', 'Гэгээнтэн', 'Ривер', 'Даун таун'];

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  
  // Status Filter State (multi-select)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>('Бүгд');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Statistics state
  const [statistics, setStatistics] = useState<any>({});
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Meeting Modal State
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [currentMeetingLevel, setCurrentMeetingLevel] = useState<1 | 2 | 3>(1);
  const [meetingForm, setMeetingForm] = useState<ApplicationMeeting>({
    date: '',
    interviewerId: '',
    interviewerName: '',
    notes: ''
  });
  
  // Fire UP Modal State
  const [fireUpModalOpen, setFireUpModalOpen] = useState(false);
  const [trainingNumber, setTrainingNumber] = useState('');
  
  // iConnect Confirmation State
  const [iconnectConfirmOpen, setIconnectConfirmOpen] = useState(false);
  
  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Application>>({});

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<Omit<Application, 'id' | 'status' | 'createdAt' | 'updatedAt'>[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
    loadUsers();
  }, []);

  // Filtered applications based on selected statuses, office, and search
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Office filter
      if (selectedOffice !== 'Бүгд' && app.interestedOffice !== selectedOffice) {
        return false;
      }
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(app.status)) {
        return false;
      }
      // Search filter
      if (searchTerm !== '') {
        const searchLower = searchTerm.toLowerCase();
        const matchFields = [
          app.familyName,
          app.firstName,
          app.lastName,
          app.email,
          app.phone,
          app.interestedOffice,
          app.registerNumber,
          app.trainingNumber
        ];
        const matches = matchFields.some(field => 
          field && field.toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [applications, selectedStatuses, selectedOffice, searchTerm]);

  // Paginated applications for table view
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatuses, searchTerm]);

  // Reload statistics when month changes
  useEffect(() => {
    if (showStatistics) {
      loadStatistics(selectedMonth || undefined);
    }
  }, [selectedMonth]);

  function toggleStatusFilter(status: string) {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }

  async function loadUsers() {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  async function loadApplications() {
    try {
      const response = await fetch(`${API_BASE}/applications`);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStatistics(month?: string) {
    try {
      const stats = await applicationsApi.getStatistics(month);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }

  async function updateStatus(id: string, status: Application['status']) {
    try {
      await fetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadApplications();
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  }

  // Open Fire UP modal
  function openFireUpModal() {
    if (!selectedApplication) return;
    setTrainingNumber(selectedApplication.trainingNumber || '');
    setFireUpModalOpen(true);
  }

  // Save Fire UP with training number
  async function saveFireUp() {
    if (!selectedApplication) return;
    try {
      await fetch(`${API_BASE}/applications/${selectedApplication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fireup', trainingNumber })
      });
      setFireUpModalOpen(false);
      setTrainingNumber('');
      loadApplications();
      // Update selected application
      setSelectedApplication({ ...selectedApplication, status: 'fireup', trainingNumber });
    } catch (error) {
      console.error('Failed to update to Fire UP:', error);
    }
  }

  // Open iConnect confirmation
  function openIconnectConfirm() {
    if (!selectedApplication) return;
    setIconnectConfirmOpen(true);
  }

  // Confirm iConnect and move to employees
  async function confirmIconnect() {
    if (!selectedApplication) return;
    try {
      await fetch(`${API_BASE}/applications/${selectedApplication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'iconnect' })
      });
      setIconnectConfirmOpen(false);
      setSelectedApplication(null);
      loadApplications();
    } catch (error) {
      console.error('Failed to move to iConnect:', error);
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm('Энэ анкетыг устгах уу?')) return;
    try {
      await fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' });
      loadApplications();
      if (selectedApplication?.id === id) {
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
    }
  }

  // Enter edit mode
  function enterEditMode() {
    if (!selectedApplication) return;
    setEditForm({
      familyName: selectedApplication.familyName,
      lastName: selectedApplication.lastName,
      firstName: selectedApplication.firstName,
      interestedOffice: selectedApplication.interestedOffice,
      availableDate: selectedApplication.availableDate,
      birthPlace: selectedApplication.birthPlace,
      ethnicity: selectedApplication.ethnicity,
      gender: selectedApplication.gender,
      birthDate: selectedApplication.birthDate,
      registerNumber: selectedApplication.registerNumber,
      homeAddress: selectedApplication.homeAddress,
      phone: selectedApplication.phone,
      emergencyPhone: selectedApplication.emergencyPhone,
      email: selectedApplication.email,
      facebook: selectedApplication.facebook,
      hasDriverLicense: selectedApplication.hasDriverLicense,
      otherSkills: selectedApplication.otherSkills,
      strengthsWeaknesses: selectedApplication.strengthsWeaknesses,
      referralSource: selectedApplication.referralSource,
      trainingNumber: selectedApplication.trainingNumber,
      isTransfer: selectedApplication.isTransfer
    });
    setIsEditMode(true);
  }

  // Cancel edit mode
  function cancelEditMode() {
    setIsEditMode(false);
    setEditForm({});
  }

  // Save edited application
  async function saveApplication() {
    if (!selectedApplication) return;
    try {
      await fetch(`${API_BASE}/applications/${selectedApplication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      await loadApplications();
      // Update selected application with new data
      setSelectedApplication({ ...selectedApplication, ...editForm } as Application);
      setIsEditMode(false);
      setEditForm({});
    } catch (error) {
      console.error('Failed to save application:', error);
    }
  }

  function openMeetingModal(level: 1 | 2 | 3) {
    if (!selectedApplication) return;
    
    const existingMeeting = level === 1 ? selectedApplication.meeting1 :
                            level === 2 ? selectedApplication.meeting2 :
                            selectedApplication.meeting3;
    
    setCurrentMeetingLevel(level);
    setMeetingForm(existingMeeting || {
      date: '',
      interviewerId: '',
      interviewerName: '',
      notes: ''
    });
    setMeetingModalOpen(true);
  }

  async function saveMeeting() {
    if (!selectedApplication) return;
    
    const selectedUser = users.find(u => u.id === meetingForm.interviewerId);
    const meetingData: ApplicationMeeting = {
      ...meetingForm,
      interviewerName: selectedUser?.fullName || ''
    };
    
    const updateData: Partial<Application> = {};
    if (currentMeetingLevel === 1) updateData.meeting1 = meetingData;
    else if (currentMeetingLevel === 2) updateData.meeting2 = meetingData;
    else updateData.meeting3 = meetingData;
    
    try {
      await applicationsApi.update(selectedApplication.id, updateData);
      await loadApplications();
      // Update selected application with new data
      const updatedApp = applications.find(a => a.id === selectedApplication.id);
      if (updatedApp) {
        setSelectedApplication({ ...updatedApp, ...updateData });
      }
      setMeetingModalOpen(false);
    } catch (error) {
      console.error('Failed to save meeting:', error);
    }
  }

  function getMeetingStatus(meeting?: ApplicationMeeting): 'empty' | 'filled' {
    return meeting?.date ? 'filled' : 'empty';
  }

  function getStatusLabel(status: string) {
    return APPLICATION_STATUSES.find(s => s.value === status)?.label || status;
  }

  // Print application
  function printApplication() {
    if (!selectedApplication) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const app = selectedApplication;
    const statusLabel = getStatusLabel(app.status);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Анкет - ${app.firstName} ${app.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1f2937; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-item { padding: 5px 0; }
          .label { color: #6b7280; font-size: 12px; }
          .value { color: #1f2937; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f9fafb; }
          .status { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
          .photo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
          .header { display: flex; align-items: center; gap: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${app.photoUrl ? `<img src="${app.photoUrl}" class="photo" />` : ''}
          <div>
            <h1>${app.familyName || ''} ${app.firstName} ${app.lastName}</h1>
            <p style="color: #6b7280;">${app.email} | ${app.phone}</p>
            <span class="status" style="background: #e0e7ff; color: #3730a3;">${statusLabel}</span>
            ${app.isTransfer ? '<span class="status" style="background: #d1fae5; color: #065f46; margin-left: 5px;">Шилжиж ирсэн</span>' : ''}
          </div>
        </div>
        
        <h2>Хувийн мэдээлэл</h2>
        <div class="info-grid">
          <div class="info-item"><span class="label">Оффис:</span> <span class="value">${app.interestedOffice || '-'}</span></div>
          <div class="info-item"><span class="label">Ажилд орох огноо:</span> <span class="value">${app.availableDate || '-'}</span></div>
          <div class="info-item"><span class="label">Төрсөн газар:</span> <span class="value">${app.birthPlace || '-'}</span></div>
          <div class="info-item"><span class="label">Төрсөн огноо:</span> <span class="value">${app.birthDate || '-'}</span></div>
          <div class="info-item"><span class="label">Хүйс:</span> <span class="value">${app.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}</span></div>
          <div class="info-item"><span class="label">Регистр:</span> <span class="value">${app.registerNumber || '-'}</span></div>
          <div class="info-item"><span class="label">Гэрийн хаяг:</span> <span class="value">${app.homeAddress || '-'}</span></div>
          <div class="info-item"><span class="label">Яаралтай холбоо:</span> <span class="value">${app.emergencyPhone || '-'}</span></div>
          <div class="info-item"><span class="label">Facebook:</span> <span class="value">${app.facebook || '-'}</span></div>
          <div class="info-item"><span class="label">Жолооны эрх:</span> <span class="value">${app.hasDriverLicense ? 'Тийм' : 'Үгүй'}</span></div>
        </div>
        
        ${app.familyMembers && app.familyMembers.length > 0 ? `
          <h2>Гэр бүлийн байдал</h2>
          <table>
            <tr><th>Хэн болох</th><th>Овог нэр</th><th>Төрсөн газар</th><th>Мэргэжил</th><th>Утас</th></tr>
            ${app.familyMembers.map(m => `<tr><td>${m.relationship}</td><td>${m.fullName}</td><td>${m.birthPlace}</td><td>${m.profession}</td><td>${m.phone}</td></tr>`).join('')}
          </table>
        ` : ''}
        
        ${app.education && app.education.length > 0 ? `
          <h2>Боловсрол</h2>
          <table>
            <tr><th>Сургууль</th><th>Элссэн</th><th>Төгссөн</th><th>Мэргэжил</th><th>Голч</th></tr>
            ${app.education.map(e => `<tr><td>${e.school}</td><td>${e.enrollmentDate}</td><td>${e.graduationDate}</td><td>${e.major}</td><td>${e.gpa}</td></tr>`).join('')}
          </table>
        ` : ''}
        
        ${app.workExperience && app.workExperience.length > 0 ? `
          <h2>Ажлын туршлага</h2>
          <table>
            <tr><th>Байгууллага</th><th>Төрөл</th><th>Албан тушаал</th><th>Орсон</th><th>Гарсан</th></tr>
            ${app.workExperience.map(w => `<tr><td>${w.companyName}</td><td>${w.businessType}</td><td>${w.position}</td><td>${w.startDate}</td><td>${w.endDate}</td></tr>`).join('')}
          </table>
        ` : ''}
        
        ${app.otherSkills || app.strengthsWeaknesses ? `
          <h2>Нэмэлт мэдээлэл</h2>
          ${app.otherSkills ? `<p><strong>Бусад чадвар:</strong> ${app.otherSkills}</p>` : ''}
          ${app.strengthsWeaknesses ? `<p><strong>Давуу/сул тал:</strong> ${app.strengthsWeaknesses}</p>` : ''}
        ` : ''}
        
        <div style="margin-top: 30px; font-size: 12px; color: #6b7280;">
          <p>Мэдээлэл авсан эх сурвалж: ${app.referralSource || '-'}</p>
          <p>Бүртгэсэн огноо: ${new Date(app.createdAt).toLocaleString('mn-MN')}</p>
        </div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Export to CSV
  function exportToCSV() {
    const headers = [
      'Овог', 'Нэр', 'Ургийн овог', 'Сонирхож буй оффис', 'Имэйл', 'Утас', 'Яаралтай утас',
      'Регистрийн дугаар', 'Төрсөн огноо', 'Хүйс', 'Төрсөн газар', 'Үндэс угсаа',
      'Гэрийн хаяг', 'Facebook', 'Жолооны эрх', 'Бусад ур чадвар', 'Давуу/сул тал',
      'Мэдээллийн эх сурвалж', 'Уулзалт 1 огноо', 'Уулзалт 1 хийсэн', 'Уулзалт 2 огноо', 'Уулзалт 2 хийсэн',
      'Уулзалт 3 огноо', 'Уулзалт 3 хийсэн', 'Сургалтын дугаар', 'Төлөв', 'Бүртгэсэн огноо'
    ];
    
    const rows = filteredApplications.map(app => [
      app.lastName || '',
      app.firstName || '',
      app.familyName || '',
      app.interestedOffice || '',
      app.email || '',
      app.phone || '',
      app.emergencyPhone || '',
      app.registerNumber || '',
      app.birthDate || '',
      app.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй',
      app.birthPlace || '',
      app.ethnicity || '',
      app.homeAddress || '',
      app.facebook || '',
      app.hasDriverLicense ? 'Тийм' : 'Үгүй',
      app.otherSkills || '',
      app.strengthsWeaknesses || '',
      app.referralSource || '',
      app.meeting1?.date || '',
      app.meeting1?.interviewerName || '',
      app.meeting2?.date || '',
      app.meeting2?.interviewerName || '',
      app.meeting3?.date || '',
      app.meeting3?.interviewerName || '',
      app.trainingNumber || '',
      getStatusLabel(app.status),
      app.createdAt ? new Date(app.createdAt).toLocaleDateString('mn-MN') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // CSV Template columns for bulk import
  const CSV_TEMPLATE_HEADERS = [
    'familyName', 'lastName', 'firstName', 'interestedOffice', 'email', 'phone', 'emergencyPhone',
    'registerNumber', 'birthDate', 'gender', 'birthPlace', 'ethnicity',
    'homeAddress', 'facebook', 'hasDriverLicense', 'otherSkills', 'strengthsWeaknesses', 'referralSource'
  ];

  // Download CSV template
  function downloadCSVTemplate() {
    const headerRow = CSV_TEMPLATE_HEADERS.join(',');
    const exampleRow = [
      'Ургийн овог', 'Овог', 'Нэр', 'Оффис', 'email@example.com', '99001122', '99003344',
      'АА00112233', '1990-01-15', 'male', 'Улаанбаатар', 'Халх',
      'Хаяг', 'facebook_id', 'true', 'Бусад ур чадвар', 'Давуу тал, сул тал', 'Лавлах эх сурвалж'
    ].join(',');
    
    const csvContent = headerRow + '\n' + exampleRow;
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'applications_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Parse CSV file
  function parseCSV(text: string): Omit<Application, 'id' | 'status' | 'createdAt' | 'updatedAt'>[] {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const applications: Omit<Application, 'id' | 'status' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const application: Omit<Application, 'id' | 'status' | 'createdAt' | 'updatedAt'> = {
        // Required fields with defaults
        familyName: '',
        lastName: '',
        firstName: '',
        interestedOffice: '',
        availableDate: '',
        birthPlace: '',
        ethnicity: '',
        gender: 'male' as 'male' | 'female',
        birthDate: '',
        registerNumber: '',
        homeAddress: '',
        phone: '',
        emergencyPhone: '',
        email: '',
        facebook: '',
        familyMembers: [],
        education: [],
        languages: [],
        workExperience: [],
        awards: [],
        otherSkills: '',
        strengthsWeaknesses: '',
        hasDriverLicense: false,
        photoUrl: '',
        referralSource: '',
        signatureUrl: ''
      };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header === 'hasDriverLicense') {
          application.hasDriverLicense = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'тийм';
        } else if (header === 'gender') {
          application.gender = value.toLowerCase() === 'female' || value.toLowerCase() === 'эмэгтэй' ? 'female' : 'male';
        } else if (header in application && typeof application[header as keyof typeof application] === 'string') {
          (application as any)[header] = value;
        }
      });
      
      applications.push(application);
    }
    
    return applications;
  }

  // Handle file upload
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setImportError('CSV файл хоосон эсвэл буруу форматтай байна');
          return;
        }
        setImportData(parsed);
        setImportModalOpen(true);
      } catch (error) {
        setImportError('CSV файлыг унших чадсангүй');
      }
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input
    event.target.value = '';
  }

  // Confirm import
  async function confirmImport() {
    setImportLoading(true);
    setImportError(null);
    try {
      await applicationsApi.bulkCreate(importData);
      setImportModalOpen(false);
      setImportData([]);
      loadApplications();
    } catch (error) {
      setImportError('Анкетуудыг импортлоход алдаа гарлаа');
    } finally {
      setImportLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Анкетууд ({applications.length})</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowStatistics(!showStatistics);
              if (!showStatistics) loadStatistics(selectedMonth || undefined);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showStatistics ? 'Статистик нуух' : 'Статистик харуулах'}
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button
            onClick={downloadCSVTemplate}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV загвар
          </button>
          <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            CSV оруулах
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <a
            href="/apply"
            target="_blank"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Анкет илгээх холбоос
          </a>
        </div>
      </div>

      {showStatistics && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Сарын статистик</h2>
            <div className="min-w-[150px]">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Энэ сар</option>
                {(() => {
                  const options = [];
                  const now = new Date();
                  for (let i = 0; i < 24; i++) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    options.push(<option key={value} value={value}>{label}</option>);
                  }
                  return options;
                })()}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Үзүүлэлт</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гэгээнтэн</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ривер</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Даун таун</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Тухайн сард нийт уулзалсан агентын тоо</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.totalMeetings || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.totalMeetings || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.totalMeetings || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Тухайн сард Iconnect нээгдсэн агентын тоо</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.iconnectOpenings || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.iconnectOpenings || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.iconnectOpenings || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fire Up-д бүртгүүлсэн агентын тоо</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.fireupRegistrations || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.fireupRegistrations || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.fireupRegistrations || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">In process</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.inProcess || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.inProcess || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.inProcess || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Cancelled</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.cancelled || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.cancelled || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.cancelled || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Шилжиж орж ирсэн агент</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.transfers || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.transfers || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.transfers || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Тухайн сарын өсөлт</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.monthlyGrowth || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.monthlyGrowth || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.monthlyGrowth || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Чөлөө авсан агент</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.agentsOnLeave || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.agentsOnLeave || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.agentsOnLeave || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ХАГ цуцалсан агент</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.resigned || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.resigned || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.resigned || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Цэвэр өсөлт</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.netGrowth || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.netGrowth || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.netGrowth || 0}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">НИЙТ ICONNECT</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Гэгээнтэн']?.totalIConnect || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Ривер']?.totalIConnect || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statistics['Даун таун']?.totalIConnect || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Нэр, имэйл, утас, оффисоор хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700">Төлөвөөр шүүх:</span>
          <div className="relative">
            <button
              onClick={() => setStatusFilterOpen(!statusFilterOpen)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2"
            >
              <span>{selectedStatuses.length === 0 ? 'Бүгд' : `${selectedStatuses.length} сонгосон`}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusFilterOpen && (
              <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2">
                  {APPLICATION_STATUSES.map(status => (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => toggleStatusFilter(status.value)}
                        className="rounded text-indigo-600"
                      />
                      <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="border-t p-2">
                  <button
                    onClick={() => { setSelectedStatuses([]); setStatusFilterOpen(false); }}
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                  >
                    Цэвэрлэх
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Office Filter */}
          <div className="min-w-[150px]">
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
            >
              {OFFICES.map(office => (
                <option key={office} value={office}>{office === 'Бүгд' ? 'Бүх оффис' : office}</option>
              ))}
            </select>
          </div>
          {selectedStatuses.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedStatuses.map(s => {
                const status = APPLICATION_STATUSES.find(st => st.value === s);
                return status ? (
                  <span key={s} className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
          {(searchTerm || selectedStatuses.length > 0) && (
            <button onClick={() => { setSearchTerm(''); setSelectedStatuses([]); }} className="text-sm text-indigo-600 hover:text-indigo-800">
              Цэвэрлэх
            </button>
          )}
          <div className="ml-auto flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Жагсаалт
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Хүснэгт
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-gray-900">Өргөдлүүд ({filteredApplications.length}/{applications.length})</h2>
          </div>
          <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredApplications.length === 0 ? (
              <li className="px-4 py-4 text-gray-500 text-center">Анкет байхгүй</li>
            ) : (
              filteredApplications.map((app) => (
                <li
                  key={app.id}
                  onClick={() => setSelectedApplication(app)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                    selectedApplication?.id === app.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900">
                        <span className="font-bold">{app.firstName}</span> {app.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{app.email}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      app.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'interviewing' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'iconnect' ? 'bg-green-100 text-green-800' :
                      app.status === 'fireup' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.status === 'new' ? 'Шинэ' :
                       app.status === 'interviewing' ? 'Ярилцлага хийж байгаа' :
                       app.status === 'iconnect' ? 'iConnect' :
                       app.status === 'fireup' ? 'Fire UP' : 'Цуцалсан'}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Application Details */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
          {selectedApplication ? (
            <div className="p-6 max-h-[700px] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  {selectedApplication.photoUrl && (
                    <img
                      src={selectedApplication.photoUrl}
                      alt="Photo"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-xl text-gray-900">
                      {selectedApplication.familyName} <span className="font-bold">{selectedApplication.firstName}</span> {selectedApplication.lastName}
                    </h2>
                    <p className="text-gray-500">{selectedApplication.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={saveApplication}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Хадгалах
                      </button>
                      <button
                        onClick={cancelEditMode}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Болих
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={printApplication}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Хэвлэх
                      </button>
                      <button
                        onClick={enterEditMode}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                      >
                        Засах
                      </button>
                      <button
                        onClick={() => deleteApplication(selectedApplication.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Устгах
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus(selectedApplication.id, 'new')}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Шинэ
                </button>
                <button
                  onClick={() => updateStatus(selectedApplication.id, 'interviewing')}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Ярилцлага хийж байгаа
                </button>
                <button
                  onClick={openFireUpModal}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                >
                  Fire UP
                  {selectedApplication.trainingNumber && (
                    <span className="ml-1 text-xs">({selectedApplication.trainingNumber})</span>
                  )}
                </button>
                <button
                  onClick={openIconnectConfirm}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                >
                  iConnect
                </button>
                <button
                  onClick={() => updateStatus(selectedApplication.id, 'cancelled')}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  Цуцлах
                </button>
              </div>

              {/* Meeting Buttons */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Уулзалтууд</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openMeetingModal(1)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      getMeetingStatus(selectedApplication.meeting1) === 'filled'
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    Уулзалт 1
                    {selectedApplication.meeting1?.date && (
                      <span className="ml-2 text-xs">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => openMeetingModal(2)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      getMeetingStatus(selectedApplication.meeting2) === 'filled'
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    Уулзалт 2
                    {selectedApplication.meeting2?.date && (
                      <span className="ml-2 text-xs">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => openMeetingModal(3)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      getMeetingStatus(selectedApplication.meeting3) === 'filled'
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    Уулзалт 3
                    {selectedApplication.meeting3?.date && (
                      <span className="ml-2 text-xs">✓</span>
                    )}
                  </button>
                </div>
                {/* Display meeting info if exists */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  {selectedApplication.meeting1?.date && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">Уулзалт 1</p>
                      <p className="text-gray-600">{selectedApplication.meeting1.date}</p>
                      <p className="text-gray-600">{selectedApplication.meeting1.interviewerName}</p>
                    </div>
                  )}
                  {selectedApplication.meeting2?.date && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">Уулзалт 2</p>
                      <p className="text-gray-600">{selectedApplication.meeting2.date}</p>
                      <p className="text-gray-600">{selectedApplication.meeting2.interviewerName}</p>
                    </div>
                  )}
                  {selectedApplication.meeting3?.date && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">Уулзалт 3</p>
                      <p className="text-gray-600">{selectedApplication.meeting3.date}</p>
                      <p className="text-gray-600">{selectedApplication.meeting3.interviewerName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Info */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Хувийн мэдээлэл</h3>
                {isEditMode ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-500 mb-1">Ургийн овог</label>
                      <input type="text" value={editForm.familyName || ''} onChange={(e) => setEditForm({...editForm, familyName: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Овог</label>
                      <input type="text" value={editForm.lastName || ''} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Нэр</label>
                      <input type="text" value={editForm.firstName || ''} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Оффис</label>
                      <select value={editForm.interestedOffice || ''} onChange={(e) => setEditForm({...editForm, interestedOffice: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1">
                        <option value="">Сонгох</option>
                        <option value="Гэгээнтэн">Гэгээнтэн</option>
                        <option value="Ривер">Ривер</option>
                        <option value="Даун таун">Даун таун</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Ажилд орох огноо</label>
                      <input type="date" value={editForm.availableDate || ''} onChange={(e) => setEditForm({...editForm, availableDate: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Төрсөн газар</label>
                      <input type="text" value={editForm.birthPlace || ''} onChange={(e) => setEditForm({...editForm, birthPlace: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Үндэс угсаа</label>
                      <input type="text" value={editForm.ethnicity || ''} onChange={(e) => setEditForm({...editForm, ethnicity: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Хүйс</label>
                      <select value={editForm.gender || ''} onChange={(e) => setEditForm({...editForm, gender: e.target.value as 'male' | 'female'})}
                        className="w-full border border-gray-300 rounded px-2 py-1">
                        <option value="male">Эрэгтэй</option>
                        <option value="female">Эмэгтэй</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Төрсөн огноо</label>
                      <input type="date" value={editForm.birthDate || ''} onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Регистр</label>
                      <input type="text" value={editForm.registerNumber || ''} onChange={(e) => setEditForm({...editForm, registerNumber: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-500 mb-1">Гэрийн хаяг</label>
                      <input type="text" value={editForm.homeAddress || ''} onChange={(e) => setEditForm({...editForm, homeAddress: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Имэйл</label>
                      <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Утас</label>
                      <input type="text" value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Яаралтай холбоо</label>
                      <input type="text" value={editForm.emergencyPhone || ''} onChange={(e) => setEditForm({...editForm, emergencyPhone: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Facebook</label>
                      <input type="text" value={editForm.facebook || ''} onChange={(e) => setEditForm({...editForm, facebook: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Жолооны эрх</label>
                      <select value={editForm.hasDriverLicense ? 'yes' : 'no'} onChange={(e) => setEditForm({...editForm, hasDriverLicense: e.target.value === 'yes'})}
                        className="w-full border border-gray-300 rounded px-2 py-1">
                        <option value="yes">Тийм</option>
                        <option value="no">Үгүй</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Сургалтын дугаар</label>
                      <input type="text" value={editForm.trainingNumber || ''} onChange={(e) => setEditForm({...editForm, trainingNumber: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-500 mb-1">Бусад чадвар</label>
                      <textarea value={editForm.otherSkills || ''} onChange={(e) => setEditForm({...editForm, otherSkills: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" rows={2} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-500 mb-1">Давуу/сул тал</label>
                      <textarea value={editForm.strengthsWeaknesses || ''} onChange={(e) => setEditForm({...editForm, strengthsWeaknesses: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1" rows={2} />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Мэдээллийн эх сурвалж</label>
                      <select value={editForm.referralSource || ''} onChange={(e) => setEditForm({...editForm, referralSource: e.target.value})}
                        className="w-full border border-gray-300 rounded px-2 py-1">
                        <option value="">Сонгох</option>
                        <option value="Facebook хуудас">Facebook хуудас</option>
                        <option value="Найз танил">Найз танил</option>
                        <option value="Вебсайт">Вебсайт</option>
                        <option value="Бусад">Бусад</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="isTransfer"
                        checked={editForm.isTransfer || false} 
                        onChange={(e) => setEditForm({...editForm, isTransfer: e.target.checked})}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                      />
                      <label htmlFor="isTransfer" className="text-gray-700">Шилжиж орж ирсэн</label>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Оффис:</span> {selectedApplication.interestedOffice}</div>
                    <div><span className="text-gray-500">Ажилд орох огноо:</span> {selectedApplication.availableDate}</div>
                    <div><span className="text-gray-500">Төрсөн газар:</span> {selectedApplication.birthPlace}</div>
                    <div><span className="text-gray-500">Үндэс угсаа:</span> {selectedApplication.ethnicity}</div>
                    <div><span className="text-gray-500">Хүйс:</span> {selectedApplication.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}</div>
                    <div><span className="text-gray-500">Төрсөн огноо:</span> {selectedApplication.birthDate}</div>
                    <div><span className="text-gray-500">Регистр:</span> {selectedApplication.registerNumber}</div>
                    <div><span className="text-gray-500">Гэрийн хаяг:</span> {selectedApplication.homeAddress}</div>
                    <div><span className="text-gray-500">Утас:</span> {selectedApplication.phone}</div>
                    <div><span className="text-gray-500">Яаралтай холбоо:</span> {selectedApplication.emergencyPhone}</div>
                    <div><span className="text-gray-500">Facebook:</span> {selectedApplication.facebook}</div>
                    <div><span className="text-gray-500">Жолооны эрх:</span> {selectedApplication.hasDriverLicense ? 'Тийм' : 'Үгүй'}</div>
                    <div><span className="text-gray-500">Шилжиж орж ирсэн:</span> {selectedApplication.isTransfer ? <span className="text-green-600 font-medium">Тийм</span> : 'Үгүй'}</div>
                  </div>
                )}
              </section>

              {/* Family Members */}
              {selectedApplication.familyMembers.length > 0 && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Гэр бүлийн байдал</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Хэн болох</th>
                          <th className="px-3 py-2 text-left">Овог нэр</th>
                          <th className="px-3 py-2 text-left">Төрсөн газар</th>
                          <th className="px-3 py-2 text-left">Мэргэжил</th>
                          <th className="px-3 py-2 text-left">Утас</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApplication.familyMembers.map((member, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-3 py-2">{member.relationship}</td>
                            <td className="px-3 py-2">{member.fullName}</td>
                            <td className="px-3 py-2">{member.birthPlace}</td>
                            <td className="px-3 py-2">{member.profession}</td>
                            <td className="px-3 py-2">{member.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Education */}
              {selectedApplication.education.length > 0 && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Боловсрол</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Сургууль</th>
                          <th className="px-3 py-2 text-left">Элссэн</th>
                          <th className="px-3 py-2 text-left">Төгссөн</th>
                          <th className="px-3 py-2 text-left">Мэргэжил</th>
                          <th className="px-3 py-2 text-left">Голч</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApplication.education.map((edu, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-3 py-2">{edu.school}</td>
                            <td className="px-3 py-2">{edu.enrollmentDate}</td>
                            <td className="px-3 py-2">{edu.graduationDate}</td>
                            <td className="px-3 py-2">{edu.major}</td>
                            <td className="px-3 py-2">{edu.gpa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Languages */}
              {selectedApplication.languages.length > 0 && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Гадаад хэл</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.languages.map((lang, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 rounded text-sm">
                        {lang.language} - {lang.level}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Work Experience */}
              {selectedApplication.workExperience.length > 0 && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Ажлын туршлага</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Байгууллага</th>
                          <th className="px-3 py-2 text-left">Төрөл</th>
                          <th className="px-3 py-2 text-left">Албан тушаал</th>
                          <th className="px-3 py-2 text-left">Орсон</th>
                          <th className="px-3 py-2 text-left">Гарсан</th>
                          <th className="px-3 py-2 text-left">Цалин</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApplication.workExperience.map((work, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-3 py-2">{work.companyName}</td>
                            <td className="px-3 py-2">{work.businessType}</td>
                            <td className="px-3 py-2">{work.position}</td>
                            <td className="px-3 py-2">{work.startDate}</td>
                            <td className="px-3 py-2">{work.endDate}</td>
                            <td className="px-3 py-2">{work.salary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Additional Info */}
              {(selectedApplication.otherSkills || selectedApplication.strengthsWeaknesses) && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Нэмэлт мэдээлэл</h3>
                  {selectedApplication.otherSkills && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Бусад чадвар:</p>
                      <p className="text-sm">{selectedApplication.otherSkills}</p>
                    </div>
                  )}
                  {selectedApplication.strengthsWeaknesses && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Давуу/сул тал:</p>
                      <p className="text-sm">{selectedApplication.strengthsWeaknesses}</p>
                    </div>
                  )}
                </section>
              )}

              {/* Awards */}
              {selectedApplication.awards.length > 0 && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Шагнал</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Байгууллага</th>
                          <th className="px-3 py-2 text-left">Он</th>
                          <th className="px-3 py-2 text-left">Шагналын нэр</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedApplication.awards.map((award, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-3 py-2">{award.organization}</td>
                            <td className="px-3 py-2">{award.year}</td>
                            <td className="px-3 py-2">{award.awardName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Signature */}
              {selectedApplication.signatureUrl && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Гарын үсэг</h3>
                  <img src={selectedApplication.signatureUrl} alt="Signature" className="max-h-16" />
                </section>
              )}

              <div className="text-sm text-gray-500 pt-4 border-t">
                <p>Мэдээлэл авсан эх сурвалж: {selectedApplication.referralSource}</p>
                <p>Огноо: {new Date(selectedApplication.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Анкет сонгоно уу
            </div>
          )}
        </div>
      </div>
      ) : (
      /* Table View */
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Зураг</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нэр</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Овог</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ургийн овог</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оффис</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имэйл</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Утас</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Яаралтай</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Регистр</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрсөн</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хүйс</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Уулзалт 1</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Уулзалт 2</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Уулзалт 3</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сургалт №</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Бүртгэсэн</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-gray-500">
                    Анкет байхгүй
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app) => {
                  const statusInfo = APPLICATION_STATUSES.find(s => s.value === app.status);
                  return (
                    <tr 
                      key={app.id} 
                      onClick={() => { setSelectedApplication(app); setViewMode('list'); }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {app.photoUrl ? (
                          <img src={app.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">
                              {app.firstName?.charAt(0) || ''}{app.lastName?.charAt(0) || ''}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{app.firstName || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">{app.lastName || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.familyName || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.interestedOffice || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.email || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.phone || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.emergencyPhone || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.registerNumber || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.birthDate ? new Date(app.birthDate).toLocaleDateString('mn-MN') : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.gender === 'male' ? 'Эр' : 'Эм'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {app.meeting1?.date ? (
                          <span className="text-green-600 text-xs">{new Date(app.meeting1.date).toLocaleDateString('mn-MN')}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {app.meeting2?.date ? (
                          <span className="text-green-600 text-xs">{new Date(app.meeting2.date).toLocaleDateString('mn-MN')}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {app.meeting3?.date ? (
                          <span className="text-green-600 text-xs">{new Date(app.meeting3.date).toLocaleDateString('mn-MN')}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{app.trainingNumber || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusInfo?.label || app.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString('mn-MN') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={filteredApplications.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
      )}

      {/* Meeting Modal */}
      {meetingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Уулзалт {currentMeetingLevel}
                </h3>
                <button
                  onClick={() => setMeetingModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Уулзалт хийсэн огноо
                  </label>
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Уулзалт хийсэн ажилтан
                  </label>
                  <select
                    value={meetingForm.interviewerId}
                    onChange={(e) => setMeetingForm({ ...meetingForm, interviewerId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Сонгоно уу...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Нэмэлт тэмдэглэл
                  </label>
                  <textarea
                    value={meetingForm.notes}
                    onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Тэмдэглэл бичих..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setMeetingModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Болих
                </button>
                <button
                  onClick={saveMeeting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Хадгалах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fire UP Modal */}
      {fireUpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Fire UP</h3>
                <button
                  onClick={() => setFireUpModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Сургалтын дугаар
                  </label>
                  <input
                    type="number"
                    value={trainingNumber}
                    onChange={(e) => setTrainingNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Сургалтын дугаар оруулах..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setFireUpModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Болих
                </button>
                <button
                  onClick={saveFireUp}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Хадгалах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iConnect Confirmation Modal */}
      {iconnectConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">iConnect баталгаажуулалт</h3>
                <button
                  onClick={() => setIconnectConfirmOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900">Үндсэн агентаар бүртгэх үү?</p>
                <p className="text-sm text-gray-500 mt-2">
                  Энэ үйлдлийг хийснээр анкет ажилтны жагсаалт руу шилжинэ.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIconnectConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Болих
                </button>
                <button
                  onClick={confirmIconnect}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Тийм, бүртгэх
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">CSV-ээс анкетуудыг оруулах</h2>
              <p className="text-sm text-gray-600 mt-1">
                {importData.length} анкет оруулахад бэлэн байна
              </p>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {importError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {importError}
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">№</th>
                      <th className="px-3 py-2 text-left">Овог</th>
                      <th className="px-3 py-2 text-left">Нэр</th>
                      <th className="px-3 py-2 text-left">Оффис</th>
                      <th className="px-3 py-2 text-left">Имэйл</th>
                      <th className="px-3 py-2 text-left">Утас</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.map((app, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{app.lastName}</td>
                        <td className="px-3 py-2">{app.firstName}</td>
                        <td className="px-3 py-2">{app.interestedOffice}</td>
                        <td className="px-3 py-2">{app.email}</td>
                        <td className="px-3 py-2">{app.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => { setImportModalOpen(false); setImportData([]); setImportError(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={importLoading}
              >
                Болих
              </button>
              <button
                onClick={confirmImport}
                disabled={importLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importLoading && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Оруулах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
