export type UserRole = 'admin' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: ProjectStatus;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail?: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  clientId?: string;
  clientName?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ClientStatus = 'lead' | 'active' | 'closed';

export interface Client {
  id: string;
  name: string;
  company: string;
  phone?: string;
  email?: string;
  status: ClientStatus;
  notes?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  userName: string;
  targetId?: string;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'Office'
  | 'Software'
  | 'Travel'
  | 'Marketing'
  | 'Contractor'
  | 'Legal'
  | 'Other';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  recordedBy: string;
  recorderName: string;
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  folder: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  url: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
}

export type PresentationType = 'pdf' | 'pptx' | 'images' | 'canva';

export interface PresentationVersion {
  versionNumber: number;
  fileUrl: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
  notes?: string;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  category: string; // 'Clients' | 'Internal' | 'Training' | 'Proposals'
  type: PresentationType;
  fileUrl?: string; // PDF data or URL
  thumbnailUrl?: string;
  canvaUrl?: string;
  version: number;
  versions?: PresentationVersion[];
  slideCount?: number;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  tags?: string[];
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
  updatedAt?: string;
}

export type ChannelType = 'general' | 'project' | 'direct';

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  projectId?: string;
  members?: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'message' | 'invoice' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  targetId?: string;
  details: string;
  userId: string;
  userName: string;
  userRole: string;
  createdAt: string;
}

export type LanguageCode = 'en' | 'fr' | 'ar';
