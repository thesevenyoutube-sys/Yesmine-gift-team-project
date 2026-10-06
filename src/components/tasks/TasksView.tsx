import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import {
  KanbanSquare,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  User,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  FolderPlus,
  Layers,
  ArrowRight
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDemo } from '../../contexts/DemoContext';
import { Task, Project, UserProfile, Client, TaskStatus, TaskPriority } from '../../types';
import { exportToExcel } from '../../lib/excel';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { logAuditEvent } from '../../lib/audit';
import { sendNotification } from '../../lib/notifications';

interface TasksViewProps {
  initialOpenNewTask?: boolean;
}

export const TasksView: React.FC<TasksViewProps> = ({ initialOpenNewTask = false }) => {
  const { userProfile, isAdmin } = useAuth();
  const {
    isDemoMode,
    demoTasks,
    demoProjects,
    demoUsers,
    demoClients,
    demoRole,
    addDemoTask,
    updateDemoTask,
    deleteDemoTask,
    addDemoProject,
  } = useDemo();
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(initialOpenNewTask);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskClientId, setTaskClientId] = useState('');

  // Project Form State
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projColor, setProjColor] = useState('#6366f1');

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setTasks(demoTasks);
      setProjects(demoProjects);
      setTeamMembers(demoUsers);
      setClients(demoClients);
      setLoading(false);
      return;
    }

    if (!userProfile) return;

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list: Task[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTasks(list);
      setLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setProjects(list);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTeamMembers(list);
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: Client[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setClients(list);
    });

    return () => {
      unsubTasks();
      unsubProjects();
      unsubUsers();
      unsubClients();
    };
  }, [userProfile, isDemoMode, demoTasks, demoProjects, demoUsers, demoClients]);

  // Open edit modal
  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskAssigneeId(task.assigneeId);
    setTaskProjectId(task.projectId);
    setTaskDueDate(task.dueDate);
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskClientId(task.clientId || '');
    setIsTaskModalOpen(true);
  };

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) return;

    const assignee = teamMembers.find((m) => m.id === taskAssigneeId) || {
      id: userProfile?.id || '',
      name: userProfile?.name || 'Self',
      email: userProfile?.email || '',
    };

    const client = clients.find((c) => c.id === taskClientId);

    if (isDemoMode) {
      if (editingTask) {
        updateDemoTask(editingTask.id, {
          title: taskTitle,
          description: taskDesc,
          assigneeId: assignee.id,
          assigneeName: assignee.name,
          assigneeEmail: assignee.email,
          projectId: taskProjectId,
          dueDate: taskDueDate,
          priority: taskPriority,
          status: taskStatus,
          clientId: taskClientId || '',
          clientName: client?.name || '',
        });
      } else {
        const id = `task_${Date.now()}`;
        const newTask: Task = {
          id,
          projectId: taskProjectId,
          title: taskTitle,
          description: taskDesc,
          assigneeId: assignee.id,
          assigneeName: assignee.name,
          assigneeEmail: assignee.email,
          dueDate: taskDueDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          priority: taskPriority,
          status: taskStatus,
          clientId: taskClientId || '',
          clientName: client?.name || '',
          createdBy: userProfile?.id || 'demo_user_1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addDemoTask(newTask);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      setTaskTitle('');
      setTaskDesc('');
      return;
    }

    if (editingTask) {
      // Update
      try {
        await updateDoc(doc(db, 'tasks', editingTask.id), {
          title: taskTitle,
          description: taskDesc,
          assigneeId: assignee.id,
          assigneeName: assignee.name,
          assigneeEmail: assignee.email,
          projectId: taskProjectId,
          dueDate: taskDueDate,
          priority: taskPriority,
          status: taskStatus,
          clientId: taskClientId || '',
          clientName: client?.name || '',
          updatedAt: new Date().toISOString(),
        });
        await logAuditEvent('task_updated', 'tasks', `Updated task "${taskTitle}"`, editingTask.id);
        setIsTaskModalOpen(false);
        setEditingTask(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${editingTask.id}`);
      }
    } else {
      // Create
      const id = `task_${Date.now()}`;
      const newTask: Task = {
        id,
        projectId: taskProjectId,
        title: taskTitle,
        description: taskDesc,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
        dueDate: taskDueDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        priority: taskPriority,
        status: taskStatus,
        clientId: taskClientId || '',
        clientName: client?.name || '',
        createdBy: userProfile?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'tasks', id), newTask);
        await logAuditEvent('task_created', 'tasks', `Created task "${taskTitle}" (${taskPriority})`, id);

        // Notify assignee if not self
        if (assignee.id !== userProfile?.id) {
          await sendNotification(
            assignee.id,
            'New Task Assigned',
            `${userProfile?.name} assigned you the task "${taskTitle}"`,
            'task',
            '/tasks'
          );
        }

        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tasks/${id}`);
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) return;

    const id = `proj_${Date.now()}`;
    const newProj: Project = {
      id,
      name: projName,
      description: projDesc,
      color: projColor,
      status: 'active',
      createdBy: userProfile?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      addDemoProject(newProj);
      setIsProjectModalOpen(false);
      setProjName('');
      setProjDesc('');
      setSelectedProjectId(id);
      return;
    }

    try {
      await setDoc(doc(db, 'projects', id), newProj);
      await logAuditEvent('project_created', 'tasks', `Created project "${projName}"`, id);
      setIsProjectModalOpen(false);
      setProjName('');
      setProjDesc('');
      setSelectedProjectId(id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${id}`);
    }
  };

  // Drag and Drop status change
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDropStatus = async (newStatus: TaskStatus) => {
    if (!draggedTaskId) return;

    if (isDemoMode) {
      updateDemoTask(draggedTaskId, { status: newStatus });
      setDraggedTaskId(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'tasks', draggedTaskId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await logAuditEvent('task_status_dragged', 'tasks', `Moved task to ${newStatus}`, draggedTaskId);
      setDraggedTaskId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${draggedTaskId}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;

    if (isDemoMode) {
      deleteDemoTask(taskId);
      return;
    }

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      await logAuditEvent('task_deleted', 'tasks', `Deleted task`, taskId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  // Excel export
  const handleExportExcel = () => {
    const data = filteredTasks.map((t) => ({
      Title: t.title,
      Description: t.description || '',
      Assignee: t.assigneeName,
      Priority: t.priority.toUpperCase(),
      Status: t.status.toUpperCase(),
      DueDate: t.dueDate,
      Client: t.clientName || '',
    }));
    exportToExcel(data, `Safran_Tasks_${new Date().toISOString().split('T')[0]}`, 'Tasks');
  };

  // Import handler
  const handleImportTasks = async (validRows: any[]) => {
    const currentProjId = selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'project_general';

    for (const row of validRows) {
      const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const task: Task = {
        id,
        projectId: currentProjId,
        title: row.title,
        description: row.description || '',
        assigneeId: userProfile?.id || '',
        assigneeName: userProfile?.name || 'Self',
        dueDate: row.dueDate,
        priority: row.priority,
        status: row.status,
        createdBy: userProfile?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isDemoMode) {
        addDemoTask(task);
      } else {
        await setDoc(doc(db, 'tasks', id), task);
      }
    }

    if (!isDemoMode) {
      await logAuditEvent('tasks_imported', 'tasks', `Imported ${validRows.length} tasks from spreadsheet`);
    }
  };

  const effectiveIsAdmin = isDemoMode ? demoRole === 'admin' : isAdmin;

  // Role visibility: Member only sees assigned tasks or created tasks; Admin sees all
  const visibleTasks = tasks.filter((t) => {
    if (effectiveIsAdmin) return true;
    return t.assigneeId === userProfile?.id || t.createdBy === userProfile?.id;
  });

  const filteredTasks = visibleTasks.filter((t) => {
    const matchProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
    const matchAssignee = assigneeFilter === 'all' || t.assigneeId === assigneeFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchProject && matchAssignee && matchPriority && matchSearch;
  });

  const columns: { id: TaskStatus; label: string; count: number }[] = [
    { id: 'todo', label: t.todo, count: filteredTasks.filter((t) => t.status === 'todo').length },
    { id: 'doing', label: t.doing, count: filteredTasks.filter((t) => t.status === 'doing').length },
    { id: 'done', label: t.done, count: filteredTasks.filter((t) => t.status === 'done').length },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading Kanban boards & tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {t.tasksAndProjects}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Interactive drag-and-drop Kanban workflow, project milestones and task assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" /> Import .xlsx
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export .xlsx
          </button>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-500" /> {t.newProject}
          </button>
          <button
            onClick={() => {
              setEditingTask(null);
              setTaskTitle('');
              setTaskDesc('');
              setTaskAssigneeId(userProfile?.id || '');
              setTaskProjectId(projects[0]?.id || '');
              setTaskDueDate(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> {t.newTask}
          </button>
        </div>
      </div>

      {/* Project Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedProjectId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedProjectId === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          {t.allProjects} ({tasks.length})
        </button>
        {projects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => setSelectedProjectId(proj.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedProjectId === proj.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: proj.color || '#6366f1' }}
            />
            <span>{proj.name}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">{t.allAssignees}</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">{t.allPriorities}</option>
            <option value="high">{t.high}</option>
            <option value="medium">{t.medium}</option>
            <option value="low">{t.low}</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = draggedTaskId !== null;

          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropStatus(col.id)}
              className="flex flex-col bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      col.id === 'todo'
                        ? 'bg-amber-400'
                        : col.id === 'doing'
                        ? 'bg-indigo-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {col.label}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {col.count}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setEditingTask(null);
                    setTaskTitle('');
                    setTaskDesc('');
                    setTaskStatus(col.id);
                    setTaskProjectId(projects[0]?.id || '');
                    setTaskAssigneeId(userProfile?.id || '');
                    setIsTaskModalOpen(true);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards Stream */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-slate-400 text-xs p-4">
                    <p>{t.noTasksInColumn}</p>
                    <span className="text-[10px] mt-1 opacity-70">{t.dragHint}</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue =
                      task.status !== 'done' &&
                      task.dueDate < new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-grab active:cursor-grabbing"
                      >
                        {/* Header: Priority + Actions */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              task.priority === 'high'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {task.priority}
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(task)}
                              title="Edit"
                              className="p-1 rounded text-slate-400 hover:text-indigo-600"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              title="Delete"
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug mb-1">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}

                        {/* Linked Client Badge if present */}
                        {task.clientName && (
                          <div className="mb-2 inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                            Client: {task.clientName}
                          </div>
                        )}

                        {/* Footer: Due Date & Assignee Avatar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <div
                            className={`flex items-center gap-1 font-medium ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate}</span>
                          </div>

                          <div className="flex items-center gap-1.5" title={task.assigneeName}>
                            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[9px]">
                              {task.assigneeName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-20">
                              {task.assigneeName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingTask ? t.editTask : t.createTask}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter task details, priority, due date and member assignment
            </p>

            <form onSubmit={handleCreateOrUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.taskTitle} *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Design onboarding flow wireframes"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.taskDescription}
                </label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Detailed task guidelines..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.projects} *
                  </label>
                  <select
                    required
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.assignee}
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.dueDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.priority}
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="low">{t.low}</option>
                    <option value="medium">{t.medium}</option>
                    <option value="high">{t.high}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="todo">{t.todo}</option>
                    <option value="doing">{t.doing}</option>
                    <option value="done">{t.done}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.linkedClient}
                </label>
                <select
                  value={taskClientId}
                  onChange={(e) => setTaskClientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="">None</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {editingTask ? 'Save Changes' : t.createTask}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {t.createProject}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add a new team project and start managing its Kanban board
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.projectName} *
                </label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="Website Redesign, Mobile App v2..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.projectDescription}
                </label>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Project purpose, target milestones..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.projectColor}
                </label>
                <div className="flex items-center gap-2">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setProjColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          projColor === color ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {t.createProject}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      <ExcelImportModal
        type="tasks"
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportTasks}
        currentUser={{ id: userProfile?.id || '', name: userProfile?.name || 'User' }}
      />
    </div>
  );
};
