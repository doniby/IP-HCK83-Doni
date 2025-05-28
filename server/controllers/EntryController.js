const {
  User,
  Entry,
  Translation,
  Category,
  EntryCategory,
} = require("../models");
const geminiTranslate = require("../services/geminiTranslate");

class EntryController {
  static async create(req, res, next) {
    try {
      const { content, type, categoryIds, categoryNames } = req.body;
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.tier !== "premium") {
        const entryCount = await Entry.count({
          where: { UserId: userId },
        });
        if (entryCount >= 20) {
          return res
            .status(403)
            .json({ message: "Entry limit reached for non-premium users" });
        }
      }
      const newEntry = await Entry.create({
        content,
        type,
        UserId: userId,
      });
      // Generate translation using Gemini API
      const translatedText = await geminiTranslate(content);
      const translation = await Translation.create({
        translatedText,
        EntryId: newEntry.id,
      });
      // Assign categories
      let assignedCategoryIds = [];
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        assignedCategoryIds = categoryIds;
      } else {
        // Find or create the user's 'general' category
        let generalCategory = await Category.findOne({
          where: { name: "general", UserId: userId },
        });
        if (!generalCategory) {
          generalCategory = await Category.create({
            name: "general",
            UserId: userId,
          });
        }
        assignedCategoryIds = [generalCategory.id];
      }
      // If categoryNames is provided, create new categories if they don't exist
      if (Array.isArray(categoryNames) && categoryNames.length > 0) {
        for (const name of categoryNames) {
          let category = await Category.findOne({
            where: { name, UserId: userId },
          });
          if (!category) {
            category = await Category.create({ name, UserId: userId });
          }
          assignedCategoryIds.push(category.id);
        }
      }
      // Remove duplicates
      assignedCategoryIds = [...new Set(assignedCategoryIds)];
      for (const categoryId of assignedCategoryIds) {
        await EntryCategory.create({
          EntryId: newEntry.id,
          CategoryId: categoryId,
        });
      }
      res.status(201).json({ entry: newEntry, translation });
    } catch (error) {
      next(error);
    }
  }

  // Get all entries for the logged-in user, with translations and categories
  static async findAll(req, res, next) {
    try {
      const userId = req.user.id;
      const { type, categoryId } = req.query;
      const where = { UserId: userId };
      if (type) where.type = type;
      const include = [
        { model: Translation },
        { model: Category, through: { attributes: [] } },
      ];
      let entries = await Entry.findAll({ where, include });
      // Filter by category if needed
      if (categoryId) {
        entries = entries.filter((entry) =>
          entry.Categories.some((cat) => cat.id == categoryId)
        );
      }
      res.json(entries);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EntryController;
