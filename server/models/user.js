"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../helpers/bcryptjs");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Entry, {
        foreignKey: "UserId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      User.hasMany(models.Category, {
        foreignKey: "UserId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          notNull: true,
          len: [3, 50],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
          notNull: true,
          len: [3, 50],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          notNull: true,
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  User.addHook("beforeCreate", (user) => {
    user.password = hashPassword(user.password);
    return user;
  });
  return User;
};
