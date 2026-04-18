const express = require("express");
const router = express.Router();
const db = require("../db");

// Add blood request
router.post("/add", (req, res) => {
  const {
    requester_name,
    requester_email,
    phone,
    blood_group,
    location,
    priority
  } = req.body;

  // Basic validation
  if (
    !requester_name ||
    !requester_email ||
    !phone ||
    !blood_group ||
    !location ||
    !priority
  ) {
    return res.status(400).send("All fields are required");
  }

  const sql = `
    INSERT INTO requests
    (requester_name, requester_email, phone, blood_group, location, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      requester_name,
      requester_email,
      phone,
      blood_group,
      location,
      priority || "normal",
      "pending"
    ],
    (err, result) => {
      if (err) {
        console.log("Add request error:", err.sqlMessage || err);
        return res.status(500).send("Request creation failed");
      }

      res.status(201).send("Blood request submitted successfully");
    }
  );
});

// Get all requests
router.get("/", (req, res) => {
  const sql = "SELECT * FROM requests ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Get requests error:", err.sqlMessage || err);
      return res.status(500).send("Failed to fetch requests");
    }

    res.json(results);
  });
});

// Update request status
router.put("/status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send("Status is required");
  }

  const sql = "UPDATE requests SET status = ? WHERE id = ?";

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.log("Update status error:", err.sqlMessage || err);
      return res.status(500).send("Failed to update request status");
    }

    res.send("Request status updated successfully");
  });
});

// Delete request
router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM requests WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log("Delete request error:", err.sqlMessage || err);
      return res.status(500).send("Failed to delete request");
    }

    res.send("Request deleted successfully");
  });
});

// Count all requests
router.get("/count", (req, res) => {
  const sql = "SELECT COUNT(*) AS totalRequests FROM requests";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Request count error:", err.sqlMessage || err);
      return res.status(500).send("Failed to count requests");
    }

    res.json(results[0]);
  });
});

// Count emergency requests
router.get("/emergency", (req, res) => {
  const sql = "SELECT COUNT(*) AS emergencyRequests FROM requests WHERE priority = 'emergency'";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Emergency count error:", err.sqlMessage || err);
      return res.status(500).send("Failed to count emergency requests");
    }

    res.json(results[0]);
  });
});

// Get all pending emergency requests
router.get("/all-emergency", (req, res) => {
  const sql = `
    SELECT * FROM requests
    WHERE priority = 'emergency' AND status = 'pending'
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log("All emergency requests error:", err.sqlMessage || err);
      return res.status(500).send("Failed to fetch emergency requests");
    }

    res.json(results);
  });
});

module.exports = router;
