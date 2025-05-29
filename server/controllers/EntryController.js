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
        throw { status: 404, message: "User not found" };
      }
      if (user.tier !== "premium") {
        const entryCount = await Entry.count({
          where: { UserId: userId },
        });
        if (entryCount >= 20) {
          throw {
            status: 403,
            message: "Entry limit reached for non-premium users",
          };
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
      res.status(200).json(entries);
    } catch (error) {
      next(error);
    }
  }

  // Update an entry (ownership enforced)
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { content, type, categoryIds, categoryNames } = req.body;
      const userId = req.user.id;
      const entry = await Entry.findOne({ where: { id, UserId: userId } });
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      if (content) entry.content = content;
      if (type) entry.type = type;
      await entry.save();
      // Update categories if provided
      if (
        (Array.isArray(categoryIds) && categoryIds.length > 0) ||
        (Array.isArray(categoryNames) && categoryNames.length > 0)
      ) {
        // Remove old links
        await EntryCategory.destroy({ where: { EntryId: entry.id } });
        let assignedCategoryIds = [];
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
          assignedCategoryIds = categoryIds;
        }
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
            EntryId: entry.id,
            CategoryId: categoryId,
          });
        }
      }
      res.json({ message: "Entry updated", entry });
    } catch (err) {
      next(err);
    }
  }

  // Delete an entry (ownership enforced)
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const entry = await Entry.findOne({ where: { id, UserId: userId } });
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      // Remove translation
      await Translation.destroy({ where: { EntryId: entry.id } });
      // Remove category links
      await EntryCategory.destroy({ where: { EntryId: entry.id } });
      await entry.destroy();
      res.json({ message: "Entry deleted" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EntryController;
