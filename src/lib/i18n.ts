import { LanguageCode } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  // Nav
  dashboard: string;
  tasksAndProjects: string;
  clientsCRM: string;
  team: string;
  modules: string;
  signOut: string;
  admin: string;
  member: string;
  // Dashboard
  welcomeBack: string;
  teamOverview: string;
  tasksDueThisWeek: string;
  overdueTasks: string;
  activeClients: string;
  recentActivity: string;
  quickActions: string;
  newTask: string;
  newProject: string;
  newClient: string;
  noRecentActivity: string;
  upcomingDeadlines: string;
  noUpcomingDeadlines: string;
  viewAll: string;
  // Tasks & Projects
  projects: string;
  allProjects: string;
  kanbanBoard: string;
  todo: string;
  doing: string;
  done: string;
  filterByAssignee: string;
  allAssignees: string;
  filterByPriority: string;
  allPriorities: string;
  low: string;
  medium: string;
  high: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  priority: string;
  assignee: string;
  linkedClient: string;
  none: string;
  createTask: string;
  createProject: string;
  projectName: string;
  projectDescription: string;
  projectColor: string;
  noTasksInColumn: string;
  dragHint: string;
  editTask: string;
  deleteTask: string;
  // Clients CRM
  clientDirectory: string;
  searchClients: string;
  filterByStatus: string;
  allStatuses: string;
  lead: string;
  active: string;
  closed: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  notes: string;
  owner: string;
  actions: string;
  clientDetails: string;
  notesHistory: string;
  addNote: string;
  notePlaceholder: string;
  linkedTasks: string;
  addLinkedTask: string;
  noNotesYet: string;
  noLinkedTasksYet: string;
  createClient: string;
  deleteClient: string;
  // Team
  teamDirectory: string;
  manageMembers: string;
  inviteMember: string;
  role: string;
  titleJob: string;
  assignedTasks: string;
  ownedClients: string;
  changeRole: string;
  removeMember: string;
  adminOnlyAction: string;
  adminBadge: string;
  memberBadge: string;
  memberRestrictedNotice: string;
  // Auth & Setup
  signIn: string;
  signUp: string;
  firstTimeSetup: string;
  firstTimeSetupDesc: string;
  setupAdminAccount: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  haveAccount: string;
  needAccount: string;
  firstTimePrompt: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  // Common
  save: string;
  cancel: string;
  delete: string;
  loading: string;
  search: string;
  close: string;
  confirmDelete: string;
  areYouSure: string;
  darkMode: string;
  lightMode: string;
  language: string;
  arabicRtl: string;
  french: string;
  english: string;
  // Modules expansion
  upcomingModules: string;
  upcomingModulesDesc: string;
  invoicesModule: string;
  invoicesDesc: string;
  filesModule: string;
  filesDesc: string;
  chatModule: string;
  chatDesc: string;
  comingSoon: string;
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    appName: 'Safran Business Consulting',
    tagline: 'Strategic Advisory & Enterprise Management Workspace',
    dashboard: 'Dashboard',
    tasksAndProjects: 'Tasks & Projects',
    clientsCRM: 'Clients (CRM)',
    team: 'Team Directory',
    modules: 'Modules & Roadmap',
    signOut: 'Sign Out',
    admin: 'Administrator',
    member: 'Team Member',
    welcomeBack: 'Welcome back',
    teamOverview: "Here's what's happening with your workspace today.",
    tasksDueThisWeek: 'Tasks Due This Week',
    overdueTasks: 'Overdue Tasks',
    activeClients: 'Active Clients',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    newTask: 'New Task',
    newProject: 'New Project',
    newClient: 'New Client',
    noRecentActivity: 'No recent activity recorded yet.',
    upcomingDeadlines: 'Upcoming Deadlines',
    noUpcomingDeadlines: 'No upcoming deadlines this week.',
    viewAll: 'View All',
    projects: 'Projects',
    allProjects: 'All Projects',
    kanbanBoard: 'Kanban Board',
    todo: 'To Do',
    doing: 'In Progress',
    done: 'Completed',
    filterByAssignee: 'Assignee',
    allAssignees: 'All Assignees',
    filterByPriority: 'Priority',
    allPriorities: 'All Priorities',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    taskTitle: 'Task Title',
    taskDescription: 'Description',
    dueDate: 'Due Date',
    priority: 'Priority',
    assignee: 'Assignee',
    linkedClient: 'Linked Client (Optional)',
    none: 'None',
    createTask: 'Create Task',
    createProject: 'Create Project',
    projectName: 'Project Name',
    projectDescription: 'Project Description',
    projectColor: 'Accent Color',
    noTasksInColumn: 'No tasks in this column',
    dragHint: 'Drag cards to update task status',
    editTask: 'Edit Task',
    deleteTask: 'Delete Task',
    clientDirectory: 'Client Directory',
    searchClients: 'Search clients by name, company, email...',
    filterByStatus: 'Filter Status',
    allStatuses: 'All Statuses',
    lead: 'Lead',
    active: 'Active',
    closed: 'Closed',
    name: 'Name',
    company: 'Company',
    phone: 'Phone',
    email: 'Email',
    status: 'Status',
    notes: 'Notes',
    owner: 'Owner',
    actions: 'Actions',
    clientDetails: 'Client Details',
    notesHistory: 'Notes & Timeline History',
    addNote: 'Post Note',
    notePlaceholder: 'Add a new note, call summary or meeting update...',
    linkedTasks: 'Tasks Linked to Client',
    addLinkedTask: 'Add Task for Client',
    noNotesYet: 'No notes logged yet for this client.',
    noLinkedTasksYet: 'No tasks currently linked to this client.',
    createClient: 'Add New Client',
    deleteClient: 'Delete Client',
    teamDirectory: 'Team Directory',
    manageMembers: 'Team Members & Permissions',
    inviteMember: 'Add Team Member',
    role: 'Role',
    titleJob: 'Job Title',
    assignedTasks: 'Assigned Tasks',
    ownedClients: 'Owned Clients',
    changeRole: 'Change Role',
    removeMember: 'Remove Member',
    adminOnlyAction: 'Only administrators can perform this action.',
    adminBadge: 'Admin (Full Access)',
    memberBadge: 'Member (Assigned Access)',
    memberRestrictedNotice: 'Members see tasks assigned to them and clients they own.',
    signIn: 'Sign In',
    signUp: 'Create Account',
    firstTimeSetup: 'First-Time Admin Setup',
    firstTimeSetupDesc: 'Welcome to TeamHub! Initialize your workspace as the primary administrator.',
    setupAdminAccount: 'Create Administrator Account',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    haveAccount: 'Already have an account? Sign in',
    needAccount: "Don't have an account? Sign up",
    firstTimePrompt: 'Setting up for the first time? Launch Admin Setup',
    emailPlaceholder: 'you@teamhub.com',
    passwordPlaceholder: '••••••••',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    loading: 'Loading...',
    search: 'Search...',
    close: 'Close',
    confirmDelete: 'Confirm Deletion',
    areYouSure: 'Are you sure you want to proceed?',
    darkMode: 'Dark Theme',
    lightMode: 'Light Theme',
    language: 'Language',
    arabicRtl: 'العربية (Arabic RTL)',
    french: 'Français (French)',
    english: 'English',
    upcomingModules: 'Modular Extensions',
    upcomingModulesDesc: 'TeamHub is designed to be easily extensible with upcoming business modules.',
    invoicesModule: 'Invoices & Billing',
    invoicesDesc: 'Generate client invoices, track receivables, and export financial summaries.',
    filesModule: 'Asset & File Management',
    filesDesc: 'Centralized repository for project briefs, contracts, brand assets, and attachments.',
    chatModule: 'Team Channels & Messaging',
    chatDesc: 'Real-time project discussions, direct messages, and notification threads.',
    comingSoon: 'Coming in Next Update',
  },
  fr: {
    appName: 'Safran Business Consulting',
    tagline: 'Cabinet de Conseil en Stratégie & Gestion d’Entreprise',
    dashboard: 'Tableau de bord',
    tasksAndProjects: 'Tâches & Projets',
    clientsCRM: 'Clients (CRM)',
    team: 'Annuaire d’équipe',
    modules: 'Modules & Roadmap',
    signOut: 'Déconnexion',
    admin: 'Administrateur',
    member: 'Membre de l’équipe',
    welcomeBack: 'Bon retour',
    teamOverview: 'Voici ce qui se passe dans votre espace de travail aujourd’hui.',
    tasksDueThisWeek: 'Tâches prévues cette semaine',
    overdueTasks: 'Tâches en retard',
    activeClients: 'Clients actifs',
    recentActivity: 'Activité récente',
    quickActions: 'Actions rapides',
    newTask: 'Nouvelle tâche',
    newProject: 'Nouveau projet',
    newClient: 'Nouveau client',
    noRecentActivity: 'Aucune activité récente enregistrée pour le moment.',
    upcomingDeadlines: 'Échéances à venir',
    noUpcomingDeadlines: 'Aucune échéance à venir cette semaine.',
    viewAll: 'Voir tout',
    projects: 'Projets',
    allProjects: 'Tous les projets',
    kanbanBoard: 'Tableau Kanban',
    todo: 'À faire',
    doing: 'En cours',
    done: 'Terminé',
    filterByAssignee: 'Assigné à',
    allAssignees: 'Tous les assignés',
    filterByPriority: 'Priorité',
    allPriorities: 'Toutes les priorités',
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    taskTitle: 'Titre de la tâche',
    taskDescription: 'Description',
    dueDate: 'Date d’échéance',
    priority: 'Priorité',
    assignee: 'Assigné',
    linkedClient: 'Client associé (Optionnel)',
    none: 'Aucun',
    createTask: 'Créer une tâche',
    createProject: 'Créer un projet',
    projectName: 'Nom du projet',
    projectDescription: 'Description du projet',
    projectColor: 'Couleur d’accent',
    noTasksInColumn: 'Aucune tâche dans cette colonne',
    dragHint: 'Glissez les cartes pour changer le statut',
    editTask: 'Modifier la tâche',
    deleteTask: 'Supprimer la tâche',
    clientDirectory: 'Annuaire des clients',
    searchClients: 'Rechercher par nom, entreprise, email...',
    filterByStatus: 'Statut',
    allStatuses: 'Tous les statuts',
    lead: 'Prospect (Lead)',
    active: 'Actif',
    closed: 'Fermé',
    name: 'Nom',
    company: 'Entreprise',
    phone: 'Téléphone',
    email: 'E-mail',
    status: 'Statut',
    notes: 'Notes',
    owner: 'Responsable',
    actions: 'Actions',
    clientDetails: 'Détails du client',
    notesHistory: 'Historique des notes & calendrier',
    addNote: 'Publier une note',
    notePlaceholder: 'Ajoutez une note, compte-rendu d’appel...',
    linkedTasks: 'Tâches liées au client',
    addLinkedTask: 'Ajouter une tâche pour ce client',
    noNotesYet: 'Aucune note pour ce client.',
    noLinkedTasksYet: 'Aucune tâche liée à ce client pour le moment.',
    createClient: 'Ajouter un client',
    deleteClient: 'Supprimer le client',
    teamDirectory: 'Membres de l’équipe',
    manageMembers: 'Membres & Permissions',
    inviteMember: 'Ajouter un membre',
    role: 'Rôle',
    titleJob: 'Poste / Titre',
    assignedTasks: 'Tâches assignées',
    ownedClients: 'Clients gérés',
    changeRole: 'Modifier le rôle',
    removeMember: 'Retirer le membre',
    adminOnlyAction: 'Seuls les administrateurs peuvent effectuer cette action.',
    adminBadge: 'Admin (Accès complet)',
    memberBadge: 'Membre (Accès restreint)',
    memberRestrictedNotice: 'Les membres ne voient que leurs tâches et leurs clients.',
    signIn: 'Connexion',
    signUp: 'Créer un compte',
    firstTimeSetup: 'Configuration initiale Administrateur',
    firstTimeSetupDesc: 'Bienvenue sur TeamHub ! Initialisez votre espace en tant qu’administrateur principal.',
    setupAdminAccount: 'Créer le compte administrateur',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    fullName: 'Nom complet',
    haveAccount: 'Vous avez déjà un compte ? Se connecter',
    needAccount: 'Pas encore de compte ? S’inscrire',
    firstTimePrompt: 'Première installation ? Lancer la configuration',
    emailPlaceholder: 'vous@teamhub.com',
    passwordPlaceholder: '••••••••',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    loading: 'Chargement...',
    search: 'Recherche...',
    close: 'Fermer',
    confirmDelete: 'Confirmer la suppression',
    areYouSure: 'Êtes-vous sûr de vouloir continuer ?',
    darkMode: 'Thème sombre',
    lightMode: 'Thème clair',
    language: 'Langue',
    arabicRtl: 'العربية (Arabe RTL)',
    french: 'Français',
    english: 'English',
    upcomingModules: 'Extensions modulaires',
    upcomingModulesDesc: 'TeamHub est pensé pour intégrer facilement de futurs modules professionnels.',
    invoicesModule: 'Factures & Devis',
    invoicesDesc: 'Générez des factures clients, suivez les encaissements et exportez les rapports.',
    filesModule: 'Fichiers & Documents',
    filesDesc: 'Espace centralisé pour les contrats, cahiers des charges et livrables.',
    chatModule: 'Messagerie & Canaux',
    chatDesc: 'Échanges en temps réel, fils de discussion et notifications d’équipe.',
    comingSoon: 'Bientôt disponible',
  },
  ar: {
    appName: 'سافران للاستشارات الإدارية (Safran)',
    tagline: 'منصة الاستشارات الإدارية والتحول المؤسسي',
    dashboard: 'لوحة التحكم',
    tasksAndProjects: 'المهام والمشاريع',
    clientsCRM: 'العملاء (CRM)',
    team: 'دليل الفريق',
    modules: 'الوحدات والتوسعات',
    signOut: 'تسجيل الخروج',
    admin: 'مسؤول النظام (Admin)',
    member: 'عضو الفريق',
    welcomeBack: 'مرحبًا بك مجددًا',
    teamOverview: 'إليك ملخص ما يحدث في مساحة العمل اليوم.',
    tasksDueThisWeek: 'مهام مستحقة هذا الأسبوع',
    overdueTasks: 'مهام متأخرة',
    activeClients: 'العملاء النشطون',
    recentActivity: 'النشاط الأخير',
    quickActions: 'إجراءات سريعة',
    newTask: 'مهمة جديدة',
    newProject: 'مشروع جديد',
    newClient: 'عميل جديد',
    noRecentActivity: 'لا يوجد نشاط مسجل حتى الآن.',
    upcomingDeadlines: 'المواعيد النهائية القادمة',
    noUpcomingDeadlines: 'لا توجد مهام مستحقة هذا الأسبوع.',
    viewAll: 'عرض الكل',
    projects: 'المشاريع',
    allProjects: 'جميع المشاريع',
    kanbanBoard: 'لوحة كانبان',
    todo: 'قيد الانتظار',
    doing: 'قيد التنفيذ',
    done: 'مكتملة',
    filterByAssignee: 'المُعيّن إليه',
    allAssignees: 'جميع الأعضاء',
    filterByPriority: 'الأولوية',
    allPriorities: 'جميع الأولويات',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    taskTitle: 'عنوان المهمة',
    taskDescription: 'الوصف',
    dueDate: 'تاريخ الاستحقاق',
    priority: 'الأولوية',
    assignee: 'المسؤول عنها',
    linkedClient: 'العميل المرتبط (اختياري)',
    none: 'لا يوجد',
    createTask: 'إنشاء مهمة',
    createProject: 'إنشاء مشروع',
    projectName: 'اسم المشروع',
    projectDescription: 'وصف المشروع',
    projectColor: 'لون التمييز',
    noTasksInColumn: 'لا توجد مهام في هذا العمود',
    dragHint: 'اسحب البطاقات لتغيير حالة المهمة',
    editTask: 'تعديل المهمة',
    deleteTask: 'حذف المهمة',
    clientDirectory: 'قائمة العملاء',
    searchClients: 'بحث بالاسم أو الشركة أو البريد...',
    filterByStatus: 'تصفية الحالة',
    allStatuses: 'جميع الحالات',
    lead: 'عميل محتمل (Lead)',
    active: 'نشط',
    closed: 'مغلق',
    name: 'الاسم',
    company: 'الشركة',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    status: 'الحالة',
    notes: 'ملاحظات',
    owner: 'المسؤول',
    actions: 'الإجراءات',
    clientDetails: 'تفاصيل العميل',
    notesHistory: 'سجل الملاحظات والتحديثات',
    addNote: 'إضافة ملاحظة',
    notePlaceholder: 'أضف ملاحظة جديدة، ملخص مكالمة أو اجتماع...',
    linkedTasks: 'المهام المرتبطة بهذا العميل',
    addLinkedTask: 'إضافة مهمة لهذا العميل',
    noNotesYet: 'لا توجد ملاحظات مسجلة لهذا العميل حتى الآن.',
    noLinkedTasksYet: 'لا توجد مهام مرتبطة بهذا العميل حاليًا.',
    createClient: 'إضافة عميل جديد',
    deleteClient: 'حذف العميل',
    teamDirectory: 'أعضاء الفريق',
    manageMembers: 'إدارة الفريق والصلاحيات',
    inviteMember: 'إضافة عضو جديد',
    role: 'الدور',
    titleJob: 'المسمى الوظيفي',
    assignedTasks: 'المهام المسندة',
    ownedClients: 'العملاء التابعين له',
    changeRole: 'تغيير الدور',
    removeMember: 'إزالة العضو',
    adminOnlyAction: 'فقط مسؤولو النظام يمكنهم تنفيذ هذا الإجراء.',
    adminBadge: 'مسؤول (صلاحيات كاملة)',
    memberBadge: 'عضو (مهامه وعملاؤه فقط)',
    memberRestrictedNotice: 'يرى الأعضاء فقط المهام المسندة إليهم والعملاء التابعين لهم.',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب جديد',
    firstTimeSetup: 'إعداد المسؤول لأول مرة',
    firstTimeSetupDesc: 'أهلاً بك في TeamHub! قم بتهيئة مساحة العمل كمسؤول رئيسي للنظام.',
    setupAdminAccount: 'إنشاء حساب المسؤول الرئيسي',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullName: 'الاسم الكامل',
    haveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
    needAccount: 'ليس لديك حساب؟ إنشاء حساب',
    firstTimePrompt: 'هل تقوم بالإعداد للمرة الأولى؟ ابدأ إعداد المسؤول',
    emailPlaceholder: 'you@teamhub.com',
    passwordPlaceholder: '••••••••',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    delete: 'حذف',
    loading: 'جاري التحميل...',
    search: 'بحث...',
    close: 'إغلاق',
    confirmDelete: 'تأكيد الحذف',
    areYouSure: 'هل أنت متأكد من المتابعة؟',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    arabicRtl: 'العربية (RTL)',
    french: 'الفرنسية (Français)',
    english: 'الإنجليزية (English)',
    upcomingModules: 'الوحدات الإضافية المجهزة',
    upcomingModulesDesc: 'تم بناء TeamHub بهيكلية مرنة تدعم إضافة وحدات الأعمال الإضافية بسهولة.',
    invoicesModule: 'الفواتير والمدفوعات',
    invoicesDesc: 'إنشاء فواتير العملاء، متابعة المستحقات وإصدار التقارير المالية.',
    filesModule: 'إدارة الملفات والمستندات',
    filesDesc: 'مستودع مركزي للعقود، كراسات الشروط ومخرجات المشاريع.',
    chatModule: 'المحادثات وقنوات الفريق',
    chatDesc: 'غرف نقاش حية للمشاريع، رسائل مباشرة وتنبيهات فورية.',
    comingSoon: 'قيد التطوير للمرحلة القادمة',
  },
};
