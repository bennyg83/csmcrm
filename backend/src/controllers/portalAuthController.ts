import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { Contact } from "../entities/Contact";
import { Task } from "../entities/Task";
import { TaskComment } from "../entities/TaskComment";

export const portalLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const contactRepository = AppDataSource.getRepository(Contact);
    const contact = await contactRepository.findOne({ 
      where: { email, hasPortalAccess: true, isPortalActive: true },
      relations: ["account"]
    });

    if (!contact) {
      return res.status(401).json({ error: "Invalid credentials or no portal access" });
    }

    const isValidPassword = await contact.comparePortalPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    contact.lastPortalLogin = new Date();
    await contactRepository.save(contact);

    const token = jwt.sign(
      { 
        contactId: contact.id, 
        email: contact.email, 
        accountId: contact.accountId,
        type: 'external'
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        accountId: contact.accountId,
        accountName: contact.account?.name
      }
    });
  } catch (error) {
    console.error("Portal login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setupPortalAccess = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    const contactRepository = AppDataSource.getRepository(Contact);
    const contact = await contactRepository.findOne({ 
      where: { portalInviteToken: token }
    });

    if (!contact) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    if (!contact.isPortalInviteValid()) {
      return res.status(400).json({ error: "Invitation token has expired" });
    }

    // Set up portal access
    contact.hasPortalAccess = true;
    contact.isPortalActive = true;
    contact.portalPassword = password; // Will be hashed by entity hook
    contact.portalInviteToken = null;
    contact.portalInviteExpiry = null;

    await contactRepository.save(contact);

    res.json({ message: "Portal access set up successfully" });
  } catch (error) {
    console.error("Portal setup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPortalTasks = async (req: Request, res: Response) => {
  try {
    const contactId = (req as any).contact?.id;
    const accountId = (req as any).contact?.accountId;

    if (!contactId || !accountId) {
      return res.status(401).json({ error: "Invalid contact authentication" });
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const tasks = await taskRepository.find({
      where: {
        accountId: accountId
      },
      relations: ["comments"],
      order: { createdAt: "DESC" }
    });

    // Filter tasks to only show those assigned to this contact
    const contactTasks = tasks.filter(task => {
      const assignedToClient = Array.isArray(task.assignedToClient) ? task.assignedToClient : [];
      return assignedToClient.includes(contactId);
    });

    // Filter comments to hide private internal comments
    const filteredTasks = contactTasks.map(task => ({
      ...task,
      comments: task.comments?.filter((comment: any) => !comment.isPrivate) || []
    }));

    res.json(filteredTasks);
  } catch (error) {
    console.error("Get portal tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const contactId = (req as any).contact?.id;
    const accountId = (req as any).contact?.accountId;

    if (!contactId || !accountId) {
      return res.status(401).json({ error: "Invalid contact authentication" });
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: taskId, accountId: accountId }
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if contact is assigned to this task
    const assignedToClient = Array.isArray(task.assignedToClient) ? task.assignedToClient : [];
    if (!assignedToClient.includes(contactId)) {
      return res.status(403).json({ error: "Not authorized to update this task" });
    }

    // Only allow specific status updates by external contacts
    const allowedStatuses = ["In Progress", "Completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status for external update" });
    }

    task.status = status;
    task.progress = status === "Completed" ? 100 : (status === "In Progress" ? 50 : task.progress);
    
    await taskRepository.save(task);

    res.json(task);
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addTaskComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const contact = (req as any).contact;

    if (!contact) {
      return res.status(401).json({ error: "Invalid contact authentication" });
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: taskId, accountId: contact.accountId }
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if contact is assigned to this task
    const assignedToClient = Array.isArray(task.assignedToClient) ? task.assignedToClient : [];
    if (!assignedToClient.includes(contact.id)) {
      return res.status(403).json({ error: "Not authorized to comment on this task" });
    }

    const commentRepository = AppDataSource.getRepository(TaskComment);
    const comment = commentRepository.create({
      taskId: taskId,
      content: content,
      authorType: "external",
      authorId: contact.id,
      authorName: `${contact.firstName} ${contact.lastName}`,
      authorEmail: contact.email,
      isPrivate: false
    });

    await commentRepository.save(comment);

    res.status(201).json(comment);
  } catch (error) {
    console.error("Add task comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const contact = (req as any).contact;

    if (!contact) {
      return res.status(401).json({ error: "Invalid contact authentication" });
    }

    const commentRepository = AppDataSource.getRepository(TaskComment);
    const comments = await commentRepository.find({
      where: { taskId: taskId, isPrivate: false },
      order: { createdAt: "ASC" }
    });

    res.json(comments);
  } catch (error) {
    console.error("Get task comments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};