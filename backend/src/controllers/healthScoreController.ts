import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { HealthScore } from "../entities/HealthScore";
import { Account } from "../entities/Account";

export const getAllHealthScores = async (req: Request, res: Response) => {
  try {
    const healthScoreRepository = AppDataSource.getRepository(HealthScore);
    const healthScores = await healthScoreRepository.find({
      relations: ["account"],
      order: { date: "DESC" }
    });

    res.json(healthScores);
  } catch (error) {
    console.error("Get all health scores error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHealthScoreById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const healthScoreRepository = AppDataSource.getRepository(HealthScore);
    
    const healthScore = await healthScoreRepository.findOne({
      where: { id },
      relations: ["account"]
    });

    if (!healthScore) {
      return res.status(404).json({ error: "Health score not found" });
    }

    res.json(healthScore);
  } catch (error) {
    console.error("Get health score by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createHealthScore = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const healthScoreRepository = AppDataSource.getRepository(HealthScore);
    const accountRepository = AppDataSource.getRepository(Account);

    // Verify account exists
    const account = await accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const healthScore = healthScoreRepository.create({
      ...req.body,
      accountId
    });
    
    const savedHealthScore = await healthScoreRepository.save(healthScore);
    res.status(201).json(savedHealthScore);
  } catch (error) {
    console.error("Create health score error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateHealthScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const healthScoreRepository = AppDataSource.getRepository(HealthScore);
    
    const healthScore = await healthScoreRepository.findOne({ where: { id } });
    if (!healthScore) {
      return res.status(404).json({ error: "Health score not found" });
    }

    healthScoreRepository.merge(healthScore, req.body);
    const updatedHealthScore = await healthScoreRepository.save(healthScore);

    res.json(updatedHealthScore);
  } catch (error) {
    console.error("Update health score error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteHealthScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const healthScoreRepository = AppDataSource.getRepository(HealthScore);
    
    const healthScore = await healthScoreRepository.findOne({ where: { id } });
    if (!healthScore) {
      return res.status(404).json({ error: "Health score not found" });
    }

    await healthScoreRepository.remove(healthScore);
    res.status(204).send();
  } catch (error) {
    console.error("Delete health score error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 