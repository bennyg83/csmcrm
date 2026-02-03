import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { EntityFile, EntityFileOwnerType } from "../entities/EntityFile";
import { Task } from "../entities/Task";
import { Project } from "../entities/Project";
import { Account } from "../entities/Account";
import { AuthRequest } from "../middleware/auth";
import * as path from "path";
import * as fs from "fs";

const ATTACHMENTS_DIR = path.join(process.cwd(), "uploads", "attachments");

function ensureAttachmentsDir(): void {
  if (!fs.existsSync(ATTACHMENTS_DIR)) {
    fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
  }
}

export interface EntityFileWithSource {
  id: string;
  originalName: string;
  mimeType?: string;
  size: number;
  createdAt: string;
  source: EntityFileOwnerType;
  sourceId: string;
  sourceName?: string;
  visibleToChildren?: boolean;
}

/** GET /api/entity-files?entityType=task|project|account&entityId=uuid - list files for entity with inheritance */
export const listEntityFiles = async (req: AuthRequest, res: Response) => {
  try {
    const entityType = req.query.entityType as EntityFileOwnerType;
    const entityId = req.query.entityId as string;
    if (!entityType || !entityId) {
      return res.status(400).json({ error: "entityType and entityId required" });
    }
    if (!["task", "project", "account"].includes(entityType)) {
      return res.status(400).json({ error: "entityType must be task, project, or account" });
    }

    const repo = AppDataSource.getRepository(EntityFile);
    const result: EntityFileWithSource[] = [];

    if (entityType === "task") {
      const taskRepo = AppDataSource.getRepository(Task);
      const task = await taskRepo.findOne({
        where: { id: entityId },
        relations: ["project", "account"],
      });
      if (!task) return res.status(404).json({ error: "Task not found" });

      const accountId = task.accountId || task.account?.id;
      const projectId = task.projectId || task.project?.id;

      const direct = await repo.find({
        where: { entityType: "task", entityId },
        order: { createdAt: "DESC" },
      });
      direct.forEach((f) =>
        result.push({
          id: f.id,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          createdAt: f.createdAt.toISOString(),
          source: "task",
          sourceId: entityId,
          sourceName: task.title,
        })
      );

      if (projectId) {
        const fromProject = await repo.find({
          where: { entityType: "project", entityId: projectId, visibleToChildren: true },
          order: { createdAt: "DESC" },
        });
        fromProject.forEach((f) =>
          result.push({
            id: f.id,
            originalName: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
            createdAt: f.createdAt.toISOString(),
            source: "project",
            sourceId: projectId,
            sourceName: task.project?.name,
          })
        );
      }

      if (accountId) {
        const fromAccount = await repo.find({
          where: { entityType: "account", entityId: accountId, visibleToChildren: true },
          order: { createdAt: "DESC" },
        });
        fromAccount.forEach((f) =>
          result.push({
            id: f.id,
            originalName: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
            createdAt: f.createdAt.toISOString(),
            source: "account",
            sourceId: accountId,
            sourceName: task.account?.name,
          })
        );
      }
    } else if (entityType === "project") {
      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({
        where: { id: entityId },
        relations: ["account"],
      });
      if (!project) return res.status(404).json({ error: "Project not found" });

      const accountId = project.accountId || project.account?.id;

      const direct = await repo.find({
        where: { entityType: "project", entityId },
        order: { createdAt: "DESC" },
      });
      direct.forEach((f) =>
        result.push({
          id: f.id,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          createdAt: f.createdAt.toISOString(),
          source: "project",
          sourceId: entityId,
          sourceName: project.name,
          visibleToChildren: f.visibleToChildren,
        })
      );

      if (accountId) {
        const fromAccount = await repo.find({
          where: { entityType: "account", entityId: accountId, visibleToChildren: true },
          order: { createdAt: "DESC" },
        });
        fromAccount.forEach((f) =>
          result.push({
            id: f.id,
            originalName: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
            createdAt: f.createdAt.toISOString(),
            source: "account",
            sourceId: accountId,
            sourceName: project.account?.name,
          })
        );
      }
    } else {
      const accountRepo = AppDataSource.getRepository(Account);
      const account = await accountRepo.findOne({ where: { id: entityId } });
      if (!account) return res.status(404).json({ error: "Account not found" });

      const direct = await repo.find({
        where: { entityType: "account", entityId },
        order: { createdAt: "DESC" },
      });
      direct.forEach((f) =>
        result.push({
          id: f.id,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          createdAt: f.createdAt.toISOString(),
          source: "account",
          sourceId: entityId,
          sourceName: account.name,
          visibleToChildren: f.visibleToChildren,
        })
      );
    }

    res.json(result);
  } catch (err) {
    console.error("List entity files error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /api/entity-files/upload - multipart: file, entityType, entityId, visibleToChildren (optional, for project/account) */
export const uploadEntityFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const entityType = (req.body.entityType || req.query.entityType) as EntityFileOwnerType;
    const entityId = (req.body.entityId || req.query.entityId) as string;
    const visibleToChildren = req.body.visibleToChildren === "true" || req.body.visibleToChildren === true;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: "entityType and entityId required" });
    }
    if (!["task", "project", "account"].includes(entityType)) {
      return res.status(400).json({ error: "entityType must be task, project, or account" });
    }

    ensureAttachmentsDir();
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const relativePath = path.relative(uploadsRoot, req.file.path).replace(/\\/g, "/");

    const repo = AppDataSource.getRepository(EntityFile);
    const entityFile = repo.create({
      storedPath: relativePath,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || undefined,
      size: req.file.size || 0,
      entityType,
      entityId,
      visibleToChildren: entityType !== "task" ? visibleToChildren : false,
      createdById: req.user?.id,
    });
    const saved = await repo.save(entityFile);

    res.status(201).json({
      id: saved.id,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      size: saved.size,
      createdAt: saved.createdAt.toISOString(),
      source: saved.entityType,
      sourceId: saved.entityId,
      visibleToChildren: saved.visibleToChildren,
    });
  } catch (err) {
    console.error("Upload entity file error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** GET /api/entity-files/:id/download */
export const downloadEntityFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(EntityFile);
    const file = await repo.findOne({ where: { id } });
    if (!file) return res.status(404).json({ error: "File not found" });

    const absolutePath = path.join(process.cwd(), "uploads", file.storedPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    if (file.mimeType) res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", String(file.size));
    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (err) {
    console.error("Download entity file error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** DELETE /api/entity-files/:id */
export const deleteEntityFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(EntityFile);
    const file = await repo.findOne({ where: { id } });
    if (!file) return res.status(404).json({ error: "File not found" });

    const absolutePath = path.join(process.cwd(), "uploads", file.storedPath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (e) {
        console.warn("Could not unlink file:", e);
      }
    }
    await repo.remove(file);
    res.status(204).send();
  } catch (err) {
    console.error("Delete entity file error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
