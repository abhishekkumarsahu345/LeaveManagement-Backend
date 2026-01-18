const express = require("express");
const db = require("../db");
const router = express.Router();

/* ================= EMPLOYEE PROFILE ================= */
router.get("/employee/profile", (req, res) => {
  if (!req.user || req.user.role !== "employee") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.query(
    "SELECT id, name FROM users WHERE id=?",
    [req.user.id],
    (err, rows) => {
      if (err || !rows.length) {
        return res.status(500).json({ message: "User not found" });
      }
      res.json(rows[0]);
    }
  );
});

/* ================= LEAVE BALANCE ================= */
router.get("/leave/balance", (req, res) => {
  if (!req.user || req.user.role !== "employee") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.query(
    "SELECT total_leaves, remaining_leaves FROM leave_balance WHERE employee_id=?",
    [req.user.id],
    (err, rows) => {
      if (err || !rows.length) {
        return res.status(500).json({ message: "Leave balance not found" });
      }
      res.json(rows[0]);
    }
  );
});

/* ================= APPLY LEAVE ================= */
router.post("/leave/apply", (req, res) => {
  if (!req.user || req.user.role !== "employee") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { leaveType, startDate, endDate, reason } = req.body;

  const days =
    (new Date(endDate) - new Date(startDate)) /
      (1000 * 60 * 60 * 24) +
    1;

  if (days <= 0) {
    return res.status(400).json({ message: "Invalid dates" });
  }

  db.query(
    `INSERT INTO leave_requests
     (employee_id, leave_type, start_date, end_date, reason)
     VALUES (?,?,?,?,?)`,
    [req.user.id, leaveType, startDate, endDate, reason],
    () => res.json({ message: "Leave sent for approval" })
  );
});
/* ================= LEAVE CALENDAR ================= */
router.get("/leave/calendar", (req, res) => {
  if (req.user.role !== "employee") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.query(
    `
    SELECT start_date, end_date
    FROM leave_requests
    WHERE employee_id = ?
    AND status = 'approved'
    `,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});


/* ================= LEAVE HISTORY ================= */
router.get("/leave/history", (req, res) => {
  if (!req.user) {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.query(
    "SELECT leave_type, start_date, end_date, reason, status FROM leave_requests WHERE employee_id=? ORDER BY id DESC",
    [req.user.id],
    (err, rows) => res.json(rows)
  );
});

module.exports = router;
