import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Filter,
  CheckCircle2,
  Users,
  Building2,
  Receipt,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';
import { Task, Client, Invoice, UserProfile, Project } from '../../types';
import { exportToExcel } from '../../lib/excel';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ReportsView: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const {
    isDemoMode,
    demoTasks,
    demoClients,
    demoInvoices,
    demoUsers,
    demoProjects,
  } = useDemo();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [selectedProject, setSelectedProject] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isDemoMode) {
      setTasks(demoTasks);
      setClients(demoClients);
      setInvoices(demoInvoices);
      setTeamMembers(demoUsers);
      setProjects(demoProjects);
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

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      const list: Invoice[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setInvoices(list);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTeamMembers(list);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setProjects(list);
      setLoading(false);
    });

    return () => {
      unsubTasks();
      unsubClients();
      unsubInvoices();
      unsubUsers();
      unsubProjects();
    };
  }, [userProfile, isDemoMode, demoTasks, demoClients, demoInvoices, demoUsers, demoProjects]);

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    const matchPerson = selectedPerson === 'All' || t.assigneeId === selectedPerson;
    const matchProject = selectedProject === 'All' || t.projectId === selectedProject;
    const matchStart = !startDate || (t.dueDate && t.dueDate >= startDate);
    const matchEnd = !endDate || (t.dueDate && t.dueDate <= endDate);
    return matchPerson && matchProject && matchStart && matchEnd;
  });

  const filteredClients = clients.filter((c) => {
    const matchPerson = selectedPerson === 'All' || c.ownerId === selectedPerson;
    return matchPerson;
  });

  // Calculate task completions per member
  const memberTaskStats = teamMembers.map((member) => {
    const userTasks = filteredTasks.filter((t) => t.assigneeId === member.id);
    const completed = userTasks.filter((t) => t.status === 'done').length;
    const pending = userTasks.filter((t) => t.status !== 'done').length;
    return {
      id: member.id,
      name: member.name,
      total: userTasks.length,
      completed,
      pending,
      rate: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0,
    };
  });

  // Sales pipeline by status
  const leadsCount = filteredClients.filter((c) => c.status === 'lead').length;
  const activeCount = filteredClients.filter((c) => c.status === 'active').length;
  const closedCount = filteredClients.filter((c) => c.status === 'closed').length;
  const totalClients = filteredClients.length;

  const handleExportExcel = () => {
    const taskReport = filteredTasks.map((t) => ({
      Title: t.title,
      Assignee: t.assigneeName,
      Priority: t.priority.toUpperCase(),
      Status: t.status.toUpperCase(),
      DueDate: t.dueDate,
    }));
    exportToExcel(
      taskReport,
      `TeamHub_Report_${new Date().toISOString().split('T')[0]}`,
      'Tasks Report'
    );
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner message="Generating workspace reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Performance & Analytics Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Workforce throughput, pipeline health, and downloadable analytical audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print / PDF Report
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-medium mb-1">Filter by Person</label>
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="All">All Team Members</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Filter by Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Start Due Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">End Due Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: TASKS COMPLETED PER MEMBER */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Tasks Completed per Member
              </h3>
              <p className="text-xs text-slate-400">Total completed vs assigned tasks</p>
            </div>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-4">
            {memberTaskStats.map((stat) => (
              <div key={stat.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {stat.name}
                  </span>
                  <span className="text-slate-500">
                    {stat.completed} of {stat.total} done ({stat.rate}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 2: SALES PIPELINE BY CLIENT STATUS */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Sales Pipeline by Client Status
              </h3>
              <p className="text-xs text-slate-400">Leads, Active partnerships & Closed deals</p>
            </div>
            <Building2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="space-y-4">
            {/* Leads */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-amber-600">Leads (Potential)</span>
                <span>
                  {leadsCount} ({totalClients > 0 ? Math.round((leadsCount / totalClients) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${totalClients > 0 ? (leadsCount / totalClients) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Active */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-emerald-600">Active Retainers</span>
                <span>
                  {activeCount} ({totalClients > 0 ? Math.round((activeCount / totalClients) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${totalClients > 0 ? (activeCount / totalClients) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Closed */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-500">Closed / Completed</span>
                <span>
                  {closedCount} ({totalClients > 0 ? Math.round((closedCount / totalClients) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{
                    width: `${totalClients > 0 ? (closedCount / totalClients) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pipeline Funnel metric summary */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl">
              <span className="text-amber-700 dark:text-amber-300 font-bold block text-sm">
                {leadsCount}
              </span>
              <span className="text-amber-600/80 text-[11px]">Leads</span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold block text-sm">
                {activeCount}
              </span>
              <span className="text-emerald-600/80 text-[11px]">Active</span>
            </div>
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <span className="text-slate-700 dark:text-slate-300 font-bold block text-sm">
                {closedCount}
              </span>
              <span className="text-slate-500 text-[11px]">Closed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
