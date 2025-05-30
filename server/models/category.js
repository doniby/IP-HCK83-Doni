"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.belongsToMany(models.Entry, { through: models.EntryCategory });
      Category.belongsTo(models.User, { foreignKey: "UserId" });
    }
  }  Category.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Category name is required",
          },
        },
      },
      UserId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Category",
      indexes: [
        {
          unique: true,
          fields: ['name', 'UserId'],
          name: 'unique_category_per_user'
        }
      ]
    }
  );
  return Category;
};
