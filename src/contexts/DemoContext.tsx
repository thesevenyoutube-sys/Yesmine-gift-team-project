import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  Project,
  Task,
  Client,
  Invoice,
  Expense,
  Presentation,
  ChatChannel,
  ChatMessage,
  NotificationItem,
  AuditLog,
  FileItem,
  ClientNote
} from '../types';
import {
  DEMO_ENABLED,
  INITIAL_DEMO_USERS,
  INITIAL_DEMO_PROJECTS,
  INITIAL_DEMO_TASKS,
  INITIAL_DEMO_CLIENTS,
  INITIAL_DEMO_SERVICES,
  INITIAL_DEMO_INVOICES,
  INITIAL_DEMO_EXPENSES,
  INITIAL_DEMO_PRESENTATIONS,
  INITIAL_DEMO_CHANNELS,
  INITIAL_DEMO_MESSAGES,
  INITIAL_DEMO_NOTIFICATIONS,
  INITIAL_DEMO_FILES,
  INITIAL_DEMO_NOTES,
  ServiceItem
} from '../config/demo';

interface DemoContextType {
  isDemoMode: boolean;
  demoRole: UserRole;
  demoUser: UserProfile;
  setDemoRole: (role: UserRole) => void;
  enterDemo: (role: UserRole) => void;
  exitDemo: () => void;

  // In-memory data states
  demoUsers: UserProfile[];
  demoProjects: Project[];
  demoTasks: Task[];
  demoClients: Client[];
  demoServices: ServiceItem[];
  demoInvoices: Invoice[];
  demoExpenses: Expense[];
  demoPresentations: Presentation[];
  demoChannels: ChatChannel[];
  demoMessages: Record<string, ChatMessage[]>;
  demoNotifications: NotificationItem[];
  demoAuditLogs: AuditLog[];
  demoFiles: FileItem[];
  demoNotes: Record<string, ClientNote[]>;

  // Mutators in demo mode
  addDemoTask: (task: Task) => void;
  updateDemoTask: (id: string, updates: Partial<Task>) => void;
  deleteDemoTask: (id: string) => void;
  addDemoProject: (project: Project) => void;
  updateDemoProject: (id: string, updates: Partial<Project>) => void;
  deleteDemoProject: (id: string) => void;
  addDemoClient: (client: Client) => void;
  updateDemoClient: (id: string, updates: Partial<Client>) => void;
  deleteDemoClient: (id: string) => void;
  addDemoClientNote: (clientId: string, note: ClientNote) => void;
  addDemoInvoice: (invoice: Invoice) => void;
  updateDemoInvoiceStatus: (id: string, status: Invoice['status']) => void;
  deleteDemoInvoice: (id: string) => void;
  addDemoExpense: (expense: Expense) => void;
  deleteDemoExpense: (id: string) => void;
  addDemoPresentation: (pres: Presentation) => void;
  deleteDemoPresentation: (id: string) => void;
  addDemoFile: (file: FileItem) => void;
  deleteDemoFile: (id: string) => void;
  addDemoMessage: (channelId: string, message: ChatMessage) => void;
  addDemoChannel: (channel: ChatChannel) => void;
  addDemoUser: (user: UserProfile) => void;
  updateDemoUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteDemoUser: (id: string) => void;
  addDemoService: (service: ServiceItem) => void;
  updateDemoService: (id: string, updates: Partial<ServiceItem>) => void;
  deleteDemoService: (id: string) => void;
  markDemoNotificationRead: (id: string) => void;
  markAllDemoNotificationsRead: () => void;
  recordDemoAudit: (action: string, module: string, details: string) => void;

  // Welcome tour state
  isTourOpen: boolean;
  openTour: () => void;
  closeTour: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return sessionStorage.getItem('safran_demo_active') === 'true';
  });

  const [demoRole, setDemoRoleState] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem('safran_demo_role');
    return saved === 'member' ? 'member' : 'admin';
  });

  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // In-memory data copies
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>(INITIAL_DEMO_USERS);
  const [demoProjects, setDemoProjects] = useState<Project[]>(INITIAL_DEMO_PROJECTS);
  const [demoTasks, setDemoTasks] = useState<Task[]>(INITIAL_DEMO_TASKS);
  const [demoClients, setDemoClients] = useState<Client[]>(INITIAL_DEMO_CLIENTS);
  const [demoServices, setDemoServices] = useState<ServiceItem[]>(INITIAL_DEMO_SERVICES);
  const [demoInvoices, setDemoInvoices] = useState<Invoice[]>(INITIAL_DEMO_INVOICES);
  const [demoExpenses, setDemoExpenses] = useState<Expense[]>(INITIAL_DEMO_EXPENSES);
  const [demoPresentations, setDemoPresentations] = useState<Presentation[]>(INITIAL_DEMO_PRESENTATIONS);
  const [demoChannels, setDemoChannels] = useState<ChatChannel[]>(INITIAL_DEMO_CHANNELS);
  const [demoMessages, setDemoMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_DEMO_MESSAGES);
  const [demoNotifications, setDemoNotifications] = useState<NotificationItem[]>(INITIAL_DEMO_NOTIFICATIONS);
  const [demoFiles, setDemoFiles] = useState<FileItem[]>(INITIAL_DEMO_FILES);
  const [demoNotes, setDemoNotes] = useState<Record<string, ClientNote[]>>(INITIAL_DEMO_NOTES);

  const [demoAuditLogs, setDemoAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log_d_1',
      action: 'demo_session_initialized',
      module: 'system',
      details: 'Demo mode initialized with Safran Business Consulting sample datasets',
      userId: 'demo_user_1',
      userName: 'Demo Admin',
      userRole: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'log_d_2',
      action: 'invoice_issued',
      module: 'finance',
      details: 'Issued Invoice #SBC-2026-004 (59,500 TND) to Banque Internationale',
      userId: 'demo_user_1',
      userName: 'Demo Admin',
      userRole: 'admin',
      createdAt: '2026-09-15T11:00:00Z',
    },
    {
      id: 'log_d_3',
      action: 'due_diligence_completed',
      module: 'clients',
      details: 'Finalized Buy-Side Commercial Due Diligence report for Pharma Horizon',
      userId: 'demo_user_2',
      userName: 'Amira Chahed',
      userRole: 'admin',
      createdAt: '2026-09-20T16:00:00Z',
    },
  ]);

  const enterDemo = (role: UserRole) => {
    setIsDemoMode(true);
    setDemoRoleState(role);
    sessionStorage.setItem('safran_demo_active', 'true');
    sessionStorage.setItem('safran_demo_role', role);

    // Reset fresh memory data
    setDemoUsers(INITIAL_DEMO_USERS);
    setDemoProjects(INITIAL_DEMO_PROJECTS);
    setDemoTasks(INITIAL_DEMO_TASKS);
    setDemoClients(INITIAL_DEMO_CLIENTS);
    setDemoServices(INITIAL_DEMO_SERVICES);
    setDemoInvoices(INITIAL_DEMO_INVOICES);
    setDemoExpenses(INITIAL_DEMO_EXPENSES);
    setDemoPresentations(INITIAL_DEMO_PRESENTATIONS);
    setDemoChannels(INITIAL_DEMO_CHANNELS);
    setDemoMessages(INITIAL_DEMO_MESSAGES);
    setDemoNotifications(INITIAL_DEMO_NOTIFICATIONS);
    setDemoFiles(INITIAL_DEMO_FILES);
    setDemoNotes(INITIAL_DEMO_NOTES);

    // Automatically trigger welcome tour
    setIsTourOpen(true);
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    sessionStorage.removeItem('safran_demo_active');
    sessionStorage.removeItem('safran_demo_role');
    setIsTourOpen(false);
  };

  const setDemoRole = (role: UserRole) => {
    setDemoRoleState(role);
    sessionStorage.setItem('safran_demo_role', role);
  };

  const demoUser: UserProfile =
    demoRole === 'admin'
      ? {
          id: 'demo_user_1',
          name: 'Demo Admin',
          email: 'admin.demo@safran-consulting.com',
          role: 'admin',
          title: 'Managing Partner & Practice Lead',
          avatarUrl: '',
          createdAt: '2026-01-01T00:00:00Z',
        }
      : {
          id: 'demo_user_3',
          name: 'Demo Member',
          email: 'member.demo@safran-consulting.com',
          role: 'member',
          title: 'Principal - Digital Transformation',
          avatarUrl: '',
          createdAt: '2026-02-15T00:00:00Z',
        };

  // In-memory mutators
  const addDemoTask = (task: Task) => {
    setDemoTasks((prev) => [task, ...prev]);
    recordDemoAudit('task_created', 'tasks', `Created task "${task.title}"`);
  };

  const updateDemoTask = (id: string, updates: Partial<Task>) => {
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    if (updates.status) {
      recordDemoAudit('task_status_changed', 'tasks', `Moved task to ${updates.status}`);
    }
  };

  const deleteDemoTask = (id: string) => {
    setDemoTasks((prev) => prev.filter((t) => t.id !== id));
    recordDemoAudit('task_deleted', 'tasks', `Deleted task ID ${id}`);
  };

  const addDemoProject = (project: Project) => {
    setDemoProjects((prev) => [project, ...prev]);
    recordDemoAudit('project_created', 'tasks', `Created project "${project.name}"`);
  };

  const updateDemoProject = (id: string, updates: Partial<Project>) => {
    setDemoProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deleteDemoProject = (id: string) => {
    setDemoProjects((prev) => prev.filter((p) => p.id !== id));
    recordDemoAudit('project_deleted', 'tasks', `Deleted project ID ${id}`);
  };

  const addDemoClient = (client: Client) => {
    setDemoClients((prev) => [client, ...prev]);
    recordDemoAudit('client_created', 'clients', `Added client "${client.name}" (${client.company})`);
  };

  const updateDemoClient = (id: string, updates: Partial<Client>) => {
    setDemoClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteDemoClient = (id: string) => {
    setDemoClients((prev) => prev.filter((c) => c.id !== id));
    recordDemoAudit('client_deleted', 'clients', `Deleted client ID ${id}`);
  };

  const addDemoClientNote = (clientId: string, note: ClientNote) => {
    setDemoNotes((prev) => ({
      ...prev,
      [clientId]: [note, ...(prev[clientId] || [])],
    }));
    recordDemoAudit('note_added', 'clients', `Added note to client record`);
  };

  const addDemoInvoice = (invoice: Invoice) => {
    setDemoInvoices((prev) => [invoice, ...prev]);
    recordDemoAudit(
      'invoice_created',
      'finance',
      `Issued invoice #${invoice.invoiceNumber} (${invoice.total.toLocaleString()} TND)`
    );
  };

  const updateDemoInvoiceStatus = (id: string, status: Invoice['status']) => {
    setDemoInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv))
    );
    recordDemoAudit('invoice_status_updated', 'finance', `Invoice status changed to ${status}`);
  };

  const deleteDemoInvoice = (id: string) => {
    setDemoInvoices((prev) => prev.filter((inv) => inv.id !== id));
    recordDemoAudit('invoice_deleted', 'finance', `Deleted invoice ID ${id}`);
  };

  const addDemoExpense = (expense: Expense) => {
    setDemoExpenses((prev) => [expense, ...prev]);
    recordDemoAudit('expense_recorded', 'finance', `Recorded expense "${expense.description}"`);
  };

  const deleteDemoExpense = (id: string) => {
    setDemoExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addDemoPresentation = (pres: Presentation) => {
    setDemoPresentations((prev) => [pres, ...prev]);
    recordDemoAudit('presentation_uploaded', 'presentations', `Uploaded presentation "${pres.title}"`);
  };

  const deleteDemoPresentation = (id: string) => {
    setDemoPresentations((prev) => prev.filter((p) => p.id !== id));
    recordDemoAudit('presentation_deleted', 'presentations', `Deleted presentation ID ${id}`);
  };

  const addDemoFile = (file: FileItem) => {
    setDemoFiles((prev) => [file, ...prev]);
    recordDemoAudit('file_uploaded', 'files', `Uploaded file "${file.name}"`);
  };

  const deleteDemoFile = (id: string) => {
    setDemoFiles((prev) => prev.filter((f) => f.id !== id));
    recordDemoAudit('file_deleted', 'files', `Deleted file ID ${id}`);
  };

  const addDemoMessage = (channelId: string, message: ChatMessage) => {
    setDemoMessages((prev) => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), message],
    }));
  };

  const addDemoChannel = (channel: ChatChannel) => {
    setDemoChannels((prev) => [...prev, channel]);
  };

  const addDemoUser = (user: UserProfile) => {
    setDemoUsers((prev) => [...prev, user]);
    recordDemoAudit('user_invited', 'team', `Invited user ${user.name} (${user.role})`);
  };

  const updateDemoUser = (id: string, updates: Partial<UserProfile>) => {
    setDemoUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u))
    );
  };

  const deleteDemoUser = (id: string) => {
    setDemoUsers((prev) => prev.filter((u) => u.id !== id));
    recordDemoAudit('user_removed', 'team', `Removed user ID ${id}`);
  };

  const addDemoService = (service: ServiceItem) => {
    setDemoServices((prev) => [service, ...prev]);
  };

  const updateDemoService = (id: string, updates: Partial<ServiceItem>) => {
    setDemoServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteDemoService = (id: string) => {
    setDemoServices((prev) => prev.filter((s) => s.id !== id));
  };

  const markDemoNotificationRead = (id: string) => {
    setDemoNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllDemoNotificationsRead = () => {
    setDemoNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const recordDemoAudit = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_demo_${Date.now()}`,
      action,
      module,
      details,
      userId: demoUser.id,
      userName: demoUser.name,
      userRole: demoRole,
      createdAt: new Date().toISOString(),
    };
    setDemoAuditLogs((prev) => [newLog, ...prev]);
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoRole,
        demoUser,
        setDemoRole,
        enterDemo,
        exitDemo,
        demoUsers,
        demoProjects,
        demoTasks,
        demoClients,
        demoServices,
        demoInvoices,
        demoExpenses,
        demoPresentations,
        demoChannels,
        demoMessages,
        demoNotifications,
        demoAuditLogs,
        demoFiles,
        demoNotes,
        addDemoTask,
        updateDemoTask,
        deleteDemoTask,
        addDemoProject,
        updateDemoProject,
        deleteDemoProject,
        addDemoClient,
        updateDemoClient,
        deleteDemoClient,
        addDemoClientNote,
        addDemoInvoice,
        updateDemoInvoiceStatus,
        deleteDemoInvoice,
        addDemoExpense,
        deleteDemoExpense,
        addDemoPresentation,
        deleteDemoPresentation,
        addDemoFile,
        deleteDemoFile,
        addDemoMessage,
        addDemoChannel,
        addDemoUser,
        updateDemoUser,
        deleteDemoUser,
        addDemoService,
        updateDemoService,
        deleteDemoService,
        markDemoNotificationRead,
        markAllDemoNotificationsRead,
        recordDemoAudit,
        isTourOpen,
        openTour: () => setIsTourOpen(true),
        closeTour: () => setIsTourOpen(false),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
