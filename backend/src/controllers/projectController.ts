import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Project } from "../entities/Project";
import { Account } from "../entities/Account";

export const getProjects = async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const repo = AppDataSource.getRepository(Project);
    const where = accountId ? { accountId } : {};
    const projects = await repo.find({
      where,
      relations: ["account", "milestones"],
      order: { createdAt: "DESC" },
    });
    res.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await AppDataSource.getRepository(Project).findOne({
      where: { id },
      relations: ["account", "milestones", "projectContacts", "tasks"],
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { accountId, type, name, description, status, startDate, targetDate } = req.body;
    const accountRepo = AppDataSource.getRepository(Account);
    const account = await accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      return res.status(400).json({ error: "Account not found" });
    }
    const project = AppDataSource.getRepository(Project).create({
      accountId,
      type,
      name,
      description,
      status: status || "Planning",
      startDate: startDate ? new Date(startDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      createdBy: (req as any).user?.id,
      createdByName: (req as any).user?.name || (req as any).user?.email,
    });
    const saved = await AppDataSource.getRepository(Project).save(project);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Project);
    const project = await repo.findOne({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const { name, description, status, startDate, targetDate } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : undefined;
    if (targetDate !== undefined) project.targetDate = targetDate ? new Date(targetDate) : undefined;
    const updated = await repo.save(project);
    res.json(updated);
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Project);
    const project = await repo.findOne({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    await repo.remove(project);
    res.status(204).send();
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
