import { Router } from "express";
import {
  getProjectContactsByContactId,
  updateProjectContact,
  removeProjectContact,
} from "../controllers/projectContactController";
import { auth } from "../middleware/auth";

const router = Router();

router.use(auth);

router.get("/", getProjectContactsByContactId);
router.patch("/:id", updateProjectContact);
router.delete("/:id", removeProjectContact);

export default router;
