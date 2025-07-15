import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { AccountActivity } from "../entities/AccountActivity";
import { Account } from "../entities/Account";

export const getAllAccountActivities = async (req: Request, res: Response) => {
  try {
    const activityRepository = AppDataSource.getRepository(AccountActivity);
    const activities = await activityRepository.find({
      relations: ["account"],
      order: { date: "DESC" }
    });

    res.json(activities);
  } catch (error) {
    console.error("Get all account activities error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAccountActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activityRepository = AppDataSource.getRepository(AccountActivity);
    
    const activity = await activityRepository.findOne({
      where: { id },
      relations: ["account"]
    });

    if (!activity) {
      return res.status(404).json({ error: "Account activity not found" });
    }

    res.json(activity);
  } catch (error) {
    console.error("Get account activity by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAccountActivity = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const activityRepository = AppDataSource.getRepository(AccountActivity);
    const accountRepository = AppDataSource.getRepository(Account);

    // Verify account exists
    const account = await accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const activity = activityRepository.create({
      ...req.body,
      accountId
    });
    
    const savedActivity = await activityRepository.save(activity);
    res.status(201).json(savedActivity);
  } catch (error) {
    console.error("Create account activity error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAccountActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activityRepository = AppDataSource.getRepository(AccountActivity);
    
    const activity = await activityRepository.findOne({ where: { id } });
    if (!activity) {
      return res.status(404).json({ error: "Account activity not found" });
    }

    activityRepository.merge(activity, req.body);
    const updatedActivity = await activityRepository.save(activity);

    res.json(updatedActivity);
  } catch (error) {
    console.error("Update account activity error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAccountActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activityRepository = AppDataSource.getRepository(AccountActivity);
    
    const activity = await activityRepository.findOne({ where: { id } });
    if (!activity) {
      return res.status(404).json({ error: "Account activity not found" });
    }

    await activityRepository.remove(activity);
    res.status(204).send();
  } catch (error) {
    console.error("Delete account activity error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 