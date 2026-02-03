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
      relations: ["tier", "contacts", "tasks", "notes", "notes.contacts", "healthScores", "activities"]
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
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Bulk operations
export const bulkUpdateAccounts = async (req: Request, res: Response) => {
  try {
    const { accountIds, updates } = req.body;
    
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ error: "Account IDs array is required" });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: "Updates object is required" });
    }

    const accountRepository = AppDataSource.getRepository(Account);
    const accountTierRepository = AppDataSource.getRepository(AccountTier);

    // Validate tier if being updated
    if (updates.tierId) {
      const tier = await accountTierRepository.findOne({ where: { id: updates.tierId } });
      if (!tier) {
        return res.status(400).json({ error: "Invalid tier ID" });
      }
    }

    // Update all accounts
    const result = await accountRepository
      .createQueryBuilder()
      .update(Account)
      .set(updates)
      .whereInIds(accountIds)
      .execute();

    // Fetch updated accounts
    const updatedAccounts = await accountRepository.find({
      where: accountIds.map(id => ({ id })),
      relations: ["tier", "contacts"]
    });

    res.json({
      message: `Successfully updated ${result.affected} accounts`,
      updatedAccounts,
      affectedCount: result.affected
    });
  } catch (error) {
    console.error("Bulk update accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const bulkDeleteAccounts = async (req: Request, res: Response) => {
  try {
    const { accountIds } = req.body;
    
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ error: "Account IDs array is required" });
    }

    const accountRepository = AppDataSource.getRepository(Account);

    // Verify all accounts exist
    const accounts = await accountRepository.find({
      where: accountIds.map(id => ({ id }))
    });

    if (accounts.length !== accountIds.length) {
      return res.status(400).json({ 
        error: "Some accounts not found",
        found: accounts.length,
        requested: accountIds.length
      });
    }

    // Delete all accounts
    await accountRepository.remove(accounts);

    res.json({
      message: `Successfully deleted ${accounts.length} accounts`,
      deletedCount: accounts.length
    });
  } catch (error) {
    console.error("Bulk delete accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const bulkExportAccounts = async (req: Request, res: Response) => {
  try {
    const { accountIds, format = 'json' } = req.body;
    
    const accountRepository = AppDataSource.getRepository(Account);
    
    let accounts;
    if (accountIds && Array.isArray(accountIds) && accountIds.length > 0) {
      accounts = await accountRepository.find({
        where: accountIds.map(id => ({ id })),
        relations: ["tier", "contacts"]
      });
    } else {
      accounts = await accountRepository.find({
        relations: ["tier", "contacts"]
      });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'ID', 'Name', 'Email', 'Phone', 'Address', 'Industry', 'Website',
        'Description', 'Business Use Case', 'Tech Stack', 'Health Score',
        'Revenue', 'ARR', 'Risk Score', 'Employees', 'Status', 'Tier',
        'Account Manager', 'Customer Success Manager', 'Sales Engineer',
        'Renewal Date', 'Created At', 'Updated At'
      ];

      const csvRows = accounts.map(account => [
        account.id,
        account.name,
        account.email,
        account.phone,
        account.address,
        account.industry,
        account.website,
        account.description,
        account.businessUseCase,
        account.techStack,
        account.health,
        account.revenue,
        account.arr,
        account.riskScore,
        account.employees,
        account.status,
        account.tier?.name || '',
        account.accountManager,
        account.customerSuccessManager,
        account.salesEngineer,
        account.renewalDate,
        account.createdAt,
        account.updatedAt
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field || ''}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="accounts-export.csv"');
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        accounts,
        exportDate: new Date().toISOString(),
        totalCount: accounts.length
      });
    }
  } catch (error) {
    console.error("Bulk export accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const bulkImportAccounts = async (req: Request, res: Response) => {
  try {
    const { accounts } = req.body;
    
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ error: "Accounts array is required" });
    }

    const accountRepository = AppDataSource.getRepository(Account);
    const accountTierRepository = AppDataSource.getRepository(AccountTier);

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[]
    };

    for (const accountData of accounts) {
      try {
        // Validate tier if provided
        if (accountData.tierId) {
          const tier = await accountTierRepository.findOne({ where: { id: accountData.tierId } });
          if (!tier) {
            results.errors.push({
              account: accountData.name || 'Unknown',
              error: 'Invalid tier ID'
            });
            continue;
          }
        }

        if (accountData.id) {
          // Update existing account
          const existingAccount = await accountRepository.findOne({ where: { id: accountData.id } });
          if (existingAccount) {
            accountRepository.merge(existingAccount, accountData);
            await accountRepository.save(existingAccount);
            results.updated++;
          } else {
            results.errors.push({
              account: accountData.name || 'Unknown',
              error: 'Account not found for update'
            });
          }
        } else {
          // Create new account
          const newAccount = accountRepository.create(accountData);
          await accountRepository.save(newAccount);
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          account: accountData.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      message: `Import completed: ${results.created} created, ${results.updated} updated`,
      results
    });
  } catch (error) {
    console.error("Bulk import accounts error:", error);
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