"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Entry, { foreignKey: "UserId" });
      User.hasMany(models.Transaction, { foreignKey: "UserId" });
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {
          msg: "Username already in use",
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Email address already in use",
        },
        validate: {
          isEmail: {
            msg: "Must be a valid email address",
          },
          notEmpty: {
            msg: "Email is required",
          },
          notNull: {
            msg: "Email is required",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Password is required",
          },
          notNull: {
            msg: "Password is required",
          },
          len: [6, 100],
        },
      },
      tier: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "free",
        validate: {
          isIn: {
            args: [["free", "premium"]],
            msg: "Invalid tier",
          },
          notEmpty: {
            msg: "Tier is required",
          },
          notNull: {
            msg: "Tier is required",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  User.beforeCreate(async (user) => {
    const bcrypt = require("bcryptjs");
    const saltRounds = 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
  });
  User.beforeUpdate(async (user) => {
    if (user.changed("password")) {
      const bcrypt = require("bcryptjs");
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
  });
  return User;
};
