import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Task } from "../entities/Task";

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    const tasks = await taskRepository.find({
      relations: ["account"],
      order: { createdAt: "DESC" }
    });

    res.json(tasks);
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    
    const task = await taskRepository.findOne({
      where: { id },
      relations: ["account"]
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Get task by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    const task = taskRepository.create(req.body);
    const savedTask = await taskRepository.save(task);

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    
    const task = await taskRepository.findOne({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    taskRepository.merge(task, req.body);
    const updatedTask = await taskRepository.save(task);

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    
    const task = await taskRepository.findOne({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await taskRepository.remove(task);
    res.status(204).send();
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 