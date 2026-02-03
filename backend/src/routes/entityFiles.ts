import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { auth } from "../middleware/auth";
import {
  listEntityFiles,
  uploadEntityFile,
  downloadEntityFile,
  deleteEntityFile,
} from "../controllers/entityFileController";

const router = Router();
router.use(auth);

const attachmentsDir = path.join(process.cwd(), "uploads", "attachments");
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, attachmentsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get("/", listEntityFiles);
router.post("/upload", upload.single("file"), uploadEntityFile);
router.get("/:id/download", downloadEntityFile);
router.delete("/:id", deleteEntityFile);

export default router;
