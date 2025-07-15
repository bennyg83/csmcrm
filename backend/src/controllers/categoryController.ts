import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Category } from "../entities";

const categoryRepository = AppDataSource.getRepository(Category);

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryRepository.find({
      where: { isActive: true },
      order: { name: "ASC" }
    });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await categoryRepository.findOne({
      where: { id, isActive: true }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const existingCategory = await categoryRepository.findOne({
      where: { name, isActive: true }
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category with this name already exists" });
    }

    const category = categoryRepository.create({
      name,
      description,
      color: color || "#1976d2"
    });

    const savedCategory = await categoryRepository.save(category);
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive } = req.body;

    const category = await categoryRepository.findOne({
      where: { id, isActive: true }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (name && name !== category.name) {
      const existingCategory = await categoryRepository.findOne({
        where: { name, isActive: true }
      });

      if (existingCategory && existingCategory.id !== id) {
        return res.status(400).json({ error: "Category with this name already exists" });
      }
    }

    categoryRepository.merge(category, {
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      color: color || category.color,
      isActive: isActive !== undefined ? isActive : category.isActive
    });

    const updatedCategory = await categoryRepository.save(category);
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await categoryRepository.findOne({
      where: { id, isActive: true }
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Soft delete by setting isActive to false
    category.isActive = false;
    await categoryRepository.save(category);

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
}; 