import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Note } from "../entities/Note";
import { Account } from "../entities/Account";

export const getAllNotes = async (req: Request, res: Response) => {
  try {
    const noteRepository = AppDataSource.getRepository(Note);
    const notes = await noteRepository.find({
      relations: ["account", "contact"],
      order: { createdAt: "DESC" }
    });

    res.json(notes);
  } catch (error) {
    console.error("Get all notes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const noteRepository = AppDataSource.getRepository(Note);
    
    const note = await noteRepository.findOne({
      where: { id },
      relations: ["account", "contact"]
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Get note by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const noteRepository = AppDataSource.getRepository(Note);
    const accountRepository = AppDataSource.getRepository(Account);

    // Verify account exists
    const account = await accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const note = noteRepository.create({
      ...req.body,
      accountId
    });
    
    const savedNote = await noteRepository.save(note);
    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const noteRepository = AppDataSource.getRepository(Note);
    
    const note = await noteRepository.findOne({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    noteRepository.merge(note, req.body);
    const updatedNote = await noteRepository.save(note);

    res.json(updatedNote);
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const noteRepository = AppDataSource.getRepository(Note);
    
    const note = await noteRepository.findOne({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    await noteRepository.remove(note);
    res.status(204).send();
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 