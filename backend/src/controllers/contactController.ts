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

export const inviteToPortal = async (req: Request, res: Response) => {
  try {
    const { accountId, contactId } = req.params;
    const contactRepository = AppDataSource.getRepository(Contact);
    
    const contact = await contactRepository.findOne({
      where: { id: contactId, accountId },
      relations: ["account"]
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    if (contact.hasPortalAccess) {
      return res.status(400).json({ error: "Contact already has portal access" });
    }

    // Generate invitation token
    const inviteToken = contact.generatePortalInviteToken();
    await contactRepository.save(contact);

    // In a real application, you would send an email here
    // For now, we'll return the invitation link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/setup?token=${inviteToken}`;

    res.json({
      message: "Portal invitation created successfully",
      inviteLink: inviteLink,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email
      }
    });
  } catch (error) {
    console.error("Invite to portal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const revokePortalAccess = async (req: Request, res: Response) => {
  try {
    const { accountId, contactId } = req.params;
    const contactRepository = AppDataSource.getRepository(Contact);
    
    const contact = await contactRepository.findOne({
      where: { id: contactId, accountId }
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // Revoke portal access
    contact.hasPortalAccess = false;
    contact.isPortalActive = false;
    contact.portalPassword = null;
    contact.portalInviteToken = null;
    contact.portalInviteExpiry = null;
    
    await contactRepository.save(contact);

    res.json({ message: "Portal access revoked successfully" });
  } catch (error) {
    console.error("Revoke portal access error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 