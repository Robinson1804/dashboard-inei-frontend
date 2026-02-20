import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  ClipboardList,
  CloudUpload,
  Bell,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const principalItems: NavItem[] = [
  { to: '/dashboard/presupuesto', label: 'Dashboard Presupuestal', icon: LayoutDashboard },
  { to: '/dashboard/adquisiciones', label: 'Adquisiciones > 8 UIT', icon: ShoppingBag },
  { to: '/dashboard/contratos-menores', label: 'Contratos ≤ 8 UIT', icon: FileText },
  { to: '/dashboard/actividades-operativas', label: 'Actividades Operativas', icon: ClipboardList },
];

const herramientasItems: NavItem[] = [
  { to: '/importacion', label: 'Importación de Datos', icon: CloudUpload },
  { to: '/alertas', label: 'Alertas', icon: Bell, badge: 5 },
];

const Sidebar = ({ collapsed, onToggle: _onToggle }: SidebarProps) => {
  const location = useLocation();

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.to;

    if (collapsed) {
      return (
        <NavLink
          key={item.to}
          to={item.to}
          title={item.label}
          className={`p-2 rounded-lg transition-colors relative flex items-center justify-center ${
            isActive
              ? 'bg-primary/20 text-primary'
              : 'text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon size={20} />
          {item.badge && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {item.badge}
            </span>
          )}
        </NavLink>
      );
    }

    return (
      <li key={item.to}>
        <NavLink
          to={item.to}
          className={
            isActive
              ? 'sidebar-active-item flex items-center px-3 py-2.5 rounded-r-md transition-colors group'
              : 'flex items-center px-3 py-2.5 rounded hover:bg-slate-800 hover:text-white transition-colors group'
          }
        >
          <Icon size={20} className={`mr-3 ${!isActive ? 'group-hover:text-primary' : ''}`} />
          <span className="text-sm font-medium">{item.label}</span>
          {item.badge && (
            <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {item.badge}
            </span>
          )}
        </NavLink>
      </li>
    );
  };

  // Collapsed sidebar
  if (collapsed) {
    return (
      <aside className="w-16 bg-sidebar flex flex-col items-center py-4 flex-shrink-0 z-20">
        {/* Mini logo */}
        <div className="mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
            I
          </div>
        </div>

        {/* Nav icons */}
        <nav className="flex flex-col gap-6 items-center flex-1">
          {principalItems.map(renderNavItem)}
          <div className="w-8 h-px bg-slate-700 my-2" />
          {herramientasItems.map(renderNavItem)}
        </nav>
      </aside>
    );
  }

  // Expanded sidebar
  return (
    <aside className="w-[260px] bg-sidebar flex-shrink-0 flex flex-col h-full text-slate-400">
      {/* Logo & Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-700/50">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <img alt="INEI Logo" className="rounded" src="/logo-inei.png" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-tight leading-none">INEI</span>
          <span className="text-[10px] uppercase font-semibold text-slate-500 mt-1">Presupuestal v1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {/* Principal */}
        <div className="px-3 mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2 tracking-wider">Principal</p>
          <ul className="space-y-1">
            {principalItems.map(renderNavItem)}
          </ul>
        </div>

        {/* Divider */}
        <div className="px-6 py-4">
          <hr className="border-slate-700/50" />
        </div>

        {/* Herramientas */}
        <div className="px-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2 tracking-wider">Herramientas</p>
          <ul className="space-y-1">
            {herramientasItems.map(renderNavItem)}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
            <HelpCircle size={16} className="text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">Soporte Técnico</p>
            <p className="text-[10px] text-slate-500">Central: (511) 652 0000</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
