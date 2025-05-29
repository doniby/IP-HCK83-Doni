const express = require("express");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require("cors")());

app.use(require("./routers"));

app.use(require("./middlewares/errorHandler"));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app; // Export the app for testing purposes
