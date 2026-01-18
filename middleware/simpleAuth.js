const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/manager/requests", (req, res) => {
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.query(
    `
    SELECT 
      lr.id,
      u.name AS employee_name,
      lr.leave_type,
      lr.start_date,
      lr.end_date,
      lr.reason
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    WHERE lr.status = 'pending'
    ORDER BY lr.id DESC
    `,
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(results);
    }
  );
});
module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};


router.post("/manager/approve", (req, res) => {
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { requestId } = req.body;

  db.query(
    "SELECT * FROM leave_requests WHERE id=?",
    [requestId],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(400).json({ message: "Request not found" });
      }

      const leave = rows[0];
      const days =
        (new Date(leave.end_date) - new Date(leave.start_date)) /
          (1000 * 60 * 60 * 24) +
        1;

      db.query(
        "SELECT remaining_leaves FROM leave_balance WHERE employee_id=?",
        [leave.employee_id],
        (err, bal) => {
          if (bal[0].remaining_leaves < days) {
            return res
              .status(400)
              .json({ message: "Insufficient leave balance" });
          }

        
          db.query(
            "UPDATE leave_balance SET remaining_leaves = remaining_leaves - ? WHERE employee_id=?",
            [days, leave.employee_id]
          );

          db.query(
            "UPDATE leave_requests SET status='approved' WHERE id=?",
            [requestId]
          );

          res.json({ message: "Leave approved successfully" });
        }
      );
    }
  );
});


router.post("/manager/reject", (req, res) => {
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { requestId, comment } = req.body;

  db.query(
    "UPDATE leave_requests SET status='rejected', manager_comment=? WHERE id=?",
    [comment || "Rejected by manager", requestId],
    () => res.json({ message: "Leave rejected" })
  );
});
 module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
module.exports = router;
