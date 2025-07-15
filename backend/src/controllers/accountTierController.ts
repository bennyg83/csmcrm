import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { AccountTier } from "../entities/AccountTier";

export const getAllAccountTiers = async (req: Request, res: Response) => {
  try {
    const tierRepository = AppDataSource.getRepository(AccountTier);
    const tiers = await tierRepository.find({
      relations: ["accounts"],
      order: { name: "ASC" }
    });

    res.json(tiers);
  } catch (error) {
    console.error("Get all account tiers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAccountTierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tierRepository = AppDataSource.getRepository(AccountTier);
    
    const tier = await tierRepository.findOne({
      where: { id },
      relations: ["accounts"]
    });

    if (!tier) {
      return res.status(404).json({ error: "Account tier not found" });
    }

    res.json(tier);
  } catch (error) {
    console.error("Get account tier by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAccountTier = async (req: Request, res: Response) => {
  try {
    const tierRepository = AppDataSource.getRepository(AccountTier);
    const tier = tierRepository.create(req.body);
    const savedTier = await tierRepository.save(tier);

    res.status(201).json(savedTier);
  } catch (error) {
    console.error("Create account tier error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAccountTier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tierRepository = AppDataSource.getRepository(AccountTier);
    
    const tier = await tierRepository.findOne({ where: { id } });
    if (!tier) {
      return res.status(404).json({ error: "Account tier not found" });
    }

    tierRepository.merge(tier, req.body);
    const updatedTier = await tierRepository.save(tier);

    res.json(updatedTier);
  } catch (error) {
    console.error("Update account tier error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAccountTier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tierRepository = AppDataSource.getRepository(AccountTier);
    
    const tier = await tierRepository.findOne({ 
      where: { id },
      relations: ["accounts"]
    });
    
    if (!tier) {
      return res.status(404).json({ error: "Account tier not found" });
    }

    // Check if tier is being used by any accounts
    if (tier.accounts && tier.accounts.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete tier that is assigned to accounts. Please reassign accounts first." 
      });
    }

    await tierRepository.remove(tier);
    res.status(204).send();
  } catch (error) {
    console.error("Delete account tier error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 