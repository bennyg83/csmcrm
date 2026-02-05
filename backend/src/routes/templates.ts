import { Router } from "express";
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/templateController";
import { auth } from "../middleware/auth";

const router = Router();
router.use(auth);

router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.post("/", createTemplate);
router.patch("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
