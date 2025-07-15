// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
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
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  assignedTo: string | string[];
  assignedToClient?: string | string[];
  accountId: string;
  accountName: string;
  subTasks: SubTask[];
  dependencies: string[];
  isDependent: boolean;
  progress: number;
  createdAt: string;
  updatedAt: string;
  account?: Account;
}

// Note types
export interface Note {
  id: string;
  accountId: string;
  contactId?: string;
  content: string;
  author: string;
  type: 'general' | 'meeting' | 'call' | 'email';
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  contact?: Contact;
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