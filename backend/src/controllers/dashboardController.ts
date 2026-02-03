import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { Task } from "../entities/Task";
import { AccountActivity } from "../entities/AccountActivity";

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const accountRepository = AppDataSource.getRepository(Account);
    const taskRepository = AppDataSource.getRepository(Task);
    const activityRepository = AppDataSource.getRepository(AccountActivity);

    // Fetch all accounts
    const accounts = await accountRepository.find({
      select: ["id", "status", "health", "revenue"]
    });

    // Fetch all tasks
    const tasks = await taskRepository.find({
      select: ["id"]
    });

    // Fetch recent activities (last 10, ordered by date descending)
    const recentActivities = await activityRepository.find({
      order: { date: "DESC" },
      take: 10,
      relations: ["account"]
    });

    // Calculate metrics
    const totalAccounts = accounts.length;
    const totalTasks = tasks.length;
    const activeAccounts = accounts.filter(acc => acc.status === "active").length;
    const atRiskAccounts = accounts.filter(acc => acc.status === "at-risk").length;
    
    // Calculate total revenue
    const totalRevenue = accounts.reduce((sum, acc) => {
      return sum + (Number(acc.revenue) || 0);
    }, 0);

    // Calculate average health score
    const totalHealth = accounts.reduce((sum, acc) => {
      return sum + (acc.health || 0);
    }, 0);
    const averageHealthScore = totalAccounts > 0 ? totalHealth / totalAccounts : 0;

    // Return metrics in the format expected by frontend
    res.json({
      totalAccounts,
      totalTasks,
      totalRevenue,
      activeAccounts,
      atRiskAccounts,
      averageHealthScore: Math.round(averageHealthScore * 100) / 100, // Round to 2 decimal places
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        accountId: activity.accountId,
        type: activity.type,
        description: activity.description,
        date: activity.date,
        createdAt: activity.createdAt,
        account: activity.account ? {
          id: activity.account.id,
          name: activity.account.name
        } : undefined
      }))
    });
  } catch (error) {
    console.error("Get dashboard metrics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
