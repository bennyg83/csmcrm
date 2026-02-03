import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { ProjectContact } from "../entities/ProjectContact";
import { Project } from "../entities/Project";

export const getProjectContacts = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const contacts = await AppDataSource.getRepository(ProjectContact).find({
      where: { projectId },
      relations: ["contact", "user"],
    });
    res.json(contacts);
  } catch (error) {
    console.error("Get project contacts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** GET /api/project-contacts?contactId=uuid - list project-contacts for a contact (projects this contact is involved in) */
export const getProjectContactsByContactId = async (req: Request, res: Response) => {
  try {
    const contactId = req.query.contactId as string;
    if (!contactId) {
      return res.status(400).json({ error: "contactId query required" });
    }
    const list = await AppDataSource.getRepository(ProjectContact).find({
      where: { contactId },
      relations: ["project"],
      order: { createdAt: "DESC" },
    });
    res.json(list);
  } catch (error) {
    console.error("Get project contacts by contactId error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addProjectContact = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { contactId, userId, role, notes } = req.body;
    const project = await AppDataSource.getRepository(Project).findOne({ where: { id: projectId } });
    if (!project) {
      return res.status(400).json({ error: "Project not found" });
    }
    if (!contactId && !userId) {
      return res.status(400).json({ error: "Either contactId or userId is required" });
    }
    const pc = AppDataSource.getRepository(ProjectContact).create({
      projectId,
      contactId: contactId || undefined,
      userId: userId || undefined,
      role: role || "other",
      notes,
    });
    const saved = await AppDataSource.getRepository(ProjectContact).save(pc);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Add project contact error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProjectContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(ProjectContact);
    const pc = await repo.findOne({ where: { id } });
    if (!pc) {
      return res.status(404).json({ error: "Project contact not found" });
    }
    const { role, notes } = req.body;
    if (role !== undefined) pc.role = role;
    if (notes !== undefined) pc.notes = notes;
    const updated = await repo.save(pc);
    res.json(updated);
  } catch (error) {
    console.error("Update project contact error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeProjectContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(ProjectContact);
    const pc = await repo.findOne({ where: { id } });
    if (!pc) {
      return res.status(404).json({ error: "Project contact not found" });
    }
    await repo.remove(pc);
    res.status(204).send();
  } catch (error) {
    console.error("Remove project contact error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
