import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Template } from "../entities/Template";

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Template);
    const type = req.query.type as string | undefined;
    const qb = repo.createQueryBuilder("t").orderBy("t.name", "ASC");
    if (type === "email" || type === "note") {
      qb.andWhere("t.type = :type", { type });
    }
    const templates = await qb.getMany();
    res.json(templates);
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Template);
    const template = await repo.findOne({ where: { id } });
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Template);
    const template = repo.create(req.body);
    const saved = await repo.save(template);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Template);
    const template = await repo.findOne({ where: { id } });
    if (!template) return res.status(404).json({ error: "Template not found" });
    repo.merge(template, req.body);
    const saved = await repo.save(template);
    res.json(saved);
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Template);
    const template = await repo.findOne({ where: { id } });
    if (!template) return res.status(404).json({ error: "Template not found" });
    await repo.remove(template);
    res.status(204).send();
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
