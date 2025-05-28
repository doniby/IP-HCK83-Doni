"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class EntryCategory extends Model {
    static associate(models) {
      EntryCategory.belongsTo(models.Entry, { foreignKey: "EntryId" });
      EntryCategory.belongsTo(models.Category, { foreignKey: "CategoryId" });
    }
  }
  EntryCategory.init(
    {
      EntryId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Entries",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      CategoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      sequelize,
      modelName: "EntryCategory",
    }
  );
  return EntryCategory;
};
