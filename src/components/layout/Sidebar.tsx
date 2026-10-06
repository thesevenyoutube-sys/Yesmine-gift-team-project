import React from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  Building2,
  Briefcase,
  Receipt,
  Presentation as PresentationIcon,
  Folder,
  MessageSquare,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  ShieldAlert,
  LogOut,
  X,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { Logo } from '../common/Logo';

export type ActiveTab =
  | 'dashboard'
  | 'tasks'
  | 'clients'
  | 'services'
  | 'finance'
  | 'presentations'
  | 'files'
  | 'chat'
  | 'reports'
  | 'team'
  | 'settings'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { userProfile, isAdmin, signOut } = useAuth();
  const { isDemoMode, demoUser, demoRole, exitDemo } = useDemo();
  const { t, isRTL } = useLanguage();

  const effectiveUser = isDemoMode ? demoUser : userProfile;
  const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;
  const effectiveSignOut = isDemoMode ? exitDemo : signOut;

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: t.dashboard, icon: LayoutDashboard },
    { id: 'tasks' as ActiveTab, label: t.tasksAndProjects, icon: KanbanSquare },
    { id: 'clients' as ActiveTab, label: t.clientsCRM, icon: Building2 },
    { id: 'services' as ActiveTab, label: 'Services & Practices', icon: Briefcase, badge: 'Core' },
    { id: 'finance' as ActiveTab, label: 'Invoices & Finance', icon: Receipt },
    { id: 'presentations' as ActiveTab, label: 'Presentations', icon: PresentationIcon },
    { id: 'files' as ActiveTab, label: 'Files & Storage', icon: Folder },
    { id: 'chat' as ActiveTab, label: 'Team Chat', icon: MessageSquare },
    { id: 'reports' as ActiveTab, label: 'Reports & Export', icon: BarChart3 },
    { id: 'team' as ActiveTab, label: t.team, icon: Users },
    { id: 'settings' as ActiveTab, label: 'Firm Settings', icon: SettingsIcon },
  ];

  if (effectiveIsAdmin) {
    navItems.push({ id: 'audit' as ActiveTab, label: 'Audit Trail', icon: ShieldAlert });
  }

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 z-50 w-72 bg-[#0E0E18] text-[#F4F1FF] border-r border-[#26263A] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isRTL ? 'right-0' : 'left-0'
        } ${
          isOpenMobile
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header with Safran Logo */}
        <div className="p-5 border-b border-[#26263A] flex items-center justify-between">
          <Logo size="md" />

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill Banner */}
        <div className="px-5 pt-3 pb-1">
          <div
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
              effectiveIsAdmin
                ? 'bg-purple-950/40 border-purple-800/40 text-[#EFE7FF]'
                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
            }`}
          >
            {effectiveIsAdmin ? (
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF9A1F] shrink-0" />
            ) : (
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="truncate">{effectiveIsAdmin ? 'Managing Partner (Admin)' : 'Consultant (Member)'}</span>
          </div>
        </div>

        {/* Navigation Items with Purple Gradient & Thin Orange Indicator */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#A020F0] via-[#7B2FF7] to-[#5B1FA8] text-white shadow-lg glow-purple'
                    : 'text-slate-300 hover:bg-[#1E1E2D]/80 hover:text-white'
                }`}
              >
                {/* Thin orange indicator on active */}
                {isActive && (
                  <span
                    className={`absolute top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-[#FF9A1F] to-[#F26B1D] rounded-full shadow-[0_0_8px_#FF9A1F] ${
                      isRTL ? 'right-0' : 'left-0'
                    }`}
                  />
                )}

                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-[#9B30FF]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 rounded-md bg-[#FF9A1F]/20 text-[#FF9A1F] border border-[#FF9A1F]/30 text-[9px] font-extrabold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-[#26263A] bg-[#0B0B12]/80">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#14141F] border border-[#26263A] mb-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#A020F0] to-[#FF9A1F] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              {effectiveUser?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate font-heading">
                {effectiveUser?.name || 'Consultant'}
              </p>
              <p className="text-[10px] text-[#6B6B80] truncate">{effectiveUser?.email}</p>
            </div>
          </div>

          <button
            onClick={() => effectiveSignOut()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-900/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Exit Demo' : t.signOut}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
