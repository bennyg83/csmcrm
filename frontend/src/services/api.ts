import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Account, 
  Contact, 
  Task, 
  Note, 
  AccountTier,
  AccountActivity,
  LoginResponse,
  ApiResponse,
  DashboardMetrics,
  HealthScore
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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

  // Authentication (mock for testing)
  async login(email: string, password: string): Promise<LoginResponse> {
    // Mock response for testing
    return {
      token: 'mock-token',
      user: {
        id: '1',
        name: 'Test Admin',
        email: 'admin@crm.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  async logout(): Promise<void> {
    // Mock logout for testing
    console.log('Mock logout');
  }

  async getMe(): Promise<User> {
    // Mock user for testing
    return {
      id: '1',
      name: 'Test Admin',
      email: 'admin@crm.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getAllUsers(): Promise<User[]> {
    // Use public endpoint for development/testing
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

  async getRecentActivities(): Promise<AccountActivity[]> {
    const response: AxiosResponse<AccountActivity[]> = await this.api.get('/accounts/recent-activities');
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
  async getTasks(): Promise<Task[]> {
    const response: AxiosResponse<Task[]> = await this.api.get('/tasks');
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(task: Partial<Task>): Promise<Task> {
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

  // Notes
  async getAllNotes(): Promise<Note[]> {
    const response: AxiosResponse<Note[]> = await this.api.get('/notes');
    return response.data;
  }

  async getNote(id: string): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.get(`/notes/${id}`);
    return response.data;
  }

  async createNote(accountId: string, note: Partial<Note>): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.post(`/accounts/${accountId}/notes`, note);
    return response.data;
  }

  async updateNote(id: string, note: Partial<Note>): Promise<Note> {
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
}

export const apiService = new ApiService();
export default apiService; 