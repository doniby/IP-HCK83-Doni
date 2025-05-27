"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class EntryCategories extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      EntryCategories.belongsTo(models.Entry, { foreignKey: "EntryId" });
      EntryCategories.belongsTo(models.Category, { foreignKey: "CategoryId" });
    }
  }
  EntryCategories.init(
    {
      EntryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Entries",
          key: "id",
        },
      },
      CategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "EntryCategories",
    }
  );
  return EntryCategories;
};
