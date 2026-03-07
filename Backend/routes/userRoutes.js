const express = require("express");
const router = express.Router();
const db = require("../db");

// Register user / donor
router.post("/register", (req, res) => {
  const { name, email, password, role, blood_group, location, phone } = req.body;

  const userSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(userSql, [name, email, password, role], (err, userResult) => {
    if (err) {
      console.log("Register error:", err);
      return res.status(500).send("Registration failed");
    }

    const userId = userResult.insertId;

    if (role === "donor") {
      const donorSql = `
        INSERT INTO donors (user_id, blood_group, location, phone, last_donation, availability)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        donorSql,
        [userId, blood_group, location, phone, null, 1],
        (donorErr) => {
          if (donorErr) {
            console.log("Donor insert error:", donorErr);
            return res.status(500).send("Donor registration failed");
          }

          return res.send("Donor Registered Successfully");
        }
      );
    } else {
      return res.send("User Registered Successfully");
    }
  });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.log("Login error:", err);
      return res.status(500).send("Login failed");
    }

    res.json(result);
  });
});

module.exports = router;