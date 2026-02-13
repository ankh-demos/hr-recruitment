import { useEffect, useState, useMemo } from 'react';
import { api, notificationsApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';

export function Admin() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'manager' as 'admin' | 'manager' | 'recruiter'
  });

  // Email configuration state
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; adminEmails: string[] } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
    loadEmailStatus();
  }, []);

  async function loadEmailStatus() {
    try {
      const status = await notificationsApi.getStatus();
      setEmailStatus(status);
    } catch (error) {
      console.error('Failed to load email status:', error);
    }
  }

  async function handleSendTestEmail() {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const result = await notificationsApi.sendTest();
      setEmailMessage({ type: 'success', text: result.message });
    } catch (error: any) {
      setEmailMessage({ type: 'error', text: error.message || 'Тест имэйл илгээхэд алдаа гарлаа' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleTriggerBirthdays() {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const result = await notificationsApi.triggerBirthdays();
      setEmailMessage({ type: 'success', text: result.message });
    } catch (error: any) {
      setEmailMessage({ type: 'error', text: error.message || 'Төрсөн өдрийн мэдэгдэл илгээхэд алдаа гарлаа' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleTriggerRanks() {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const result = await notificationsApi.triggerExpiringRanks();
      setEmailMessage({ type: 'success', text: result.message });
    } catch (error: any) {
      setEmailMessage({ type: 'error', text: error.message || 'Зэрэг дуусах мэдэгдэл илгээхэд алдаа гарлаа' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleSendSummary() {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const result = await notificationsApi.sendDailySummary();
      setEmailMessage({ type: 'success', text: result.message });
    } catch (error: any) {
      setEmailMessage({ type: 'error', text: error.message || 'Өдрийн тойм илгээхэд алдаа гарлаа' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Хэрэглэгчдийг ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, currentPage, pageSize]);

  function resetForm() {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'manager'
    });
    setEditingUser(null);
    setShowForm(false);
    setError('');
  }

  function handleEdit(user: User) {
    setFormData({
      username: user.username,
      password: '', // Don't show password
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
    setEditingUser(user);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        // Update user
        const updateData: any = {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/users/${editingUser.id}`, updateData);
        setSuccess('Хэрэглэгч амжилттай шинэчлэгдлээ');
      } else {
        // Create new user
        if (!formData.password) {
          setError('Нууц үг оруулна уу');
          return;
        }
        await api.post('/users', formData);
        setSuccess('Хэрэглэгч амжилттай үүсгэгдлээ');
      }
      resetForm();
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Алдаа гарлаа');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу?')) return;

    try {
      await api.delete(`/users/${id}`);
      setSuccess('Хэрэглэгч устгагдлаа');
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Устгахад алдаа гарлаа');
    }
  }

  async function handleToggleActive(user: User) {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      loadUsers();
    } catch (error) {
      setError('Төлөв өөрчлөхөд алдаа гарлаа');
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Хандах эрхгүй</h2>
          <p className="mt-2 text-gray-500">Энэ хуудас зөвхөн админ хэрэглэгчдэд зориулагдсан</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Хэрэглэгчийн удирдлага</h1>
            <p className="mt-1 text-purple-100">HR менежер хэрэглэгчдийг удирдах</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Хэрэглэгч нэмэх
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Хэрэглэгч засах' : 'Шинэ хэрэглэгч'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хэрэглэгчийн нэр</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  required
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Шинэ нууц үг (хоосон бол хэвээр)' : 'Нууц үг'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Бүтэн нэр</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имэйл</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Эрх</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'recruiter' })}
                  className="block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="recruiter">Рекрутер</option>
                  <option value="manager">Менежер</option>
                  <option value="admin">Админ</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  {editingUser ? 'Шинэчлэх' : 'Үүсгэх'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Цуцлах
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хэрэглэгч</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имэйл</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Эрх</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Хэрэглэгч байхгүй
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {user.role === 'admin' ? 'Админ' :
                        user.role === 'manager' ? 'Менежер' : 'Рекрутер'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                    >
                      Засах
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Устгах
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          totalItems={users.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Email Notifications Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Имэйл мэдэгдлийн тохиргоо</h2>
              <p className="text-sm text-gray-500">Админуудад имэйл мэдэгдэл илгээх</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${emailStatus?.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="font-medium text-gray-800">
                Имэйл серверийн төлөв: {emailStatus?.configured ? 'Тохируулагдсан ✓' : 'Тохируулаагүй ✗'}
              </p>
              {emailStatus?.adminEmails && emailStatus.adminEmails.length > 0 && (
                <p className="text-sm text-gray-500">
                  Админ имэйлүүд: {emailStatus.adminEmails.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* SMTP Configuration Guide */}
          {!emailStatus?.configured && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-2">⚙️ SMTP тохиргоо хийх заавар</h3>
              <p className="text-sm text-amber-700 mb-3">
                Серверийн environment variables дээр дараах утгуудыг тохируулна уу:
              </p>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                <div>SMTP_HOST=smtp.gmail.com</div>
                <div>SMTP_PORT=587</div>
                <div>SMTP_USER=your-email@gmail.com</div>
                <div>SMTP_PASS=your-app-password</div>
                <div>SMTP_FROM=your-email@gmail.com</div>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                💡 Gmail ашиглаж байгаа бол App Password үүсгэх шаардлагатай
              </p>
              <p className="text-xs text-amber-600 mt-1">
                📧 Админ имэйлүүд автоматаар админ хэрэглэгчдийн имэйлээс авагдана
              </p>
            </div>
          )}

          {/* Email Message */}
          {emailMessage && (
            <div className={`p-4 rounded-lg flex items-center justify-between ${emailMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
              <span className={emailMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {emailMessage.text}
              </span>
              <button onClick={() => setEmailMessage(null)} className={emailMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleSendTestEmail}
              disabled={emailLoading || !emailStatus?.configured}
              className="flex flex-col items-center gap-2 p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Тест имэйл</span>
            </button>

            <button
              onClick={handleTriggerBirthdays}
              disabled={emailLoading || !emailStatus?.configured}
              className="flex flex-col items-center gap-2 p-4 bg-pink-100 hover:bg-pink-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">🎂</span>
              <span className="text-sm font-medium text-pink-700">Төрсөн өдөр</span>
            </button>

            <button
              onClick={handleTriggerRanks}
              disabled={emailLoading || !emailStatus?.configured}
              className="flex flex-col items-center gap-2 p-4 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">🏅</span>
              <span className="text-sm font-medium text-amber-700">Зэрэг дуусах</span>
            </button>

            <button
              onClick={handleSendSummary}
              disabled={emailLoading || !emailStatus?.configured}
              className="flex flex-col items-center gap-2 p-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-700">Өдрийн тойм</span>
            </button>
          </div>

          {emailLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Илгээж байна...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
