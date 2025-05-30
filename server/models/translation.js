"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Translation extends Model {
    static associate(models) {
      Translation.belongsTo(models.Entry, { foreignKey: "EntryId" });
    }
  }
  Translation.init(
    {
      translatedText: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Translated text is required",
          },
        },
      },
      EntryId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Entries",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      sequelize,
      modelName: "Translation",
    }
  );
  return Translation;
};
