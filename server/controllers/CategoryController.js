const { Category } = require("../models");

class CategoryController {
  // Create a new category for the logged-in user
  static async create(req, res, next) {
    try {
      const { name } = req.body;
      const userId = req.user.id;
      const category = await Category.create({ name, UserId: userId });
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  }

  // Get all categories owned by the logged-in user
  static async findAll(req, res, next) {
    try {
      const userId = req.user.id;
      const categories = await Category.findAll({ where: { UserId: userId } });
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }

  // Update a category name (ownership enforced)
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user.id;
      const category = await Category.findOne({ where: { id, UserId: userId } });
      if (!category) return res.status(404).json({ message: "Category not found" });
      category.name = name;
      await category.save();
      res.json(category);
    } catch (err) {
      next(err);
    }
  }

  // Delete a category (ownership enforced)
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const category = await Category.findOne({ where: { id, UserId: userId } });
      if (!category) return res.status(404).json({ message: "Category not found" });
      if (category.name === "general") {
        return res.status(400).json({ message: "Cannot delete the general category." });
      }
      await category.destroy();
      res.json({ message: "Category deleted" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CategoryController;
