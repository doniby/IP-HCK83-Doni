const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '5kb' })); // Set a 5KB limit for testing
app.use(require("cors")());

app.use(require("./routers"));

// Catch-all 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(require("./middlewares/errorHandler"));


module.exports = app; // Export the app for testing purposes
