const express = require("express");
const router = express.Router();
const db = require("../db");

// Register
router.post("/register", (req, res) => {
  const { name, email, password, role, blood_group, location, phone } = req.body;

  if (!name || !email || !password || !role || !phone) {
    return res.status(400).send("All required fields must be filled");
  }

  if ((role === "donor" || role === "requester") && (!blood_group || !location)) {
    return res.status(400).send("Blood group and location are required");
  }

  const checkSql = "SELECT id FROM users WHERE email = ?";

  db.query(checkSql, [email], (checkErr, checkResult) => {
    if (checkErr) {
      console.log("Email check error:", checkErr);
      return res.status(500).send("Registration failed");
    }

    if (checkResult.length > 0) {
      return res.status(400).send("Email already exists");
    }

    const userSql = `
      INSERT INTO users (name, email, password, phone, role, blood_group, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      userSql,
      [name, email, password, phone, role, blood_group || "", location || ""],
      (err, userResult) => {
        if (err) {
          console.log("Register user error:", err);
          return res.status(500).send("Registration failed");
        }

        const userId = userResult.insertId;

        if (role === "donor") {
          const donorSql = `
            INSERT INTO donors (user_id, name, email, blood_group, location, phone, last_donation, availability)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            donorSql,
            [userId, name, email, blood_group || "", location || "", phone || "", null, 1],
            (donorErr) => {
              if (donorErr) {
                console.log("Register donor error:", donorErr);
                return res.status(500).send("Donor registration failed");
              }

              return res.send("Donor Registered Successfully");
            }
          );
        } else {
          return res.send("Requester Registered Successfully");
        }
      }
    );
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

    if (!result.length) {
      return res.status(401).send("Invalid email or password");
    }

    res.json(result);
  });
});

// Get all users
router.get("/", (req, res) => {
  const sql = "SELECT * FROM users ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Fetch users error:", err);
      return res.status(500).send("Failed to fetch users");
    }

    res.json(result);
  });
});

// Delete user
router.delete("/delete/:id", (req, res) => {
  const userId = req.params.id;

  const sql = "DELETE FROM users WHERE id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("Delete user error:", err);
      return res.status(500).send("Delete failed");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("User not found");
    }

    res.send("User deleted successfully");
  });
});

module.exports = router;
