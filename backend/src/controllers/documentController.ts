import { Request, Response } from "express";
import { DocumentProcessor, ParsedAccountData } from "../services/documentProcessor";
import axios from 'axios';

const documentProcessor = new DocumentProcessor();

export const processHandoverDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({ 
        error: "Invalid file type. Please upload PDF, Word, or text files." 
      });
    }

    // Process the document
    const parsedData: ParsedAccountData = await documentProcessor.processDocument(req.file);

    res.json({
      success: true,
      data: parsedData,
      message: "Document processed successfully"
    });

  } catch (error) {
    console.error("Document processing error:", error);
    res.status(500).json({ 
      error: "Failed to process document",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save the uploaded file
    const filePath = await documentProcessor.saveUploadedFile(req.file);

    res.json({
      success: true,
      filePath: filePath,
      originalName: req.file.originalname,
      message: "File uploaded successfully"
    });

  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ 
      error: "Failed to upload file",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getLLMStatus = async (req: Request, res: Response) => {
  try {
    const llmEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    
    const response = await axios.get(`${llmEndpoint}/api/tags`);

    if (response.status === 200) {
      const data = response.data as any;
      res.json({
        available: true,
        models: data.models || [],
        endpoint: llmEndpoint
      });
    } else {
      res.json({
        available: false,
        message: "LLM service not available",
        endpoint: llmEndpoint
      });
    }

  } catch (error) {
    res.json({
      available: false,
      message: "LLM service not available",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}; 