const { User, Category } = require("../models");
require("dotenv").config();

class UserController {
  static async Register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      const newUser = await User.create({
        username,
        email,
        password,
      });
      // Automatically create a 'general' category for the new user
      await Category.create({ name: "general", UserId: newUser.id });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async Login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw { status: 400, message: "Invalid email or password" };
      }

      const passwordMatch = await require("bcryptjs").compare(
        password,
        user.password
      );
      if (!passwordMatch) {
        throw { status: 400, message: "Invalid email or password" };
      }

      const payload = {
        id: user.id,
        tier: user.tier,
      };

      const token = require("jsonwebtoken").sign(
        payload,
        process.env.JWT_SECRET
      );

      res.status(200).json({
        message: "Login successful",
        user: {
          email: user.email,
          access_token: token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
