import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDemo } from '../../contexts/DemoContext';
import { NotificationItem, LanguageCode } from '../../types';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  onNavigate: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar, onNavigate }) => {
  const { userProfile, isAdmin } = useAuth();
  const {
    isDemoMode,
    demoUser,
    demoRole,
    setDemoRole,
    demoNotifications,
    markDemoNotificationRead,
    markAllDemoNotificationsRead,
  } = useDemo();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const effectiveUser = isDemoMode ? demoUser : userProfile;
  const effectiveNotifications = isDemoMode ? demoNotifications : notifications;

  useEffect(() => {
    if (isDemoMode) return;
    if (!userProfile) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userProfile.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: NotificationItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    });

    return () => unsub();
  }, [userProfile, isDemoMode]);

  const unreadCount = effectiveNotifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (isDemoMode) {
      markDemoNotificationRead(notif.id);
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', notif.id), {
        read: true,
      });
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (isDemoMode) {
      markAllDemoNotificationsRead();
      return;
    }
    for (const notif of notifications.filter((n) => !n.read)) {
      await updateDoc(doc(db, 'notifications', notif.id), { read: true });
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left: Mobile Toggle & Welcome */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs text-slate-400 font-medium">{t.appName} Workspace</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {effectiveUser?.name || 'Consultant'}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo Mode Role Switcher */}
        {isDemoMode && (
          <div className="flex items-center bg-[#14141F] border border-[#9B30FF]/30 rounded-xl p-1 text-xs shadow-xs">
            <button
              onClick={() => setDemoRole('admin')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                demoRole === 'admin'
                  ? 'bg-gradient-to-r from-[#A020F0] to-[#5B1FA8] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Admin role"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF9A1F]" />
              <span className="hidden xs:inline">Admin</span>
            </button>
            <button
              onClick={() => setDemoRole('member')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                demoRole === 'member'
                  ? 'bg-[#FF9A1F] text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Member role"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Member</span>
            </button>
          </div>
        )}

        {/* Language Switch */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <Globe className="w-3.5 h-3.5 text-slate-400 mx-1.5" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              language === 'en'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              language === 'fr'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              language === 'ar'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            العربية
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          title="Toggle Dark Mode"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div
              className={`absolute top-12 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 ${
                isRTL ? 'left-0' : 'right-0'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {effectiveNotifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">
                    You're all caught up! No notifications.
                  </p>
                ) : (
                  effectiveNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n)}
                      className={`p-3 rounded-2xl text-xs cursor-pointer transition-colors ${
                        n.read
                          ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-500'
                          : 'bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-medium border border-indigo-100 dark:border-indigo-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
