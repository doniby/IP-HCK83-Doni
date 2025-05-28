"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Entry extends Model {
    static associate(models) {
      Entry.belongsTo(models.User, { foreignKey: "UserId" });
      Entry.hasOne(models.Translation, { foreignKey: "EntryId" });
      Entry.belongsToMany(models.Category, { through: models.EntryCategory });
    }
  }
  Entry.init(
    {
      content: DataTypes.TEXT,
      type: DataTypes.STRING,
      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      sequelize,
      modelName: "Entry",
    }
  );
  return Entry;
};
