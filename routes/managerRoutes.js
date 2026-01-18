const express = require("express");
const db = require("../db");
const router = express.Router();


router.get("/manager/profile", (req, res) => {
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.query(
    "SELECT id, name, role FROM users WHERE id=?",
    [req.user.id],
    (err, rows) => {
      if (err || !rows.length) {
        return res.status(500).json({ message: "Manager not found" });
      }
      res.json(rows[0]);
    }
  );
});


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


router.post("/manager/approve", (req, res) => {
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { requestId, comment } = req.body;

  if (!requestId) {
    return res.status(400).json({ message: "Request ID required" });
  }

  db.query(
    "SELECT * FROM leave_requests WHERE id = ?",
    [requestId],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(400).json({ message: "Request not found" });
      }

      const leave = rows[0];

      
      if (leave.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Request already processed" });
      }

      const days =
        (new Date(leave.end_date) - new Date(leave.start_date)) /
          (1000 * 60 * 60 * 24) +
        1;

      
      db.query(
        "SELECT remaining_leaves FROM leave_balance WHERE employee_id = ?",
        [leave.employee_id],
        (err, balRows) => {
          if (err || !balRows.length) {
            return res
              .status(500)
              .json({ message: "Leave balance not found" });
          }

          const remaining = balRows[0].remaining_leaves;

          if (remaining < days) {
            return res
              .status(400)
              .json({ message: "Insufficient leave balance" });
          }

         
          db.query(
            "UPDATE leave_balance SET remaining_leaves = remaining_leaves - ? WHERE employee_id = ?",
            [days, leave.employee_id],
            err => {
              if (err) {
                return res
                  .status(500)
                  .json({ message: "Failed to update balance" });
              }

              
              db.query(
                "UPDATE leave_requests SET status='approved', manager_comment=? WHERE id=?",
                [comment || "Approved", requestId],
                () => {
                  res.json({ message: "Leave approved successfully" });
                }
              );
            }
          );
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
    () => res.json({ message: "Leave rejected with comment" })
  );
});

module.exports = router;
