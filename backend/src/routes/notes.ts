import express from "express";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from "../controllers/noteController";

const router = express.Router();

// Get all notes
router.get("/", getAllNotes);

// Get note by ID
router.get("/:id", getNoteById);

// Create note for an account
router.post("/accounts/:accountId/notes", createNote);

// Update note
router.patch("/:id", updateNote);

// Delete note
router.delete("/:id", deleteNote);

export default router; 