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

  static async GoogleLogin(req, res, next) {
    try {
      const { credential } = req.body;
      const { OAuth2Client } = require("google-auth-library");
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const email = payload.email;
      const username = payload.name;

      // Find or create user
      let user = await User.findOne({ where: { email } });
      if (!user) {
        user = await User.create({
          username,
          email,
          password: Math.random().toString(36).slice(-8),
        });
        await Category.create({ name: "general", UserId: user.id });
      }

      // Generate JWT
      const jwtPayload = { id: user.id, tier: user.tier };
      const token = require("jsonwebtoken").sign(jwtPayload, process.env.JWT_SECRET);

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          tier: user.tier,
          access_token: token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
