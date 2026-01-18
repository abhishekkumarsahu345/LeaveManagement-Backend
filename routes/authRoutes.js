const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, rows) => {
      if (!rows.length) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = rows[0];
      const match =
        user.password.startsWith("$2")
          ? await bcrypt.compare(password, user.password)
          : password === user.password;

      if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        userId: user.id,
        role: user.role
      });
    }
  );
});

module.exports = router;
