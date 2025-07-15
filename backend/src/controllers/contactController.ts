import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Contact } from "../entities/Contact";
import { Account } from "../entities/Account";

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const contactRepository = AppDataSource.getRepository(Contact);
    
    const contacts = await contactRepository.find({
      where: { accountId },
      order: { createdAt: "DESC" }
    });

    res.json(contacts);
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getContactById = async (req: Request, res: Response) => {
  try {
    const { accountId, contactId } = req.params;
    const contactRepository = AppDataSource.getRepository(Contact);
    
    const contact = await contactRepository.findOne({
      where: { id: contactId, accountId },
      relations: ["account", "notes"]
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    console.error("Get contact by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const contactRepository = AppDataSource.getRepository(Contact);
    const accountRepository = AppDataSource.getRepository(Account);

    // Verify account exists
    const account = await accountRepository.findOne({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const contact = contactRepository.create({
      ...req.body,
      accountId
    });
    
    const savedContact = await contactRepository.save(contact);
    res.status(201).json(savedContact);
  } catch (error) {
    console.error("Create contact error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { accountId, contactId } = req.params;
    const contactRepository = AppDataSource.getRepository(Contact);
    
    const contact = await contactRepository.findOne({
      where: { id: contactId, accountId }
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    contactRepository.merge(contact, req.body);
    const updatedContact = await contactRepository.save(contact);

    res.json(updatedContact);
  } catch (error) {
    console.error("Update contact error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { accountId, contactId } = req.params;
    const contactRepository = AppDataSource.getRepository(Contact);
    
    const contact = await contactRepository.findOne({
      where: { id: contactId, accountId }
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    await contactRepository.remove(contact);
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Delete contact error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 