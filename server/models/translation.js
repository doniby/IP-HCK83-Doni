"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Translation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Translation.belongsTo(models.Entry, {
        foreignKey: "EntryId",
      });
    }
  }
  Translation.init(
    {
      EntryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Entries",
          key: "id",
        },
      },
      english_text: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          notNull: true,
        },
      },
      translation_source: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [0, 100],
        },
      },
    },
    {
      sequelize,
      modelName: "Translation",
    }
  );
  return Translation;
};
