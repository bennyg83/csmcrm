import { Router } from "express";
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} from "../controllers/contactController";
// import { auth } from "../middleware/auth";

const router = Router();

// All routes require authentication
// router.use(auth);

// Contact routes
router.get("/:accountId/contacts", getContacts);
router.get("/:accountId/contacts/:contactId", getContactById);
router.post("/:accountId/contacts", createContact);
router.patch("/:accountId/contacts/:contactId", updateContact);
router.delete("/:accountId/contacts/:contactId", deleteContact);

export default router; 