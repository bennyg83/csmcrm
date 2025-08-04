import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { Contact } from "../entities/Contact";

export interface PortalAuthRequest extends Request {
  contact?: Contact;
}

export const portalAuth = async (req: PortalAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if this is an external contact token
    if (decoded.type !== "external" || !decoded.contactId) {
      return res.status(401).json({ error: "Invalid portal token" });
    }

    const contactRepository = AppDataSource.getRepository(Contact);
    const contact = await contactRepository.findOne({
      where: { 
        id: decoded.contactId, 
        hasPortalAccess: true, 
        isPortalActive: true 
      },
      relations: ["account"]
    });

    if (!contact) {
      return res.status(401).json({ error: "Portal access denied" });
    }

    req.contact = contact;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};