import { Router } from "express";
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  inviteToPortal,
  revokePortalAccess,
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

// Portal management routes
router.post("/:accountId/contacts/:contactId/portal/invite", inviteToPortal);
router.delete("/:accountId/contacts/:contactId/portal/access", revokePortalAccess);

export default router; 