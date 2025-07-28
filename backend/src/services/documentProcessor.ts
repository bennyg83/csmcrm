import { Request } from 'express';
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface ParsedAccountData {
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
  expansionOpportunities?: string;
  criticalSupport?: string;
  jiraTickets?: string;
  contacts?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    title?: string;
    isPrimary?: boolean;
  }>;
}

export class DocumentProcessor {
  private uploadDir: string;
  private llmEndpoint: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // Using Ollama as the local LLM (secure, open-source)
    this.llmEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirpSync(this.uploadDir);
    }
  }

  async processDocument(file: Express.Multer.File): Promise<ParsedAccountData> {
    try {
      // Extract text from document
      const extractedText = await this.extractText(file);
      
      // Process with LLM to extract structured data
      const parsedData = await this.processWithLLM(extractedText);
      
      // Clean up uploaded file
      await fs.remove(file.path);
      
      return parsedData;
    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error('Failed to process document');
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    switch (fileExtension) {
      case '.pdf':
        return await this.extractFromPDF(file.path);
      case '.docx':
      case '.doc':
        return await this.extractFromWord(file.path);
      case '.txt':
        return await fs.readFile(file.path, 'utf-8');
      default:
        throw new Error('Unsupported file format. Please upload PDF, Word, or text files.');
    }
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractFromWord(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  private async processWithLLM(text: string): Promise<ParsedAccountData> {
    try {
      // For now, use rule-based extraction as the primary method
      // This provides good results without requiring large model downloads
      return await this.extractWithRules(text);
      
      // Uncomment below if you want to use LLM processing
      // const isOllamaAvailable = await this.checkOllamaAvailability();
      // if (isOllamaAvailable) {
      //   return await this.processWithOllama(text);
      // } else {
      //   return await this.extractWithRules(text);
      // }
    } catch (error) {
      console.error('Document processing error:', error);
      return await this.extractWithRules(text);
    }
  }

  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.llmEndpoint}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.log('Ollama not available, using rule-based extraction');
      return false;
    }
  }

  private async processWithOllama(text: string): Promise<ParsedAccountData> {
          const prompt = `
Extract company data from this structured document and return as JSON.

Look for these exact patterns:
- "Company:" for company name
- "Email:" for email address
- "Phone:" for phone number
- "Address:" for company address
- "Industry:" for industry/sector
- "Website:" for website URL
- "Revenue:" for annual revenue (extract number only)
- "Employees:" for number of employees (extract number only)
- "Account Manager:" for account manager name
- "Customer Success Manager:" for customer success manager name
- "Sales Engineer:" for sales engineer name
- "BUSINESS OBJECTIVES:" section for business use case
- "TECHNICAL INFRASTRUCTURE:" section for tech stack
- "EXPANSION OPPORTUNITIES:" section for expansion opportunities
- "CRITICAL SUPPORT:" section for critical support tickets
- "JIRA TICKETS:" section for JIRA tickets
- "KEY STAKEHOLDERS:" section for contacts (extract names and titles)

Document:
${text}

Return only valid JSON with these fields:
{
  "name": "extracted company name",
  "email": "extracted email",
  "phone": "extracted phone",
  "address": "extracted address",
  "industry": "extracted industry",
  "website": "extracted website",
  "revenue": number,
  "employees": number,
  "accountManager": "extracted account manager",
  "customerSuccessManager": "extracted customer success manager",
  "salesEngineer": "extracted sales engineer",
  "businessUseCase": "extracted business objectives",
  "techStack": "extracted technical infrastructure",
  "expansionOpportunities": "extracted expansion opportunities",
  "criticalSupport": "extracted critical support",
  "jiraTickets": "extracted JIRA tickets",
  "contacts": [{"firstName": "first", "lastName": "last", "title": "title", "isPrimary": true}]
}
`;

    try {
      const response = await axios.post(`${this.llmEndpoint}/api/generate`, {
        model: 'tinyllama', // Use TinyLlama for faster processing
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 1000
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error('LLM request failed');
      }

      const data = response.data as any;
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from LLM');
      }
    } catch (error) {
      console.error('Ollama processing error:', error);
      throw error;
    }
  }

  private async extractWithRules(text: string): Promise<ParsedAccountData> {
    // Enhanced rule-based extraction for structured documents
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const extracted: ParsedAccountData = {
      contacts: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Extract company name - look for "Company:" pattern
      if (!extracted.name && lowerLine.includes('company:')) {
        const match = line.match(/company:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.name = match[1].trim();
        }
      }
      
      // Extract email - look for "Email:" pattern
      if (!extracted.email && lowerLine.includes('email:')) {
        const match = line.match(/email:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.email = match[1].trim();
        }
      }
      
      // Extract phone - look for "Phone:" pattern
      if (!extracted.phone && lowerLine.includes('phone:')) {
        const match = line.match(/phone:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.phone = match[1].trim();
        }
      }
      
      // Extract address - look for "Address:" pattern
      if (!extracted.address && lowerLine.includes('address:')) {
        const match = line.match(/address:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.address = match[1].trim();
        }
      }
      
      // Extract industry - look for "Industry:" pattern
      if (!extracted.industry && lowerLine.includes('industry:')) {
        const match = line.match(/industry:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.industry = match[1].trim();
        }
      }
      
      // Extract website - look for "Website:" pattern
      if (!extracted.website && lowerLine.includes('website:')) {
        const match = line.match(/website:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.website = match[1].trim();
        }
      }
      
      // Extract revenue - look for "Revenue:" pattern
      if (!extracted.revenue && lowerLine.includes('revenue:')) {
        const match = line.match(/revenue:\s*\$?([0-9,]+(?:\.\d{2})?)/i);
        if (match && match[1]) {
          extracted.revenue = parseFloat(match[1].replace(/,/g, ''));
        }
      }
      
      // Extract employees - look for "Employees:" pattern
      if (!extracted.employees && lowerLine.includes('employees:')) {
        const match = line.match(/employees:\s*(\d+)/i);
        if (match && match[1]) {
          extracted.employees = parseInt(match[1]);
        }
      }
      
      // Extract account manager - look for "Account Manager:" pattern
      if (!extracted.accountManager && lowerLine.includes('account manager:')) {
        const match = line.match(/account manager:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.accountManager = match[1].trim();
        }
      }
      
      // Extract customer success manager - look for "Customer Success Manager:" pattern
      if (!extracted.customerSuccessManager && lowerLine.includes('customer success manager:')) {
        const match = line.match(/customer success manager:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.customerSuccessManager = match[1].trim();
        }
      }
      
      // Extract sales engineer - look for "Sales Engineer:" pattern
      if (!extracted.salesEngineer && lowerLine.includes('sales engineer:')) {
        const match = line.match(/sales engineer:\s*(.+)/i);
        if (match && match[1].trim()) {
          extracted.salesEngineer = match[1].trim();
        }
      }
      
      // Extract business use case from business objectives
      if (!extracted.businessUseCase && (lowerLine.includes('business objectives:') || lowerLine.includes('business objectives'))) {
        let useCase = '';
        // Look for the next few lines after "BUSINESS OBJECTIVES:"
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.toLowerCase().includes('short-term:') || nextLine.toLowerCase().includes('mid-term:') || nextLine.toLowerCase().includes('long-term:')) {
            useCase += nextLine + ' ';
          } else if (nextLine.trim() && !nextLine.includes(':')) {
            // If we hit a line without colon, it might be the end of the section
            break;
          }
        }
        if (useCase.trim()) {
          extracted.businessUseCase = useCase.trim();
        }
      }
      
      // Extract tech stack from technical infrastructure
      if (!extracted.techStack && (lowerLine.includes('technical infrastructure:') || lowerLine.includes('technical infrastructure'))) {
        let techStack = '';
        // Look for the next few lines after "TECHNICAL INFRASTRUCTURE:"
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.toLowerCase().includes('repos:') || nextLine.toLowerCase().includes('pipelines:') || nextLine.toLowerCase().includes('languages:') || nextLine.toLowerCase().includes('container repos:') || nextLine.toLowerCase().includes('issue trackers:')) {
            techStack += nextLine + ' ';
          } else if (nextLine.trim() && !nextLine.includes(':')) {
            // If we hit a line without colon, it might be the end of the section
            break;
          }
        }
        if (techStack.trim()) {
          extracted.techStack = techStack.trim();
        }
      }
      
      // Extract expansion opportunities
      if (!extracted.expansionOpportunities && (lowerLine.includes('expansion opportunities:') || lowerLine.includes('expansion opportunities'))) {
        let expansionText = '';
        // Look for the next few lines after "EXPANSION OPPORTUNITIES:"
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.toLowerCase().includes('what:') || nextLine.toLowerCase().includes('steps:')) {
            expansionText += nextLine + ' ';
          } else if (nextLine.trim() && !nextLine.includes(':')) {
            // If we hit a line without colon, it might be the end of the section
            break;
          }
        }
        if (expansionText.trim()) {
          extracted.expansionOpportunities = expansionText.trim();
        }
      }
      
      // Extract critical support
      if (!extracted.criticalSupport && (lowerLine.includes('critical support:') || lowerLine.includes('critical support'))) {
        let supportText = '';
        // Look for the next few lines after "CRITICAL SUPPORT:"
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.toLowerCase().includes('ticket:') || nextLine.toLowerCase().includes('description:')) {
            supportText += nextLine + ' ';
          } else if (nextLine.trim() && !nextLine.includes(':')) {
            // If we hit a line without colon, it might be the end of the section
            break;
          }
        }
        if (supportText.trim()) {
          extracted.criticalSupport = supportText.trim();
        }
      }
      
      // Extract JIRA tickets
      if (!extracted.jiraTickets && (lowerLine.includes('jira tickets:') || lowerLine.includes('jira tickets'))) {
        let ticketsText = '';
        // Look for the next few lines after "JIRA TICKETS:"
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.toLowerCase().includes('ticket:') || nextLine.toLowerCase().includes('description:')) {
            ticketsText += nextLine + ' ';
          } else if (nextLine.trim() && !nextLine.includes(':')) {
            // If we hit a line without colon, it might be the end of the section
            break;
          }
        }
        if (ticketsText.trim()) {
          extracted.jiraTickets = ticketsText.trim();
        }
      }
      
      // Extract contacts from key stakeholders
      if (lowerLine.includes('key stakeholders:') || lowerLine.includes('key stakeholders')) {
        // Look for contact patterns in subsequent lines
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.toLowerCase().includes('contact:')) {
            const contactMatch = nextLine.match(/contact:\s*(.+?),\s*geo:\s*(.+?),\s*focus:\s*(.+?),\s*kpis:\s*(.+?),\s*other:\s*(.+)/i);
            if (contactMatch) {
              const [_, name, geo, focus, kpis, other] = contactMatch;
              const nameParts = name.trim().split(' ');
              if (extracted.contacts) {
                extracted.contacts.push({
                  firstName: nameParts[0] || '',
                  lastName: nameParts.slice(1).join(' ') || '',
                  title: focus.trim(),
                  isPrimary: extracted.contacts.length === 0 // First contact is primary
                });
              }
            }
          } else if (nextLine.trim() && !nextLine.includes(':')) {
            // If we hit a line without colon, it might be the end of the section
            break;
          }
        }
      }
    }

    return extracted;
  }

  async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);
    
    await fs.move(file.path, filePath);
    return filePath;
  }
} 
} 