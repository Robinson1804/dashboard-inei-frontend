import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu, Bell, Download, ChevronDown, LogOut, User } from 'lucide-react';
import { getResumen } from '@/api/alertas';

interface HeaderProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard/presupuesto': 'Tablero de Control Gerencial',
  '/dashboard/adquisiciones': 'Adquisiciones > 8 UIT',
  '/dashboard/contratos-menores': 'Contratos Menores ≤ 8 UIT',
  '/dashboard/actividades-operativas': 'Actividades Operativas',
  '/importacion': 'Importación de Datos',
  '/alertas': 'Sistema de Alertas',
};

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const title = routeTitles[location.pathname] ?? 'INEI Dashboard';

  // Fetch alert summary for notification badge
  const { data: alertaResumen } = useQuery({
    queryKey: ['alertas', 'resumen'],
    queryFn: getResumen,
    // Fallback gracefully when backend is not yet available
    retry: 1,
    staleTime: 60 * 1000,
  });

  const unreadCount = alertaResumen?.no_leidas ?? 0;

  // Retrieve user info from localStorage
  const storedUser = localStorage.getItem('user');
  const user: { nombre?: string; rol?: string } = storedUser
    ? (JSON.parse(storedUser) as { nombre?: string; rol?: string })
    : {};
  const userName = user.nombre ?? 'Usuario';
  const userRole = user.rol ?? 'Consultor';
  const userInitials = userName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowUserMenu(false);
    navigate('/login', { replace: true });
  };

  const handleBellClick = () => {
    navigate('/alertas');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 flex-shrink-0">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
          className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>

      {/* Right: Notifications + Export + User */}
      <div className="flex items-center gap-4">
        {/* Notification bell with badge */}
        <button
          onClick={handleBellClick}
          aria-label={`${unreadCount} alertas sin leer`}
          className="relative text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white px-0.5 font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Export button */}
        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
          <Download size={18} />
          Exportar
          <ChevronDown size={18} />
        </button>

        {/* Divider */}
        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
            className="flex items-center gap-3 pl-2 cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">{userName}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">{userRole}</p>
            </div>
            <div className="w-9 h-9 rounded-full border border-slate-200 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {userInitials || <User size={16} />}
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-[11px] text-slate-500">{userRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
