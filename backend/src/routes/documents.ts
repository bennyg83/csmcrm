import { Router } from "express";
import multer from "multer";
import {
  processHandoverDocument,
  uploadDocument,
  getLLMStatus
} from "../controllers/documentController";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, Word, or text files.'));
    }
  }
});

// Document processing routes
router.post("/process-handover", upload.single('document'), processHandoverDocument);
router.post("/upload", upload.single('document'), uploadDocument);
router.get("/llm-status", getLLMStatus);

export default router; 