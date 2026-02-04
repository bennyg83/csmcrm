import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Account, 
  Contact, 
  Task, 
  Note, 
  AccountTier,
  AccountActivity,
  Category,
  LoginResponse,
  ApiResponse,
  DashboardMetrics,
  HealthScore
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // GitHub Pages: VITE_API_BASE_URL (Tailscale Funnel URL, no trailing slash); we append /api. Fallback: VITE_API_URL or localhost.
    let baseURL = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '').trim();
    if (baseURL && !baseURL.endsWith('/api')) baseURL = baseURL.replace(/\/$/, '') + '/api';
    if (!baseURL) baseURL = 'http://localhost:3004/api';

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token (optional for testing)
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling (without redirects for testing)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log errors but don't redirect for testing
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string, type: 'internal' | 'external' = 'internal'): Promise<LoginResponse> {
    const endpoint = type === 'external' ? '/external/auth/login' : '/auth/login';
    const response: AxiosResponse<LoginResponse> = await this.api.post(endpoint, {
      email,
      password
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  // Generic GET method for direct API calls
  async get(endpoint: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(endpoint);
    return response;
  }

  async getMe(): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/me');
    return response.data.user;
  }

  async getAllUsers(): Promise<User[]> {
    // Use public endpoint for development/testing
    const response: AxiosResponse<User[]> = await this.api.get('/auth/users/public');
    return response.data;
  }

  // User Management (Admin only)
  async createUser(userData: { name: string; email: string; role: string; password?: string }): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/auth/users', userData);
    return response.data;
  }

  async updateUser(userId: string, userData: Partial<{ name: string; email: string; role: string; password: string }>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put(`/auth/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.api.delete(`/auth/users/${userId}`);
  }

  async getUsers(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/auth/users/public');
    return response.data;
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    const response: AxiosResponse<Account[]> = await this.api.get('/accounts');
    return response.data;
  }

  async getAccount(id: string): Promise<Account> {
    const response: AxiosResponse<Account> = await this.api.get(`/accounts/${id}`);
    return response.data;
  }

  async createAccount(account: Partial<Account>): Promise<Account> {
    const response: AxiosResponse<Account> = await this.api.post('/accounts', account);
    return response.data;
  }

  async updateAccount(id: string, account: Partial<Account>): Promise<Account> {
    const response: AxiosResponse<Account> = await this.api.patch(`/accounts/${id}`, account);
    return response.data;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.api.delete(`/accounts/${id}`);
  }

  // Bulk Account Operations
  async bulkUpdateAccounts(accountIds: string[], updates: Partial<Account>): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/accounts/bulk/update', {
      accountIds,
      updates
    });
    return response.data;
  }

  async bulkDeleteAccounts(accountIds: string[]): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/accounts/bulk/delete', {
      accountIds
    });
    return response.data;
  }

  async bulkExportAccounts(accountIds?: string[], format: 'json' | 'csv' = 'json'): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/accounts/bulk/export', {
      accountIds,
      format
    });
    return response.data;
  }

  async bulkImportAccounts(accounts: Partial<Account>[]): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/accounts/bulk/import', {
      accounts
    });
    return response.data;
  }

  async getRecentActivities(): Promise<AccountActivity[]> {
    const response: AxiosResponse<AccountActivity[]> = await this.api.get('/accounts/recent-activities');
    return response.data;
  }

  // Projects (workflow / PM module)
  async getProjects(accountId?: string): Promise<any[]> {
    const url = accountId ? `/projects?accountId=${accountId}` : '/projects';
    const response: AxiosResponse<any[]> = await this.api.get(url);
    return response.data;
  }

  async getProject(id: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: { accountId: string; type: string; name: string; description?: string; status?: string; startDate?: string; targetDate?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<{ name: string; description: string; status: string; startDate: string; targetDate: string }>): Promise<any> {
    const response: AxiosResponse<any> = await this.api.patch(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/projects/${id}`);
  }

  async getProjectMilestones(projectId: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/projects/${projectId}/milestones`);
    return response.data;
  }

  async createMilestone(projectId: string, data: { name: string; deliverable?: string; dueDate: string; status?: string; sortOrder?: number }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/projects/${projectId}/milestones`, data);
    return response.data;
  }

  async updateMilestone(id: string, data: Partial<{ name: string; deliverable: string; dueDate: string; status: string; sortOrder: number }>): Promise<any> {
    const response: AxiosResponse<any> = await this.api.patch(`/milestones/${id}`, data);
    return response.data;
  }

  async deleteMilestone(id: string): Promise<void> {
    await this.api.delete(`/milestones/${id}`);
  }

  async getProjectContacts(projectId: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/projects/${projectId}/contacts`);
    return response.data;
  }

  async getProjectContactsByContact(contactId: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/project-contacts', { params: { contactId } });
    return response.data;
  }

  async addProjectContact(projectId: string, data: { contactId?: string; userId?: string; role?: string; notes?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/projects/${projectId}/contacts`, data);
    return response.data;
  }

  // Contacts
  async getContacts(accountId: string): Promise<Contact[]> {
    const response: AxiosResponse<Contact[]> = await this.api.get(`/accounts/${accountId}/contacts`);
    return response.data;
  }

  async getContact(accountId: string, contactId: string): Promise<Contact> {
    const response: AxiosResponse<Contact> = await this.api.get(`/accounts/${accountId}/contacts/${contactId}`);
    return response.data;
  }

  async createContact(accountId: string, contact: Partial<Contact>): Promise<Contact> {
    const response: AxiosResponse<Contact> = await this.api.post(`/accounts/${accountId}/contacts`, contact);
    return response.data;
  }

  async updateContact(accountId: string, contactId: string, contact: Partial<Contact>): Promise<Contact> {
    const response: AxiosResponse<Contact> = await this.api.patch(`/accounts/${accountId}/contacts/${contactId}`, contact);
    return response.data;
  }

  async deleteContact(accountId: string, contactId: string): Promise<void> {
    await this.api.delete(`/accounts/${accountId}/contacts/${contactId}`);
  }

  // Tasks
  async getTasks(params?: { projectId?: string; milestoneId?: string; tags?: string }): Promise<Task[]> {
    const sp = new URLSearchParams();
    if (params?.projectId) sp.set('projectId', params.projectId);
    if (params?.milestoneId) sp.set('milestoneId', params.milestoneId);
    if (params?.tags) sp.set('tags', params.tags);
    const q = sp.toString();
    const response: AxiosResponse<Task[]> = await this.api.get(q ? `/tasks?${q}` : '/tasks');
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(task: Partial<Task> & { createCalendarEvent?: boolean }): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.post('/tasks', task);
    return response.data;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.patch(`/tasks/${id}`, task);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/tasks/${id}`);
  }

  // Entity files (task / project / account attachments with hierarchy)
  async getEntityFiles(entityType: 'task' | 'project' | 'account', entityId: string): Promise<import('../types').EntityFileWithSource[]> {
    const response = await this.api.get('/entity-files', { params: { entityType, entityId } });
    return response.data;
  }

  async uploadEntityFile(
    entityType: 'task' | 'project' | 'account',
    entityId: string,
    file: File,
    visibleToChildren?: boolean
  ): Promise<import('../types').EntityFileWithSource> {
    const form = new FormData();
    form.append('file', file);
    form.append('entityType', entityType);
    form.append('entityId', entityId);
    if (visibleToChildren !== undefined) {
      form.append('visibleToChildren', String(visibleToChildren));
    }
    const response = await this.api.post('/entity-files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async downloadEntityFile(id: string): Promise<Blob> {
    const response = await this.api.get(`/entity-files/${id}/download`, { responseType: 'blob' });
    return response.data;
  }

  async deleteEntityFile(id: string): Promise<void> {
    await this.api.delete(`/entity-files/${id}`);
  }

  // Settings (Admin only)
  async getAccountTiers(): Promise<AccountTier[]> {
    const response: AxiosResponse<AccountTier[]> = await this.api.get('/account-tiers');
    return response.data;
  }

  async createAccountTier(tier: Partial<AccountTier>): Promise<AccountTier> {
    const response: AxiosResponse<AccountTier> = await this.api.post('/account-tiers', tier);
    return response.data;
  }

  async updateAccountTier(id: string, tier: Partial<AccountTier>): Promise<AccountTier> {
    const response: AxiosResponse<AccountTier> = await this.api.patch(`/account-tiers/${id}`, tier);
    return response.data;
  }

  async deleteAccountTier(id: string): Promise<void> {
    await this.api.delete(`/account-tiers/${id}`);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> = await this.api.get('/categories');
    return response.data;
  }

  async getCategory(id: string): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.get(`/categories/${id}`);
    return response.data;
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.post('/categories', category);
    return response.data;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.patch(`/categories/${id}`, category);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Notes (support contactIds for many-to-many with contacts)
  async getNotes(params?: { accountId?: string; contactId?: string }): Promise<Note[]> {
    const sp = new URLSearchParams();
    if (params?.accountId) sp.set('accountId', params.accountId);
    if (params?.contactId) sp.set('contactId', params.contactId);
    const q = sp.toString();
    const response: AxiosResponse<Note[]> = await this.api.get(q ? `/notes?${q}` : '/notes');
    return response.data;
  }

  async getAllNotes(): Promise<Note[]> {
    return this.getNotes();
  }

  async getNote(id: string): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.get(`/notes/${id}`);
    return response.data;
  }

  async createNote(accountId: string, note: Partial<Note> & { contactIds?: string[] }): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.post(`/accounts/${accountId}/notes`, note);
    return response.data;
  }

  async updateNote(id: string, note: Partial<Note> & { contactIds?: string[] }): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.patch(`/notes/${id}`, note);
    return response.data;
  }

  async deleteNote(id: string): Promise<void> {
    await this.api.delete(`/notes/${id}`);
  }

  // Health Scores
  async getAllHealthScores(): Promise<HealthScore[]> {
    const response: AxiosResponse<HealthScore[]> = await this.api.get('/health-scores');
    return response.data;
  }

  async getHealthScore(id: string): Promise<HealthScore> {
    const response: AxiosResponse<HealthScore> = await this.api.get(`/health-scores/${id}`);
    return response.data;
  }

  async createHealthScore(accountId: string, healthScore: Partial<HealthScore>): Promise<HealthScore> {
    const response: AxiosResponse<HealthScore> = await this.api.post(`/accounts/${accountId}/health-scores`, healthScore);
    return response.data;
  }

  async updateHealthScore(id: string, healthScore: Partial<HealthScore>): Promise<HealthScore> {
    const response: AxiosResponse<HealthScore> = await this.api.patch(`/health-scores/${id}`, healthScore);
    return response.data;
  }

  async deleteHealthScore(id: string): Promise<void> {
    await this.api.delete(`/health-scores/${id}`);
  }

  // Account Activities
  async getAllAccountActivities(): Promise<AccountActivity[]> {
    const response: AxiosResponse<AccountActivity[]> = await this.api.get('/account-activities');
    return response.data;
  }

  async getAccountActivity(id: string): Promise<AccountActivity> {
    const response: AxiosResponse<AccountActivity> = await this.api.get(`/account-activities/${id}`);
    return response.data;
  }

  async createAccountActivity(accountId: string, activity: Partial<AccountActivity>): Promise<AccountActivity> {
    const response: AxiosResponse<AccountActivity> = await this.api.post(`/accounts/${accountId}/activities`, activity);
    return response.data;
  }

  async updateAccountActivity(id: string, activity: Partial<AccountActivity>): Promise<AccountActivity> {
    const response: AxiosResponse<AccountActivity> = await this.api.patch(`/account-activities/${id}`, activity);
    return response.data;
  }

  async deleteAccountActivity(id: string): Promise<void> {
    await this.api.delete(`/account-activities/${id}`);
  }

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response: AxiosResponse<DashboardMetrics> = await this.api.get('/dashboard/metrics');
    return response.data;
  }

  // Document Processing
  async processHandoverDocument(formData: FormData): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/documents/process-handover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadDocument(formData: FormData): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getLLMStatus(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/documents/llm-status');
    return response.data;
  }

  // Gmail Integration
  async getRecentEmails(limit: number = 20, query?: string, preview: boolean = false): Promise<any> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (query) {
      params.append('q', query);
    }
    if (preview) {
      params.append('preview', 'true');
    }
    const response: AxiosResponse<any> = await this.api.get(`/gmail/emails?${params.toString()}`);
    return response.data;
  }

  async getEmailById(emailId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/gmail/emails/${emailId}`);
    return response.data;
  }

  async sendEmail(emailData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/gmail/emails/send', emailData);
    return response.data;
  }

  async replyToEmail(emailId: string, body: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/gmail/emails/${emailId}/reply`, { body });
    return response.data;
  }

  async searchEmails(query: string, limit: number = 10): Promise<any> {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('limit', limit.toString());
    const response: AxiosResponse<any> = await this.api.get(`/gmail/search?${params.toString()}`);
    return response.data;
  }

  async discoverContacts(maxEmails: number = 50): Promise<any> {
    const params = new URLSearchParams();
    params.append('maxEmails', maxEmails.toString());
    const response: AxiosResponse<any> = await this.api.get(`/gmail/contacts/discover?${params.toString()}`);
    return response.data;
  }

  async getGmailLabels(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/gmail/labels');
    return response.data;
  }

  // Email-Contact Integration
  async syncEmailsWithContacts(maxEmails: number = 20): Promise<any> {
    const params = new URLSearchParams();
    params.append('maxEmails', maxEmails.toString());
    const response: AxiosResponse<any> = await this.api.post(`/gmail/sync?${params.toString()}`);
    return response.data;
  }

  async debugEmailSync(maxEmails: number = 10): Promise<any> {
    const params = new URLSearchParams();
    params.append('maxEmails', maxEmails.toString());
    const response: AxiosResponse<any> = await this.api.post(`/gmail/debug-sync?${params.toString()}`);
    return response.data;
  }

  async debugContactInfo(contactId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/gmail/debug/contacts/${contactId}`);
    return response.data;
  }

  async getContactEmails(contactId: string, limit: number = 20): Promise<any> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const response: AxiosResponse<any> = await this.api.get(`/gmail/contacts/${contactId}/emails?${params.toString()}`);
    return response.data;
  }

  async getAccountEmails(accountId: string, limit: number = 50): Promise<any> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const response: AxiosResponse<any> = await this.api.get(`/gmail/accounts/${accountId}/emails?${params.toString()}`);
    return response.data;
  }

  async getAccountEmailSummary(accountId: string, days: number = 30): Promise<any> {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    const response: AxiosResponse<any> = await this.api.get(`/gmail/accounts/${accountId}/email-summary?${params.toString()}`);
    return response.data;
  }

  async sendEmailToContact(contactId: string, emailData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/gmail/contacts/${contactId}/send`, emailData);
    return response.data;
  }

  async markEmailAsRead(emailId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.patch(`/gmail/emails/${emailId}/read`);
    return response.data;
  }

  // Calendar Integration
  async checkCalendarConnection(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/calendar/status');
    return response.data;
  }

  async getCalendarEvents(timeMin?: string, timeMax?: string, maxResults?: number): Promise<any> {
    const params = new URLSearchParams();
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);
    if (maxResults) params.append('maxResults', maxResults.toString());
    
    const response: AxiosResponse<any> = await this.api.get(`/calendar/events?${params.toString()}`);
    return response.data;
  }

  async createCalendarEvent(eventData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/calendar/events', eventData);
    return response.data;
  }

  async updateCalendarEvent(eventId: string, eventData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/calendar/events/${eventId}`, eventData);
    return response.data;
  }

  async deleteCalendarEvent(eventId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.delete(`/calendar/events/${eventId}`);
    return response.data;
  }

  async getCalendarList(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/calendar/calendars');
    return response.data;
  }

  // Lead Management
  async getLeads(params?: { page?: number; limit?: number; status?: string; type?: string; priority?: string; assignedTo?: string; accountId?: string; search?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const response: AxiosResponse<any> = await this.api.get(`/leads?${queryParams.toString()}`);
    return response.data;
  }

  async getLead(id: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/leads/${id}`);
    return response.data;
  }

  async createLead(leadData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/leads', leadData);
    return response.data;
  }

  async updateLead(id: string, leadData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/leads/${id}`, leadData);
    return response.data;
  }

  async deleteLead(id: string): Promise<void> {
    await this.api.delete(`/leads/${id}`);
  }

  async getLeadStats(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/leads/stats');
    return response.data;
  }

  async addLeadNote(id: string, content: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/leads/${id}/notes`, { content });
    return response.data;
  }

  async addLeadActivity(id: string, activityData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/leads/${id}/activities`, activityData);
    return response.data;
  }

  // Workflow Management
  async getWorkflows(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/workflows');
    return response.data;
  }

  async getWorkflow(id: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/workflows/${id}`);
    return response.data;
  }

  async createWorkflow(workflowData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/workflows', workflowData);
    return response.data;
  }

  async updateWorkflow(id: string, workflowData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/workflows/${id}`, workflowData);
    return response.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.api.delete(`/workflows/${id}`);
  }

  async toggleWorkflow(id: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.patch(`/workflows/${id}/toggle`);
    return response.data;
  }

  async getWorkflowStats(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/workflows/stats');
    return response.data;
  }

  async testWorkflow(id: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/workflows/${id}/test`);
    return response.data;
  }

  // Report Management
  async getReports(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/reports');
    return response.data;
  }

  async getReport(id: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/reports/${id}`);
    return response.data;
  }

  async createReport(reportData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/reports', reportData);
    return response.data;
  }

  async updateReport(id: string, reportData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/reports/${id}`, reportData);
    return response.data;
  }

  async deleteReport(id: string): Promise<void> {
    await this.api.delete(`/reports/${id}`);
  }

  async executeReport(id: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/reports/${id}/execute`);
    return response.data;
  }

  async getReportTemplates(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/reports/templates');
    return response.data;
  }

  // RBAC Methods
  async getRBACRoles(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/rbac/roles');
    return response.data;
  }

  async getRBACPermissions(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get('/rbac/permissions');
    return response.data;
  }

  async createRBACRole(roleData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/rbac/roles', roleData);
    return response.data;
  }

  async updateRBACRole(roleId: string, roleData: any): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/rbac/roles/${roleId}`, roleData);
    return response.data;
  }

  async deleteRBACRole(roleId: string): Promise<void> {
    await this.api.delete(`/rbac/roles/${roleId}`);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/rbac/assign-role', { userId, roleId });
    return response.data;
  }

  async initializeRBAC(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/rbac/initialize');
    return response.data;
  }

  // External User Management
  async createExternalUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    accountId: string;
    contactId?: string;
    phone?: string;
    role?: string;
    notes?: string;
  }): Promise<{ message: string; user: any; tempPassword: string }> {
    const response: AxiosResponse<{ message: string; user: any; tempPassword: string }> = await this.api.post('/external/auth/create-user', userData);
    return response.data;
  }

  async getExternalUsers(accountId: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/external/auth/users/${accountId}`);
    return response.data;
  }

  async resendPasswordReset(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/external/auth/forgot-password', { email });
    return response.data;
  }

  async revokeExternalUser(externalUserId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/external/auth/users/${externalUserId}`);
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.api.post('/external/auth/reset-password', {
      token,
      newPassword
    });
  }
}

export const apiService = new ApiService();
export default apiService; 