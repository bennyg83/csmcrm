// User types
export interface User {
  id: string;
  email: string;
  name: string;
  /** Portal/external user display name parts */
  firstName?: string;
  lastName?: string;
  /** Portal: account display name */
  accountName?: string;
  role?: string; // New RBAC role
  legacyRole?: 'admin' | 'user' | 'manager' | 'sales' | 'support'; // Legacy role for backward compatibility
  isGoogleUser: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Account types
export interface AccountTier {
  id: string;
  name: string;
  description?: string;
  slaHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  industry?: string;
  website?: string;
  description?: string;
  businessUseCase: string;
  techStack: string;
  health: number;
  revenue: number;
  renewalDate: string;
  arr: number;
  riskScore: number;
  lastTouchpoint?: string;
  nextScheduled?: string;
  accountManager: string;
  customerSuccessManager: string;
  salesEngineer: string;
  tierId: string;
  status: 'active' | 'at-risk' | 'inactive';
  employees: number;
  accountNotes?: string;
  createdAt: string;
  updatedAt: string;
  tier?: AccountTier;
  contacts?: Contact[];
  tasks?: Task[];
  notes?: Note[];
  healthScores?: HealthScore[];
  activities?: AccountActivity[];
}

// Contact types
export interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title?: string;
  isPrimary: boolean;
  contactTypes?: string[];
  otherType?: string;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  notes?: Note[];
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task types
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  assignedTo: string | string[];
  assignedToClient?: string | string[];
  accountId: string;
  accountName: string;
  subTasks: SubTask[];
  dependencies: string[];
  isDependent: boolean;
  tags?: string[];
  categoryId?: string;
  category?: Category;
  projectId?: string;
  milestoneId?: string;
  /** Optional task type for touchpoint cadence (e.g. call, meeting). Extensible. */
  taskType?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  account?: Account;
}

/** Task type options for touchpoint cadence (call, meeting, etc.). Extensible over time. */
export const TASK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '—' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
];

// Note types
export interface Note {
  id: string;
  accountId: string;
  content: string;
  author: string;
  type: 'general' | 'meeting' | 'call' | 'email';
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  contacts?: Contact[];
}

// Health Score types
export interface HealthScore {
  id: string;
  accountId: string;
  score: number;
  factors: string[];
  date: string;
  createdAt: string;
  account?: Account;
}

// Account Activity types
export interface AccountActivity {
  id: string;
  accountId: string;
  type: string;
  description: string;
  date: string;
  createdAt: string;
  account?: Account;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardMetrics {
  totalAccounts: number;
  totalTasks: number;
  totalRevenue: number;
  activeAccounts: number;
  atRiskAccounts: number;
  averageHealthScore: number;
  recentActivities: AccountActivity[];
}

export interface CSMWorkloadItem {
  customerSuccessManager: string;
  accounts: number;
  atRisk: number;
  overdueTasks: number;
  renewals90d: number;
}

export interface Template {
  id: string;
  name: string;
  body: string;
  type: 'email' | 'note';
  createdAt: string;
  updatedAt: string;
}

export type EntityFileOwnerType = 'task' | 'project' | 'account';

export interface EntityFileWithSource {
  id: string;
  originalName: string;
  mimeType?: string;
  size: number;
  createdAt: string;
  source: EntityFileOwnerType;
  sourceId: string;
  sourceName?: string;
  visibleToChildren?: boolean;
} 