import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Milestone } from "../entities/Milestone";
import { Project } from "../entities/Project";

export const getMilestonesByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const milestones = await AppDataSource.getRepository(Milestone).find({
      where: { projectId },
      order: { sortOrder: "ASC", dueDate: "ASC" },
    });
    res.json(milestones);
  } catch (error) {
    console.error("Get milestones error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMilestoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const milestone = await AppDataSource.getRepository(Milestone).findOne({
      where: { id },
      relations: ["project"],
    });
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    res.json(milestone);
  } catch (error) {
    console.error("Get milestone error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createMilestone = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, deliverable, dueDate, status, sortOrder } = req.body;
    const project = await AppDataSource.getRepository(Project).findOne({ where: { id: projectId } });
    if (!project) {
      return res.status(400).json({ error: "Project not found" });
    }
    const milestone = AppDataSource.getRepository(Milestone).create({
      projectId,
      name,
      deliverable,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      status: status || "Pending",
      sortOrder: sortOrder ?? 0,
    });
    const saved = await AppDataSource.getRepository(Milestone).save(milestone);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Milestone);
    const milestone = await repo.findOne({ where: { id } });
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    const { name, deliverable, dueDate, status, sortOrder } = req.body;
    if (name !== undefined) milestone.name = name;
    if (deliverable !== undefined) milestone.deliverable = deliverable;
    if (dueDate !== undefined) milestone.dueDate = new Date(dueDate);
    if (status !== undefined) milestone.status = status;
    if (sortOrder !== undefined) milestone.sortOrder = sortOrder;
    const updated = await repo.save(milestone);
    res.json(updated);
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Milestone);
    const milestone = await repo.findOne({ where: { id } });
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    await repo.remove(milestone);
    res.status(204).send();
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
