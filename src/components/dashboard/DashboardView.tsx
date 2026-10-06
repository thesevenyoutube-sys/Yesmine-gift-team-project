import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import {
  CheckSquare,
  AlertTriangle,
  Building2,
  Users,
  Plus,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt,
  Presentation as PresentationIcon,
  Sparkles
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { Task, Client, Activity } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenNewTask: () => void;
  onOpenNewClient: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewTask,
  onOpenNewClient,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { isDemoMode, demoTasks, demoClients, demoAuditLogs, demoRole } = useDemo();
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setTasks(demoTasks);
      setClients(demoClients);
      setActivities(
        demoAuditLogs.map((log) => ({
          id: log.id,
          type: log.action,
          description: log.details,
          userId: log.userId,
          userName: log.userName,
          createdAt: log.createdAt,
        }))
      );
      setLoading(false);
      return;
    }

    if (!userProfile) return;

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list: Task[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTasks(list);
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: Client[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setClients(list);
    });

    const unsubActs = onSnapshot(
      query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(15)),
      (snap) => {
        const list: Activity[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setActivities(list);
        setLoading(false);
      }
    );

    return () => {
      unsubTasks();
      unsubClients();
      unsubActs();
    };
  }, [userProfile, isDemoMode, demoTasks, demoClients, demoAuditLogs]);

  const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;

  // Role filtering for member vs admin
  const visibleTasks = tasks.filter((t) => {
    if (effectiveIsAdmin) return true;
    return t.assigneeId === userProfile?.id || t.createdBy === userProfile?.id;
  });

  const visibleClients = clients.filter((c) => {
    if (effectiveIsAdmin) return true;
    return c.ownerId === userProfile?.id;
  });

  // Date helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

  const tasksDueThisWeek = visibleTasks.filter(
    (t) => t.status !== 'done' && t.dueDate >= todayStr && t.dueDate <= nextWeek
  );

  const overdueTasks = visibleTasks.filter(
    (t) => t.status !== 'done' && t.dueDate < todayStr
  );

  const activeClientsCount = visibleClients.filter((c) => c.status === 'active').length;

  if (loading) {
    return <LoadingSpinner message="Loading workspace dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3 text-indigo-200">
            <Sparkles className="w-3.5 h-3.5" /> Workspace Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.welcomeBack}, {userProfile?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-2">
            {t.teamOverview}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.newTask}
            </button>
            <button
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.newClient}
            </button>
            <button
              onClick={() => onNavigate('presentations')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
            >
              <PresentationIcon className="w-4 h-4" /> Pitch Decks
            </button>
          </div>
        </div>

        {/* Decorative blur circle */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Due This Week */}
        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">{t.tasksDueThisWeek}</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {tasksDueThisWeek.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Pending this 7-day cycle</span>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-rose-500/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-rose-600">{t.overdueTasks}</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {overdueTasks.length}
          </div>
          <span className="text-[11px] text-rose-500/80 mt-1">Requires immediate attention</span>
        </div>

        {/* Active Clients */}
        <div
          onClick={() => onNavigate('clients')}
          className="cursor-pointer p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">{t.activeClients}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {activeClientsCount}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1">Total: {visibleClients.length} managed</span>
        </div>

        {/* Total Tasks Completion Rate */}
        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Completion Rate</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {visibleTasks.length > 0
              ? `${Math.round(
                  (visibleTasks.filter((t) => t.status === 'done').length / visibleTasks.length) * 100
                )}%`
              : '0%'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {visibleTasks.filter((t) => t.status === 'done').length} of {visibleTasks.length} tasks completed
          </span>
        </div>
      </div>

      {/* Main Grid: Upcoming Deadlines & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines Widget */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t.upcomingDeadlines}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              {t.viewAll} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {tasksDueThisWeek.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">{t.noUpcomingDeadlines}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {tasksDueThisWeek.slice(0, 5).map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {task.title}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Assigned to {task.assigneeName} • Due {task.dueDate}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] shrink-0 ${
                      task.priority === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t.recentActivity}
              </h3>
            </div>
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">{t.noRecentActivity}</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 leading-snug">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
