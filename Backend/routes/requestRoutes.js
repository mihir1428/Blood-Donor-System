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

  if (!requester_name || !requester_email || !phone || !blood_group || !location) {
    return res.status(400).send("All fields are required");
  }

  const sql = `
    INSERT INTO requests
    (requester_name, requester_email, phone, blood_group, location, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      requester_name,
      requester_email,
      phone,
      blood_group,
      location,
      priority || "normal"
    ],
    (err) => {
      if (err) {
        console.log("Add request error:", err);
        return res.status(500).send("Request creation failed");
      }

      res.send("Blood request submitted successfully");
    }
  );
});

// Get all requests
router.get("/", (req, res) => {
  const sql = "SELECT * FROM requests ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Fetch requests error:", err);
      return res.status(500).send("Failed to load requests");
    }

    res.json(result);
  });
});

// All pending emergency requests for donor notification icon/panel
router.get("/all-emergency", (req, res) => {
  const sql = `
    SELECT *
    FROM requests
    WHERE priority = 'emergency'
      AND status = 'pending'
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Fetch all emergency requests error:", err);
      return res.status(500).send("Failed to load emergency requests");
    }

    res.json(result);
  });
});

// Update request status
router.put("/status/:id", (req, res) => {
  const requestId = req.params.id;
  const { status } = req.body;

  const sql = "UPDATE requests SET status = ? WHERE id = ?";

  db.query(sql, [status, requestId], (err, result) => {
    if (err) {
      console.log("Update request status error:", err);
      return res.status(500).send("Status update failed");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Request not found");
    }

    res.send("Request status updated successfully");
  });
});

// Delete request
router.delete("/delete/:id", (req, res) => {
  const requestId = req.params.id;

  const sql = "DELETE FROM requests WHERE id = ?";

  db.query(sql, [requestId], (err, result) => {
    if (err) {
      console.log("Delete request error:", err);
      return res.status(500).send("Delete failed");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Request not found");
    }

    res.send("Request deleted successfully");
  });
});

// Total request count
router.get("/count", (req, res) => {
  const sql = "SELECT COUNT(*) AS total FROM requests";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Request count error:", err);
      return res.status(500).send("Count failed");
    }

    res.json(result[0]);
  });
});

// Emergency request count
router.get("/emergency", (req, res) => {
  const sql = "SELECT COUNT(*) AS total FROM requests WHERE priority = 'emergency'";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Emergency count error:", err);
      return res.status(500).send("Count failed");
    }

    res.json(result[0]);
  });
});

module.exports = router;
