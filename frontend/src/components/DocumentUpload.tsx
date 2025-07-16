import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  AutoAwesome as LLMIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { Account } from '../types';

interface ParsedAccountData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  website?: string;
  description?: string;
  businessUseCase?: string;
  techStack?: string;
  revenue?: number;
  employees?: number;
  accountManager?: string;
  customerSuccessManager?: string;
  salesEngineer?: string;
  renewalDate?: string;
  accountNotes?: string;
  contacts?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    title?: string;
    isPrimary?: boolean;
  }>;
}

interface DocumentUploadProps {
  onDataExtracted: (data: ParsedAccountData) => void;
  onClose: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDataExtracted, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedAccountData | null>(null);
  const [llmStatus, setLlmStatus] = useState<{
    available: boolean;
    models: string[];
    endpoint: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check LLM status on component mount
  React.useEffect(() => {
    checkLLMStatus();
  }, []);

  const checkLLMStatus = async () => {
    try {
      const response = await apiService.getLLMStatus();
      setLlmStatus(response);
    } catch (error) {
      console.error('Failed to check LLM status:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      setParsedData(null);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setSuccess(null);
      setParsedData(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const processDocument = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await apiService.processHandoverDocument(formData);
      
      if (response.success) {
        setParsedData(response.data);
        setSuccess('Document processed successfully! Review the extracted data below.');
        setShowPreview(true);
      } else {
        setError('Failed to process document');
      }
    } catch (error) {
      console.error('Document processing error:', error);
      setError('Failed to process document. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUseData = () => {
    if (parsedData) {
      onDataExtracted(parsedData);
      onClose();
    }
  };

  const handleEditData = (field: keyof ParsedAccountData, value: any) => {
    if (parsedData) {
      setParsedData({
        ...parsedData,
        [field]: value
      });
    }
  };

  const handleEditContact = (index: number, field: string, value: any) => {
    if (parsedData?.contacts) {
      const updatedContacts = [...parsedData.contacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value
      };
      setParsedData({
        ...parsedData,
        contacts: updatedContacts
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <LLMIcon sx={{ mr: 1, color: 'primary.main' }} />
            Document Processing
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* LLM Status */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <LLMIcon sx={{ mr: 1, color: llmStatus?.available ? 'success.main' : 'warning.main' }} />
                  <Typography variant="subtitle1">LLM Status</Typography>
                  <IconButton size="small" onClick={checkLLMStatus} sx={{ ml: 'auto' }}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
                {llmStatus ? (
                  <Box>
                    <Chip
                      label={llmStatus.available ? 'Available' : 'Not Available'}
                      color={llmStatus.available ? 'success' : 'warning'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {llmStatus.available 
                        ? `Using ${llmStatus.models.length > 0 ? llmStatus.models[0] : 'default'} model`
                        : 'Using rule-based extraction as fallback'
                      }
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Checking LLM availability...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* File Upload */}
          <Grid item xs={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'primary.main',
                backgroundColor: 'background.default',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'action.hover'
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {!file ? (
                <Box>
                  <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Upload Handover Document
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Drag and drop a PDF, Word, or text file here, or click to browse
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: PDF, DOCX, DOC, TXT (Max 10MB)
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '2rem', mb: 1 }}>
                    {getFileIcon(file.name)}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Remove File
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Processing Button */}
          {file && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={processDocument}
                disabled={processing}
                startIcon={<LLMIcon />}
              >
                {processing ? 'Processing Document...' : 'Process with AI'}
              </Button>
              {processing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Extracting data from document...
                  </Typography>
                </Box>
              )}
            </Grid>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Grid>
          )}

          {success && (
            <Grid item xs={12}>
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            </Grid>
          )}

          {/* Preview Dialog */}
          <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
                Extracted Data Preview
              </Box>
            </DialogTitle>
            <DialogContent>
              {parsedData && (
                <Grid container spacing={2}>
                  {/* Basic Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Basic Information</Typography>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={parsedData.name || ''}
                      onChange={(e) => handleEditData('name', e.target.value)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      value={parsedData.email || ''}
                      onChange={(e) => handleEditData('email', e.target.value)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      value={parsedData.phone || ''}
                      onChange={(e) => handleEditData('phone', e.target.value)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Website"
                      value={parsedData.website || ''}
                      onChange={(e) => handleEditData('website', e.target.value)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Industry"
                      value={parsedData.industry || ''}
                      onChange={(e) => handleEditData('industry', e.target.value)}
                      margin="normal"
                    />
                  </Grid>

                  {/* Business Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Business Information</Typography>
                    <TextField
                      fullWidth
                      label="Revenue"
                      type="number"
                      value={parsedData.revenue || ''}
                      onChange={(e) => handleEditData('revenue', parseFloat(e.target.value) || 0)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Employees"
                      type="number"
                      value={parsedData.employees || ''}
                      onChange={(e) => handleEditData('employees', parseInt(e.target.value) || 0)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Business Use Case"
                      multiline
                      rows={2}
                      value={parsedData.businessUseCase || ''}
                      onChange={(e) => handleEditData('businessUseCase', e.target.value)}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Tech Stack"
                      value={parsedData.techStack || ''}
                      onChange={(e) => handleEditData('techStack', e.target.value)}
                      margin="normal"
                    />
                  </Grid>

                  {/* Team Assignment */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Team Assignment</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Account Manager"
                          value={parsedData.accountManager || ''}
                          onChange={(e) => handleEditData('accountManager', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Customer Success Manager"
                          value={parsedData.customerSuccessManager || ''}
                          onChange={(e) => handleEditData('customerSuccessManager', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Sales Engineer"
                          value={parsedData.salesEngineer || ''}
                          onChange={(e) => handleEditData('salesEngineer', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Contacts */}
                  {parsedData.contacts && parsedData.contacts.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>Contacts</Typography>
                      {parsedData.contacts.map((contact, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="First Name"
                                  value={contact.firstName || ''}
                                  onChange={(e) => handleEditContact(index, 'firstName', e.target.value)}
                                  margin="dense"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Last Name"
                                  value={contact.lastName || ''}
                                  onChange={(e) => handleEditContact(index, 'lastName', e.target.value)}
                                  margin="dense"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Email"
                                  value={contact.email || ''}
                                  onChange={(e) => handleEditContact(index, 'email', e.target.value)}
                                  margin="dense"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Phone"
                                  value={contact.phone || ''}
                                  onChange={(e) => handleEditContact(index, 'phone', e.target.value)}
                                  margin="dense"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Title"
                                  value={contact.title || ''}
                                  onChange={(e) => handleEditContact(index, 'title', e.target.value)}
                                  margin="dense"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={contact.isPrimary || false}
                                      onChange={(e) => handleEditContact(index, 'isPrimary', e.target.checked)}
                                    />
                                  }
                                  label="Primary Contact"
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Grid>
                  )}

                  {/* Notes */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Account Notes"
                      multiline
                      rows={4}
                      value={parsedData.accountNotes || ''}
                      onChange={(e) => handleEditData('accountNotes', e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button onClick={handleUseData} variant="contained">
                Use This Data
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUpload; 