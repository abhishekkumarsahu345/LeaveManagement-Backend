// GET LOGGED-IN USER PROFILE (EMPLOYEE OR MANAGER)
router.get("/me", (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  db.query(
    "SELECT id, name, role FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err || !rows.length) {
        return res.status(500).json({ message: "User not found" });
      }
      res.json(rows[0]);
    }
  );
});
