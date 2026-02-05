import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Note } from "../entities/Note";
import { Account } from "../entities/Account";
import { Contact } from "../entities/Contact";

export const getAllNotes = async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const contactId = req.query.contactId as string | undefined;
    const noteRepository = AppDataSource.getRepository(Note);

    const qb = noteRepository.createQueryBuilder("note");
    qb.leftJoinAndSelect("note.account", "account");
    qb.leftJoinAndSelect("note.contacts", "contacts");
    qb.orderBy("note.createdAt", "DESC");

    if (accountId) {
      qb.andWhere("note.accountId = :accountId", { accountId });
    }
    if (contactId) {
      qb.andWhere("contacts.id = :contactId", { contactId });
    }

    const notes = await qb.getMany();
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
      relations: ["account", "contacts"],
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
    const { contactIds, ...rest } = req.body;
    const noteRepository = AppDataSource.getRepository(Note);
    const accountRepository = AppDataSource.getRepository(Account);
    const contactRepository = AppDataSource.getRepository(Contact);

    const account = await accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const note = noteRepository.create({
      ...rest,
      accountId,
    });
    const savedNote = await noteRepository.save(note);

    if (Array.isArray(contactIds) && contactIds.length > 0) {
      const contacts = await contactRepository.findBy({ id: In(contactIds) });
      savedNote.contacts = contacts;
      await noteRepository.save(savedNote);
    }

    // Update account lastTouchpoint when logging a call or email (see docs/TOUCHPOINT_AND_TASK_TYPE.md)
    const noteType = (rest as { type?: string }).type;
    if (noteType === "call" || noteType === "email") {
      const touchTime = savedNote.createdAt || new Date();
      await accountRepository.update(accountId, { lastTouchpoint: touchTime });
    }

    const withRelations = await noteRepository.findOne({
      where: { id: savedNote.id },
      relations: ["account", "contacts"],
    });
    res.status(201).json(withRelations ?? savedNote);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contactIds, ...rest } = req.body;
    const noteRepository = AppDataSource.getRepository(Note);
    const contactRepository = AppDataSource.getRepository(Contact);

    const note = await noteRepository.findOne({
      where: { id },
      relations: ["contacts"],
    });
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    noteRepository.merge(note, rest);
    if (Array.isArray(contactIds)) {
      const contacts = contactIds.length > 0
        ? await contactRepository.findBy({ id: In(contactIds) })
        : [];
      note.contacts = contacts;
    }
    const updatedNote = await noteRepository.save(note);

    const withRelations = await noteRepository.findOne({
      where: { id: updatedNote.id },
      relations: ["account", "contacts"],
    });
    res.json(withRelations ?? updatedNote);
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