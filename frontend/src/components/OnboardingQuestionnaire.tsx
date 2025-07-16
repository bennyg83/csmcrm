import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  IconButton,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Alert,

  FormControlLabel,
  Checkbox,
  Switch,
  FormGroup,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Task as TaskIcon,

} from '@mui/icons-material';
import { apiService } from '../services/api';
import { Account, Contact, AccountTier, Task } from '../types';
import DocumentUpload from './DocumentUpload';

interface OnboardingQuestionnaireProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ContactData {
  name: string;
  geo: string;
  focus: string;
  kpis: string;
  other: string;
}

interface ExpansionData {
  what: string;
  steps: string;
}

interface CriticalSupportData {
  ticket: string;
  description: string;
}

interface JiraTicketData {
  ticket: string;
  description: string;
}

interface TaskData {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  assignedTo: string[];
  categoryId?: string;
  isAccountLevel: boolean;
  contactId?: string;
}

interface OnboardingData {
  // Account basic info
  accountName: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  website: string;
  
  // Additional account fields
  revenue: number;
  arr: number;
  employees: number;
  health: number;
  riskScore: number;
  renewalDate: string;
  accountManager: string;
  customerSuccessManager: string;
  salesEngineer: string;
  
  // Business use cases
  shortTermUseCase: string;
  midTermUseCase: string;
  longTermUseCase: string;
  
  // Steps to achieve
  shortTermSteps: string;
  midTermSteps: string;
  longTermSteps: string;
  
  // Technical stack
  repos: string;
  pipelines: string;
  languages: string;
  containerRepos: string;
  issueTrackers: string;
  techStack: string;
  financialMetrics: string;
  teamAssignments: string;
  
  // Contacts
  contacts: ContactData[];
  
  // Expansion possibilities
  expansions: ExpansionData[];
  
  // Critical support
  criticalSupports: CriticalSupportData[];
  
  // JIRA tickets
  jiraTickets: JiraTicketData[];

  // Tasks
  tasks: TaskData[];
}

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountTiers, setAccountTiers] = useState<AccountTier[]>([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentData, setDocumentData] = useState<any>(null);


  // Fetch account tiers when component mounts
  React.useEffect(() => {
    const fetchAccountTiers = async () => {
      try {
        const tiers = await apiService.getAccountTiers();
        setAccountTiers(tiers);
      } catch (err) {
        console.error('Error fetching account tiers:', err);
      }
    };
    fetchAccountTiers();
  }, []);
  
  const [data, setData] = useState<OnboardingData>({
    accountName: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    website: '',
    revenue: 0,
    arr: 0,
    employees: 1,
    health: 75,
    riskScore: 50,
    renewalDate: new Date().toISOString().slice(0, 10),
    accountManager: '',
    customerSuccessManager: '',
    salesEngineer: '',
    shortTermUseCase: '',
    midTermUseCase: '',
    longTermUseCase: '',
    shortTermSteps: '',
    midTermSteps: '',
    longTermSteps: '',
    repos: '',
    pipelines: '',
    languages: '',
    containerRepos: '',
    issueTrackers: '',
    techStack: '',
    financialMetrics: '',
    teamAssignments: '',
    contacts: [
      { name: '', geo: '', focus: '', kpis: '', other: '' },
      { name: '', geo: '', focus: '', kpis: '', other: '' }
    ],
    expansions: [
      { what: '', steps: '' },
      { what: '', steps: '' }
    ],
    criticalSupports: [
      { ticket: 'Ticket #000555', description: 'Problem about client…' }
    ],
    jiraTickets: [
      { ticket: 'TKA-***', description: '' },
      { ticket: 'WSH-***', description: '' },
      { ticket: 'Slack Chain***', description: '' }
    ],
    tasks: [
      { title: 'Initial onboarding call', description: 'Set up initial call with the account team', priority: 'High', dueDate: '2023-10-20', assignedTo: ['Account Manager'], isAccountLevel: true },
      { title: 'Document review', description: 'Review all onboarding documents and requirements', priority: 'Medium', dueDate: '2023-10-25', assignedTo: ['Sales Engineer'], isAccountLevel: true },
      { title: 'Technical setup', description: 'Begin technical setup for the account', priority: 'High', dueDate: '2023-10-30', assignedTo: ['Sales Engineer'], isAccountLevel: true }
    ]
  });

  const steps = [
    'Document Upload',
    'Account Information',
    'Business Use Cases',
    'Steps to Achieve',
    'Technical Stack',
    'Key Contacts',
    'Expansion Possibilities',
    'Support & Tickets',
    'Tasks',
    'Review & Submit'
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleClose = () => {
    onClose();
  };

  const handleDataChange = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentDataExtracted = (extractedData: any) => {
    setDocumentData(extractedData);
    // Auto-fill form fields with extracted data
    if (extractedData.name) handleDataChange('accountName', extractedData.name);
    if (extractedData.email) handleDataChange('email', extractedData.email);
    if (extractedData.phone) handleDataChange('phone', extractedData.phone);
    if (extractedData.address) handleDataChange('address', extractedData.address);
    if (extractedData.industry) handleDataChange('industry', extractedData.industry);
    if (extractedData.website) handleDataChange('website', extractedData.website);
    if (extractedData.revenue) handleDataChange('revenue', extractedData.revenue);
    if (extractedData.employees) handleDataChange('employees', extractedData.employees);
    if (extractedData.accountManager) handleDataChange('accountManager', extractedData.accountManager);
    if (extractedData.customerSuccessManager) handleDataChange('customerSuccessManager', extractedData.customerSuccessManager);
    if (extractedData.salesEngineer) handleDataChange('salesEngineer', extractedData.salesEngineer);
    if (extractedData.businessUseCase) handleDataChange('shortTermUseCase', extractedData.businessUseCase);
    
    // Parse tech stack into separate fields
    if (extractedData.techStack) {
      const techStackText = extractedData.techStack;
      const reposMatch = techStackText.match(/repos:\s*(.+?)(?=\s*(?:pipelines|languages|container repos|issue trackers):)/i);
      const pipelinesMatch = techStackText.match(/pipelines:\s*(.+?)(?=\s*(?:languages|container repos|issue trackers):)/i);
      const languagesMatch = techStackText.match(/languages:\s*(.+?)(?=\s*(?:container repos|issue trackers):)/i);
      const containerReposMatch = techStackText.match(/container repos:\s*(.+?)(?=\s*(?:issue trackers):)/i);
      const issueTrackersMatch = techStackText.match(/issue trackers:\s*(.+)/i);
      
      if (reposMatch) handleDataChange('repos', reposMatch[1].trim());
      if (pipelinesMatch) handleDataChange('pipelines', pipelinesMatch[1].trim());
      if (languagesMatch) handleDataChange('languages', languagesMatch[1].trim());
      if (containerReposMatch) handleDataChange('containerRepos', containerReposMatch[1].trim());
      if (issueTrackersMatch) handleDataChange('issueTrackers', issueTrackersMatch[1].trim());
      
      // Also set the combined techStack field
      handleDataChange('techStack', extractedData.techStack);
    }
    
    // Parse expansion opportunities
    if (extractedData.expansionOpportunities) {
      const expansionText = extractedData.expansionOpportunities;
      const whatMatch = expansionText.match(/what:\s*(.+?)(?=\s*steps:)/i);
      const stepsMatch = expansionText.match(/steps:\s*(.+)/i);
      
      if (whatMatch && stepsMatch) {
        setData(prev => ({
          ...prev,
          expansions: [{ what: whatMatch[1].trim(), steps: stepsMatch[1].trim() }]
        }));
      }
    }
    
    // Parse critical support
    if (extractedData.criticalSupport) {
      const supportText = extractedData.criticalSupport;
      const ticketMatch = supportText.match(/ticket:\s*(.+?)(?=\s*description:)/i);
      const descriptionMatch = supportText.match(/description:\s*(.+)/i);
      
      if (ticketMatch && descriptionMatch) {
        setData(prev => ({
          ...prev,
          criticalSupports: [{ ticket: ticketMatch[1].trim(), description: descriptionMatch[1].trim() }]
        }));
      }
    }
    
    // Parse JIRA tickets
    if (extractedData.jiraTickets) {
      const ticketsText = extractedData.jiraTickets;
      const ticketMatch = ticketsText.match(/ticket:\s*(.+?)(?=\s*description:)/i);
      const descriptionMatch = ticketsText.match(/description:\s*(.+)/i);
      
      if (ticketMatch && descriptionMatch) {
        setData(prev => ({
          ...prev,
          jiraTickets: [{ ticket: ticketMatch[1].trim(), description: descriptionMatch[1].trim() }]
        }));
      }
    }
    
    // Handle contacts if extracted
    if (extractedData.contacts && extractedData.contacts.length > 0) {
      const extractedContacts = extractedData.contacts.map((contact: any) => ({
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        geo: '',
        focus: contact.title || '',
        kpis: '',
        other: `Email: ${contact.email || ''}, Phone: ${contact.phone || ''}`
      }));
      setData(prev => ({ ...prev, contacts: extractedContacts }));
    }
    
    setShowDocumentUpload(false);
  };

  const addContact = () => {
    setData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { name: '', geo: '', focus: '', kpis: '', other: '' }]
    }));
  };

  const removeContact = (index: number) => {
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const updateContact = (index: number, field: keyof ContactData, value: string) => {
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const addExpansion = () => {
    setData(prev => ({
      ...prev,
      expansions: [...prev.expansions, { what: '', steps: '' }]
    }));
  };

  const removeExpansion = (index: number) => {
    setData(prev => ({
      ...prev,
      expansions: prev.expansions.filter((_, i) => i !== index)
    }));
  };

  const updateExpansion = (index: number, field: keyof ExpansionData, value: string) => {
    setData(prev => ({
      ...prev,
      expansions: prev.expansions.map((expansion, i) => 
        i === index ? { ...expansion, [field]: value } : expansion
      )
    }));
  };

  const addCriticalSupport = () => {
    setData(prev => ({
      ...prev,
      criticalSupports: [...prev.criticalSupports, { ticket: '', description: '' }]
    }));
  };

  const removeCriticalSupport = (index: number) => {
    setData(prev => ({
      ...prev,
      criticalSupports: prev.criticalSupports.filter((_, i) => i !== index)
    }));
  };

  const updateCriticalSupport = (index: number, field: keyof CriticalSupportData, value: string) => {
    setData(prev => ({
      ...prev,
      criticalSupports: prev.criticalSupports.map((support, i) => 
        i === index ? { ...support, [field]: value } : support
      )
    }));
  };

  const addJiraTicket = () => {
    setData(prev => ({
      ...prev,
      jiraTickets: [...prev.jiraTickets, { ticket: '', description: '' }]
    }));
  };

  const removeJiraTicket = (index: number) => {
    setData(prev => ({
      ...prev,
      jiraTickets: prev.jiraTickets.filter((_, i) => i !== index)
    }));
  };

  const updateJiraTicket = (index: number, field: keyof JiraTicketData, value: string) => {
    setData(prev => ({
      ...prev,
      jiraTickets: prev.jiraTickets.map((ticket, i) => 
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  const addTask = () => {
    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: [], isAccountLevel: true }]
    }));
  };

  const removeTask = (index: number) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const updateTask = (index: number, field: keyof TaskData, value: string | boolean | string[]) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create account with all required fields
      const accountData: Partial<Account> = {
        name: data.accountName,
        email: data.email || 'no-email@example.com', // Required field
        phone: data.phone || 'N/A', // Required field
        address: data.address || 'Address not provided', // Required field
        industry: data.industry || 'Unknown',
        website: data.website || '',
        businessUseCase: `Short-term: ${data.shortTermUseCase}\nMid-term: ${data.midTermUseCase}\nLong-term: ${data.longTermUseCase}`,
        techStack: `Repos: ${data.repos}\nPipelines: ${data.pipelines}\nLanguages: ${data.languages}\nContainer Repos: ${data.containerRepos}\nIssue Trackers: ${data.issueTrackers}`,
        description: `Steps to Achieve:\nShort-term: ${data.shortTermSteps}\nMid-term: ${data.midTermSteps}\nLong-term: ${data.longTermSteps}`,
        accountNotes: `Expansion Possibilities:\n${data.expansions.map(exp => `${exp.what}: ${exp.steps}`).join('\n')}\n\nCritical Support:\n${data.criticalSupports.map(sup => `${sup.ticket}: ${sup.description}`).join('\n')}\n\nJIRA Tickets:\n${data.jiraTickets.map(ticket => `${ticket.ticket}: ${ticket.description}`).join('\n')}`,
        // Required fields with defaults
        health: data.health || 75,
        revenue: data.revenue || 0,
        renewalDate: data.renewalDate || new Date().toISOString().slice(0, 10),
        arr: data.arr || 0,
        riskScore: data.riskScore || 50,
        accountManager: data.accountManager || 'TBD',
        customerSuccessManager: data.customerSuccessManager || 'TBD',
        salesEngineer: data.salesEngineer || 'TBD',
        tierId: accountTiers.length > 0 ? accountTiers[0].id : '', // Use first available tier
        status: 'active',
        employees: data.employees || 1
      };

      const newAccount = await apiService.createAccount(accountData);

      // Create contacts
      const contactPromises = data.contacts
        .filter(contact => contact.name.trim()) // Only create contacts with names
        .map(contact => 
          apiService.createContact(newAccount.id, {
            firstName: contact.name.split(' ')[0] || '',
            lastName: contact.name.split(' ').slice(1).join(' ') || '',
            email: '',
            phone: '',
            title: contact.focus,
            isPrimary: false,
            contactTypes: ['key_contact'],
            otherType: `Geo: ${contact.geo}, KPIs: ${contact.kpis}, Other: ${contact.other}`
          })
        );

      await Promise.all(contactPromises);

      // Create tasks
      const taskPromises = data.tasks
        .filter(task => task.title.trim()) // Only create tasks with titles
        .map(task => 
          apiService.createTask({
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
            assignedTo: task.assignedTo,
            accountId: newAccount.id,
            accountName: newAccount.name,
            categoryId: task.categoryId,
            progress: 0 // Add required progress field
          })
        );

      await Promise.all(taskPromises);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating account:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Document Upload
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Handover Document
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload a handover document (PDF, Word, or text file) to automatically extract account information and pre-fill the form.
            </Typography>
            
            {documentData ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Document processed successfully! The form has been pre-filled with extracted data.
              </Alert>
            ) : (
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setShowDocumentUpload(true)}
                sx={{ mb: 2 }}
              >
                Upload Document
              </Button>
            )}
            
            {documentData && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Extracted Data Preview:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Company: {documentData.name || 'Not found'}<br />
                    Email: {documentData.email || 'Not found'}<br />
                    Phone: {documentData.phone || 'Not found'}<br />
                    Industry: {documentData.industry || 'Not found'}<br />
                    Revenue: {documentData.revenue ? `$${documentData.revenue.toLocaleString()}` : 'Not found'}<br />
                    Employees: {documentData.employees || 'Not found'}
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {showDocumentUpload && (
              <DocumentUpload
                onDataExtracted={handleDocumentDataExtracted}
                onClose={() => setShowDocumentUpload(false)}
              />
            )}
          </Box>
        );

      case 1: // Account Information
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Account Information</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Name"
                value={data.accountName}
                onChange={(e) => handleDataChange('accountName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={data.email}
                onChange={(e) => handleDataChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={data.phone}
                onChange={(e) => handleDataChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Industry"
                value={data.industry}
                onChange={(e) => handleDataChange('industry', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={data.address}
                onChange={(e) => handleDataChange('address', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={data.website}
                onChange={(e) => handleDataChange('website', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Financial & Business Information</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Revenue"
                type="number"
                value={data.revenue}
                onChange={(e) => handleDataChange('revenue', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ARR (Annual Recurring Revenue)"
                type="number"
                value={data.arr}
                onChange={(e) => handleDataChange('arr', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Employees"
                type="number"
                value={data.employees}
                onChange={(e) => handleDataChange('employees', parseInt(e.target.value) || 1)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Health Score (0-100)"
                type="number"
                value={data.health}
                onChange={(e) => handleDataChange('health', parseInt(e.target.value) || 75)}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Risk Score (0-100)"
                type="number"
                value={data.riskScore}
                onChange={(e) => handleDataChange('riskScore', parseInt(e.target.value) || 50)}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Renewal Date"
                type="date"
                value={data.renewalDate}
                onChange={(e) => handleDataChange('renewalDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Team Assignment</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Account Manager"
                value={data.accountManager}
                onChange={(e) => handleDataChange('accountManager', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Customer Success Manager"
                value={data.customerSuccessManager}
                onChange={(e) => handleDataChange('customerSuccessManager', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sales Engineer"
                value={data.salesEngineer}
                onChange={(e) => handleDataChange('salesEngineer', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 2: // Business Use Cases
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Business Use Case With Mend and Challenges</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Short-term"
                multiline
                rows={3}
                value={data.shortTermUseCase}
                onChange={(e) => handleDataChange('shortTermUseCase', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mid-term (if different from above)"
                multiline
                rows={3}
                value={data.midTermUseCase}
                onChange={(e) => handleDataChange('midTermUseCase', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Long-term (if different from above)"
                multiline
                rows={3}
                value={data.longTermUseCase}
                onChange={(e) => handleDataChange('longTermUseCase', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 3: // Steps to Achieve
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Steps to Achieve</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Short Term"
                multiline
                rows={3}
                value={data.shortTermSteps}
                onChange={(e) => handleDataChange('shortTermSteps', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mid-term"
                multiline
                rows={3}
                value={data.midTermSteps}
                onChange={(e) => handleDataChange('midTermSteps', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Longer-term (if needed)"
                multiline
                rows={3}
                value={data.longTermSteps}
                onChange={(e) => handleDataChange('longTermSteps', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 4: // Technical Stack
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Technical Stack</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Repo(s)"
                value={data.repos}
                onChange={(e) => handleDataChange('repos', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pipelines"
                value={data.pipelines}
                onChange={(e) => handleDataChange('pipelines', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Languages / Package Managers"
                value={data.languages}
                onChange={(e) => handleDataChange('languages', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Container Repos?"
                value={data.containerRepos}
                onChange={(e) => handleDataChange('containerRepos', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issue Trackers?"
                value={data.issueTrackers}
                onChange={(e) => handleDataChange('issueTrackers', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complete Tech Stack Summary"
                value={data.techStack}
                onChange={(e) => handleDataChange('techStack', e.target.value)}
                multiline
                rows={3}
                helperText="Combined technical infrastructure information"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Financial Metrics"
                value={data.financialMetrics}
                onChange={(e) => handleDataChange('financialMetrics', e.target.value)}
                multiline
                rows={3}
                helperText="Revenue, ARR, and other financial information"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Team Assignments"
                value={data.teamAssignments}
                onChange={(e) => handleDataChange('teamAssignments', e.target.value)}
                multiline
                rows={3}
                helperText="Account manager, CSM, and sales engineer assignments"
              />
            </Grid>
          </Grid>
        );

      case 5: // Key Contacts
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Key contact(s) who you regularly meet with</Typography>
            </Grid>
            {data.contacts.map((contact, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Contact {index + 1}</Typography>
                      {data.contacts.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeContact(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Geo"
                          value={contact.geo}
                          onChange={(e) => updateContact(index, 'geo', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Focus"
                          value={contact.focus}
                          onChange={(e) => updateContact(index, 'focus', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="KPIs"
                          value={contact.kpis}
                          onChange={(e) => updateContact(index, 'kpis', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Other: Something interesting about them to talk about"
                          multiline
                          rows={2}
                          value={contact.other}
                          onChange={(e) => updateContact(index, 'other', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addContact}
                variant="outlined"
              >
                Add More Contact
              </Button>
            </Grid>
          </Grid>
        );

      case 6: // Expansion Possibilities
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Expansion / Growth Possibilities</Typography>
            </Grid>
            {data.expansions.map((expansion, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Expansion {index + 1}</Typography>
                      {data.expansions.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeExpansion(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="What"
                          value={expansion.what}
                          onChange={(e) => updateExpansion(index, 'what', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="What steps"
                          multiline
                          rows={2}
                          value={expansion.steps}
                          onChange={(e) => updateExpansion(index, 'steps', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addExpansion}
                variant="outlined"
              >
                Add More Expansion
              </Button>
            </Grid>
          </Grid>
        );

      case 7: // Support & Tickets
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Critical Support & JIRA Tickets</Typography>
            </Grid>
            
            {/* Critical Support */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Critical Support (clickable) / Challenges</Typography>
            </Grid>
            {data.criticalSupports.map((support, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2">Support {index + 1}</Typography>
                      {data.criticalSupports.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeCriticalSupport(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Ticket"
                          value={support.ticket}
                          onChange={(e) => updateCriticalSupport(index, 'ticket', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={3}
                          value={support.description}
                          onChange={(e) => updateCriticalSupport(index, 'description', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addCriticalSupport}
                variant="outlined"
              >
                Add More Support Ticket
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* JIRA Tickets */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>JIRA Tickets or Slack Chains</Typography>
            </Grid>
            {data.jiraTickets.map((ticket, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2">Ticket {index + 1}</Typography>
                      {data.jiraTickets.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeJiraTicket(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Ticket"
                          value={ticket.ticket}
                          onChange={(e) => updateJiraTicket(index, 'ticket', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={ticket.description}
                          onChange={(e) => updateJiraTicket(index, 'description', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addJiraTicket}
                variant="outlined"
              >
                Add More JIRA Ticket
              </Button>
            </Grid>
          </Grid>
        );

      case 8: // Tasks
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Tasks</Typography>
            </Grid>
            {data.tasks.map((task, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Task {index + 1}</Typography>
                      {data.tasks.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeTask(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Title"
                          value={task.title}
                          onChange={(e) => updateTask(index, 'title', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={task.priority}
                            onChange={(e) => updateTask(index, 'priority', e.target.value as 'Low' | 'Medium' | 'High')}
                            label="Priority"
                          >
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={2}
                          value={task.description}
                          onChange={(e) => updateTask(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Due Date"
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.isAccountLevel}
                                onChange={(e) => updateTask(index, 'isAccountLevel', e.target.checked)}
                              />
                            }
                            label="Is Account Level Task"
                          />
                        </FormGroup>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Assigned To (comma-separated)"
                          value={task.assignedTo.join(', ')}
                          onChange={(e) => updateTask(index, 'assignedTo', e.target.value.split(',').map(s => s.trim()))}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addTask}
                variant="outlined"
              >
                Add More Task
              </Button>
            </Grid>
          </Grid>
        );

      case 9: // Review & Submit
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Review Information</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Account Information</Typography>
                  <Typography><strong>Name:</strong> {data.accountName}</Typography>
                  <Typography><strong>Email:</strong> {data.email}</Typography>
                  <Typography><strong>Phone:</strong> {data.phone}</Typography>
                  <Typography><strong>Address:</strong> {data.address}</Typography>
                  <Typography><strong>Industry:</strong> {data.industry}</Typography>
                  <Typography><strong>Website:</strong> {data.website}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Business Use Cases</Typography>
                  <Typography><strong>Short-term:</strong> {data.shortTermUseCase}</Typography>
                  <Typography><strong>Mid-term:</strong> {data.midTermUseCase}</Typography>
                  <Typography><strong>Long-term:</strong> {data.longTermUseCase}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Technical Stack</Typography>
                  <Typography><strong>Repos:</strong> {data.repos}</Typography>
                  <Typography><strong>Pipelines:</strong> {data.pipelines}</Typography>
                  <Typography><strong>Languages:</strong> {data.languages}</Typography>
                  <Typography><strong>Container Repos:</strong> {data.containerRepos}</Typography>
                  <Typography><strong>Issue Trackers:</strong> {data.issueTrackers}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Contacts ({data.contacts.filter(c => c.name.trim()).length})</Typography>
                  {data.contacts.filter(c => c.name.trim()).map((contact, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography><strong>{contact.name}</strong> - {contact.focus}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Geo: {contact.geo} | KPIs: {contact.kpis}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Tasks ({data.tasks.filter(t => t.title.trim()).length})</Typography>
                  {data.tasks.filter(t => t.title.trim()).map((task, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography><strong>{task.title}</strong> - Priority: {task.priority}, Due: {task.dueDate}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Assigned to: {task.assignedTo.join(', ')}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>New Account Onboarding</Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ overflow: 'hidden' }}>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        <Box sx={{ height: 'calc(100% - 120px)', overflow: 'auto' }}>
          {renderStepContent()}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !data.accountName.trim()}
            startIcon={<SaveIcon />}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingQuestionnaire; 