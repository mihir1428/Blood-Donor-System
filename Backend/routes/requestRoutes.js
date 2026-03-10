const express = require("express");
const router = express.Router();
const db = require("../db");

// Create request
router.post("/add", (req, res) => {
  const { requester_name, requester_email, blood_group, location, priority, status } = req.body;

  if (!blood_group || !location || !priority) {
    return res.status(400).send("All fields are required");
  }

  const sql = `
    INSERT INTO requests (requester_name, requester_email, blood_group, location, priority, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [requester_name || "", requester_email || "", blood_group, location, priority, status || "pending"],
    (err) => {
      if (err) {
        console.log("Request add error:", err);
        return res.status(500).send("Request creation failed");
      }

      res.send("Request Created Successfully");
    }
  );
});

// Get all requests
router.get("/", (req, res) => {
  const sql = "SELECT * FROM requests ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Fetch requests error:", err);
      return res.status(500).send("Failed to fetch requests");
    }

    res.json(result);
  });
});

// Count requests
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

// Emergency count
router.get("/emergency", (req, res) => {
  const sql = "SELECT COUNT(*) AS total FROM requests WHERE priority = 'emergency'";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Emergency count error:", err);
      return res.status(500).send("Emergency count failed");
    }

    res.json(result[0]);
  });
});

module.exports = router;
