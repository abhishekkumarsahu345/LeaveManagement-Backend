const express = require("express");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const managerRoutes = require("./routes/managerRoutes");
const simpleAuth = require("./middleware/simpleAuth");

const app = express();
app.use(express.json());

// Serve frontend
app.use(express.static("frontend"));

// Public routes
app.use("/auth", authRoutes);

// Attach user from headers
app.use((req, res, next) => {
  const id = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];
  if (id && role) {
    req.user = { id: Number(id), role };
  }
  next();
});

// Protected routes
app.use(simpleAuth);
app.use(employeeRoutes);
app.use(managerRoutes);

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
