import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Хяналтын самбар', href: '/', icon: '📊' },
  { name: 'Ажилчид', href: '/employees', icon: '✅' },
  { name: 'Анкетууд', href: '/applications', icon: '📝' },
  { name: 'Цолны мэдээлэл', href: '/ranks', icon: '🏆' },
  { name: 'Гарсан агентууд', href: '/resigned-agents', icon: '🚪' }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img src="/logo.png" alt="Remax Sky" className="h-10 mr-2" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Remax HR
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    } inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium rounded-t-lg transition-colors`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`${
                      location.pathname === '/admin'
                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    } inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium rounded-t-lg transition-colors`}
                  >
                    <span className="mr-1.5">⚙️</span>
                    Админ
                  </Link>
                )}
              </div>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="ml-2 hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Админ' : 
                     user?.role === 'manager' ? 'Менежер' : 'Рекрутер'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Гарах
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="sm:hidden border-t border-gray-200">
          <div className="flex flex-wrap gap-2 p-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  location.pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex items-center px-3 py-2 rounded-lg text-sm font-medium`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`${
                  location.pathname === '/admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex items-center px-3 py-2 rounded-lg text-sm font-medium`}
              >
                <span className="mr-1.5">⚙️</span>
                Админ
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
