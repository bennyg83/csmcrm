import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { AccountTier } from "../entities/AccountTier";
import { AccountActivity } from "../entities/AccountActivity";

export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const accountRepository = AppDataSource.getRepository(Account);
    const accounts = await accountRepository.find({
      relations: ["tier", "contacts"],
      order: { createdAt: "DESC" }
    });

    res.json(accounts);
  } catch (error) {
    console.error("Get all accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accountRepository = AppDataSource.getRepository(Account);
    
    const account = await accountRepository.findOne({
      where: { id },
      relations: ["tier", "contacts", "tasks", "notes", "healthScores", "activities"]
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (error) {
    console.error("Get account by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const accountRepository = AppDataSource.getRepository(Account);
    const accountTierRepository = AppDataSource.getRepository(AccountTier);

    // Verify tier exists
    const tier = await accountTierRepository.findOne({ where: { id: req.body.tierId } });
    if (!tier) {
      return res.status(400).json({ error: "Invalid tier ID" });
    }

    const account = accountRepository.create(req.body);
    const savedAccount = await accountRepository.save(account);

    res.status(201).json(savedAccount);
  } catch (error) {
    console.error("Create account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accountRepository = AppDataSource.getRepository(Account);
    
    const account = await accountRepository.findOne({ where: { id } });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // If tierId is being updated, verify it exists
    if (req.body.tierId) {
      const accountTierRepository = AppDataSource.getRepository(AccountTier);
      const tier = await accountTierRepository.findOne({ where: { id: req.body.tierId } });
      if (!tier) {
        return res.status(400).json({ error: "Invalid tier ID" });
      }
    }

    accountRepository.merge(account, req.body);
    const updatedAccount = await accountRepository.save(account);

    res.json(updatedAccount);
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accountRepository = AppDataSource.getRepository(Account);
    
    const account = await accountRepository.findOne({ where: { id } });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    await accountRepository.remove(account);
    res.status(204).send();
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const activityRepository = AppDataSource.getRepository(AccountActivity);
    const activities = await activityRepository.find({
      relations: ["account"],
      order: { date: "DESC" },
      take: 10
    });

    res.json(activities);
  } catch (error) {
    console.error("Get recent activities error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 