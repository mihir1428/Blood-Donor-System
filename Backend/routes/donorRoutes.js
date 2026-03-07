const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all donors with user info
router.get("/", (req, res) => {
  const sql = `
    SELECT donors.id, donors.user_id, users.name, users.email,
           donors.blood_group, donors.location, donors.phone,
           donors.last_donation, donors.availability
    FROM donors
    JOIN users ON donors.user_id = users.id
    ORDER BY donors.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Fetch donors error:", err);
      return res.status(500).send("Failed to load donors");
    }

    res.json(result);
  });
});

// Search donor by blood group
router.get("/search/:blood_group", (req, res) => {
  const blood_group = req.params.blood_group;

  const sql = `
    SELECT donors.id, donors.user_id, users.name, users.email,
           donors.blood_group, donors.location, donors.phone,
           donors.last_donation, donors.availability
    FROM donors
    JOIN users ON donors.user_id = users.id
    WHERE donors.blood_group = ?
    ORDER BY donors.id DESC
  `;

  db.query(sql, [blood_group], (err, result) => {
    if (err) {
      console.log("Search donors error:", err);
      return res.status(500).send("Donor search failed");
    }

    res.json(result);
  });
});

// Get single donor profile by user id
router.get("/profile/:user_id", (req, res) => {
  const userId = req.params.user_id;

  const sql = `
    SELECT donors.*, users.name, users.email
    FROM donors
    JOIN users ON donors.user_id = users.id
    WHERE donors.user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("Fetch donor profile error:", err);
      return res.status(500).send("Failed to fetch donor profile");
    }

    res.json(result[0] || null);
  });
});

// Update donor profile
router.put("/update/:user_id", (req, res) => {
  const userId = req.params.user_id;
  const { blood_group, location, phone, last_donation } = req.body;

  const sql = `
    UPDATE donors
    SET blood_group = ?, location = ?, phone = ?, last_donation = ?
    WHERE user_id = ?
  `;

  db.query(sql, [blood_group, location, phone, last_donation, userId], (err) => {
    if (err) {
      console.log("Update donor profile error:", err);
      return res.status(500).send("Profile update failed");
    }

    res.send("Profile Updated Successfully");
  });
});

// Update availability
router.put("/availability/:user_id", (req, res) => {
  const userId = req.params.user_id;
  const { availability } = req.body;

  const sql = "UPDATE donors SET availability = ? WHERE user_id = ?";

  db.query(sql, [availability, userId], (err) => {
    if (err) {
      console.log("Update availability error:", err);
      return res.status(500).send("Availability update failed");
    }

    res.send("Availability Updated Successfully");
  });
});

// Delete donor + user (admin)
router.delete("/delete/:user_id", (req, res) => {
  const userId = req.params.user_id;

  const sql = "DELETE FROM users WHERE id = ?";

  db.query(sql, [userId], (err) => {
    if (err) {
      console.log("Delete donor error:", err);
      return res.status(500).send("Delete failed");
    }

    res.send("Donor Deleted Successfully");
  });
});

// Count donors
router.get("/count", (req, res) => {
  const sql = "SELECT COUNT(*) AS total FROM donors";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Donor count error:", err);
      return res.status(500).send("Count failed");
    }

    res.json(result[0]);
  });
});

module.exports = router;