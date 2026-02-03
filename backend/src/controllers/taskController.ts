import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Task } from "../entities/Task";
import { GoogleOAuthService } from "../services/googleOAuthService";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    const projectId = req.query.projectId as string | undefined;
    const milestoneId = req.query.milestoneId as string | undefined;
    const tagsParam = req.query.tags as string | undefined; // comma-separated

    const qb = taskRepository.createQueryBuilder("task");
    qb.leftJoinAndSelect("task.account", "account");
    qb.leftJoinAndSelect("task.project", "project");
    qb.leftJoinAndSelect("task.milestone", "milestone");
    qb.orderBy("task.createdAt", "DESC");

    if (projectId) {
      qb.andWhere("task.projectId = :projectId", { projectId });
    }
    if (milestoneId) {
      qb.andWhere("task.milestoneId = :milestoneId", { milestoneId });
    }
    if (tagsParam && tagsParam.trim()) {
      const tagList = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
      for (const tag of tagList) {
        qb.andWhere("(task.tags::jsonb @> :tagJson)", {
          tagJson: JSON.stringify([tag]),
        });
      }
    }

    const tasks = await qb.getMany();
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
      relations: ["account", "project", "milestone"]
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

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    
    // Clean up the request body to handle UUID fields properly
    const taskData = {
      ...req.body,
      accountId: req.body.accountId || null,
      categoryId: req.body.categoryId || null,
      projectId: req.body.projectId || null,
      milestoneId: req.body.milestoneId || null,
    };
    
    // Store the createCalendarEvent flag before removing it from taskData
    const shouldCreateCalendarEvent = req.body.createCalendarEvent;
    
    const task = taskRepository.create(taskData);
    const savedTask = await taskRepository.save(task);

    // Try to create Google Calendar event if user has Google integration
    console.log('Calendar integration check:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      shouldCreateCalendarEvent,
      hasGoogleToken: !!req.user
    });
    
    if (req.user) {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user.id } });

        console.log('User found:', {
          hasUser: !!user,
          hasGoogleToken: !!user?.googleAccessToken,
          shouldCreateCalendarEvent
        });

        if (user && user.googleAccessToken && shouldCreateCalendarEvent) {
          const googleOAuthService = GoogleOAuthService.getInstance();
          const calendar = googleOAuthService.getCalendarClient(
            user.googleAccessToken,
            user.googleRefreshToken
          );

          const event = {
            summary: savedTask.title,
            description: savedTask.description,
            start: {
              dateTime: savedTask.dueDate.toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(new Date(savedTask.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
              timeZone: 'UTC'
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 30 }
              ]
            }
          };

          const calendarResponse = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event
          });

          // Update task with calendar event ID
          savedTask.googleCalendarEventId = calendarResponse.data.id;
          await taskRepository.save(savedTask);

          console.log('Task created in Google Calendar:', calendarResponse.data.id);
        }
      } catch (calendarError) {
        console.error('Failed to create Google Calendar event:', calendarError);
        // Don't fail the task creation if calendar sync fails
      }
    }

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    
    const task = await taskRepository.findOne({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    taskRepository.merge(task, req.body);
    const updatedTask = await taskRepository.save(task);

    // Try to update Google Calendar event if it exists
    if (req.user && updatedTask.googleCalendarEventId) {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.user.id } });

        if (user && user.googleAccessToken) {
          const googleOAuthService = GoogleOAuthService.getInstance();
          const calendar = googleOAuthService.getCalendarClient(
            user.googleAccessToken,
            user.googleRefreshToken
          );

          const event = {
            summary: updatedTask.title,
            description: updatedTask.description,
            start: {
              dateTime: updatedTask.dueDate.toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(new Date(updatedTask.dueDate).getTime() + 60 * 60 * 1000).toISOString(),
              timeZone: 'UTC'
            }
          };

          await calendar.events.update({
            calendarId: 'primary',
            eventId: updatedTask.googleCalendarEventId,
            requestBody: event
          });

          console.log('Task updated in Google Calendar:', updatedTask.googleCalendarEventId);
        }
      } catch (calendarError) {
        console.error('Failed to update Google Calendar event:', calendarError);
        // Don't fail the task update if calendar sync fails
      }
    }

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