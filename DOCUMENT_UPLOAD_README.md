# Document Upload & LLM Parsing Feature

## Overview

The CRM system now includes a document upload feature that allows users to upload handover documents (PDF, DOCX, DOC, TXT) and automatically extract onboarding information using AI/LLM processing.

## Features

### 1. Document Upload
- **Supported Formats**: PDF, DOCX, DOC, TXT
- **File Size Limit**: 10MB
- **Upload Progress**: Real-time progress indicator
- **File Validation**: Automatic file type validation

### 2. AI-Powered Data Extraction
- **LLM Integration**: Uses Hugging Face's free inference API
- **Fallback Processing**: Pattern-based extraction if LLM fails
- **Extracted Fields**:
  - Account information (name, email, phone, address, industry, website)
  - Business use cases (short-term, mid-term, long-term)
  - Technical stack information
  - Contact details
  - Expansion possibilities
  - Support tickets and JIRA tickets

### 3. Enhanced Onboarding Questionnaire
- **Document Upload Step**: New first step for uploading handover documents
- **Auto-Population**: Form fields are automatically populated with extracted data
- **Additional Account Fields**: 
  - Revenue and ARR
  - Employee count
  - Health and risk scores
  - Renewal date
  - Team assignments (Account Manager, CSM, Sales Engineer)
- **Task Creation**: Ability to create tasks for accounts or specific contacts
- **Multi-Step Process**: 10-step onboarding workflow

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
```

### 2. Environment Variables
Add to your `.env` file:
```env
HUGGING_FACE_API_KEY=your-hugging-face-api-key-here
```

### 3. Get Hugging Face API Key
1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account
3. Go to Settings > Access Tokens
4. Create a new token
5. Add it to your environment variables

## API Endpoints

### Document Upload
- `POST /api/documents/upload` - Upload and parse document
- `POST /api/documents/validate` - Validate document type

### Request Format
```javascript
// Upload document
const formData = new FormData();
formData.append('document', file);

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});
```

### Response Format
```javascript
{
  "success": true,
  "message": "Document parsed successfully",
  "data": {
    "accountName": "Extracted company name",
    "email": "contact@company.com",
    "phone": "+1-555-0123",
    "address": "123 Business St, City, State",
    "industry": "Technology",
    "website": "https://company.com",
    "shortTermUseCase": "Immediate business objectives",
    "midTermUseCase": "Medium-term goals",
    "longTermUseCase": "Long-term vision",
    "contacts": [
      {
        "name": "John Doe",
        "geo": "North America",
        "focus": "Technical Lead",
        "kpis": "Implementation success",
        "other": "Additional notes"
      }
    ],
    "expansions": [
      {
        "what": "Feature expansion",
        "steps": "Implementation steps"
      }
    ],
    "criticalSupports": [
      {
        "ticket": "TICKET-123",
        "description": "Critical issue description"
      }
    ],
    "jiraTickets": [
      {
        "ticket": "JIRA-456",
        "description": "JIRA ticket description"
      }
    ]
  }
}
```

## Usage

### 1. Access Onboarding Questionnaire
- Navigate to Accounts page
- Click "Add Account" button
- Select "Onboarding Questionnaire"

### 2. Upload Document
- In the first step, click "Upload Onboarding Document"
- Select a PDF, DOCX, DOC, or TXT file
- Wait for processing (progress bar will show)
- Review extracted data

### 3. Complete Questionnaire
- Navigate through all 10 steps
- Modify extracted data as needed
- Add additional information
- Create tasks for the account
- Submit to create account with all data

## Error Handling

### Common Issues
1. **Invalid File Type**: Only PDF, DOCX, DOC, TXT files are supported
2. **File Too Large**: Maximum file size is 10MB
3. **LLM API Error**: Falls back to pattern-based extraction
4. **Network Issues**: Retry upload if connection fails

### Error Response Format
```javascript
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Technical Details

### Backend Dependencies
- `multer`: File upload handling
- `pdf-parse`: PDF text extraction
- `mammoth`: DOCX/DOC text extraction
- `axios`: HTTP requests to LLM API

### Frontend Dependencies
- Material-UI components for file upload
- Progress indicators
- Form validation

### Security
- File type validation
- File size limits
- Temporary file cleanup
- No persistent file storage

## Future Enhancements

1. **Multiple Document Support**: Upload multiple documents for comprehensive extraction
2. **Custom Extraction Rules**: User-defined extraction patterns
3. **Document Templates**: Pre-defined templates for different document types
4. **Batch Processing**: Process multiple documents simultaneously
5. **Advanced LLM Models**: Integration with more sophisticated AI models
6. **Document Storage**: Optional persistent storage of uploaded documents
7. **Extraction History**: Track and review previous extractions

## Troubleshooting

### LLM API Issues
- Check Hugging Face API key is valid
- Verify internet connection
- Check API rate limits
- Review console logs for detailed error messages

### File Upload Issues
- Ensure file is in supported format
- Check file size is under 10MB
- Verify file is not corrupted
- Check browser console for errors

### Performance Issues
- Large files may take longer to process
- LLM API calls may have delays
- Consider breaking large documents into smaller sections 