"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.belongsToMany(models.Entry, { through: models.EntryCategory });
      Category.belongsTo(models.User, { foreignKey: "UserId" });
    }
  }
  Category.init(
    {
      name: DataTypes.STRING,
      UserId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Category",
    }
  );
  return Category;
};
