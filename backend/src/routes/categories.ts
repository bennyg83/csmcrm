import { Router } from "express";
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController";
// import { auth } from "../middleware/auth";

const router = Router();

// No authentication middleware applied

// GET /api/categories - Get all categories
router.get("/", getAllCategories);

// GET /api/categories/:id - Get a specific category
router.get("/:id", getCategory);

// POST /api/categories - Create a new category
router.post("/", createCategory);

// PATCH /api/categories/:id - Update a category
router.patch("/:id", updateCategory);

// DELETE /api/categories/:id - Delete a category
router.delete("/:id", deleteCategory);

export default router; 