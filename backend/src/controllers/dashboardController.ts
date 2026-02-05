import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { Task } from "../entities/Task";
import { AccountActivity } from "../entities/AccountActivity";

/** GET /dashboard/csm-workload – per-CSM stats for Phase 1 CSM dashboard */
export const getCSMWorkload = async (req: Request, res: Response) => {
  try {
    const accountRepository = AppDataSource.getRepository(Account);
    const taskRepository = AppDataSource.getRepository(Task);

    const accounts = await accountRepository.find({
      select: ["id", "customerSuccessManager", "status", "renewalDate"],
    });
    const tasks = await taskRepository.find({
      select: ["id", "accountId", "dueDate", "status"],
      where: {},
    });

    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const csmMap = new Map<string, { accounts: number; atRisk: number; overdueTasks: number; renewals90d: number }>();

    for (const a of accounts) {
      const csm = a.customerSuccessManager || "Unassigned";
      if (!csmMap.has(csm)) csmMap.set(csm, { accounts: 0, atRisk: 0, overdueTasks: 0, renewals90d: 0 });
      const row = csmMap.get(csm)!;
      row.accounts += 1;
      if (a.status === "at-risk") row.atRisk += 1;
      const renewal = a.renewalDate ? new Date(a.renewalDate as Date) : null;
      if (renewal && renewal >= now && renewal <= in90) row.renewals90d += 1;
    }

    for (const t of tasks) {
      if (!t.accountId || t.status === "Completed" || t.status === "Cancelled") continue;
      const due = t.dueDate ? new Date(t.dueDate as Date) : null;
      if (!due || due >= now) continue;
      const acc = accounts.find((a) => a.id === t.accountId);
      if (!acc) continue;
      const csm = acc.customerSuccessManager || "Unassigned";
      if (csmMap.has(csm)) csmMap.get(csm)!.overdueTasks += 1;
    }

    const workload = Array.from(csmMap.entries()).map(([customerSuccessManager, stats]) => ({
      customerSuccessManager,
      ...stats,
    }));

    res.json(workload);
  } catch (error) {
    console.error("Get CSM workload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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
