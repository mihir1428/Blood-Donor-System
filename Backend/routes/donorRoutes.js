const express = require("express");
const router = express.Router();
const db = require("../db");

function buildEligibility(lastDonation) {
  if (!lastDonation) {
    return {
      eligible: true,
      eligibility_text: "Eligible now"
    };
  }

  const today = new Date();
  const lastDate = new Date(lastDonation);
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 90) {
    return {
      eligible: true,
      eligibility_text: "Eligible now"
    };
  }

  return {
    eligible: false,
    eligibility_text: `Wait ${90 - diffDays} more day(s)`
  };
}

function mapDonor(donor) {
  const eligibility = buildEligibility(donor.last_donation);
  return {
    ...donor,
    eligible: eligibility.eligible,
    eligibility_text: eligibility.eligibility_text
  };
}

// Get all donors
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

    res.json(result.map(mapDonor));
  });
});

// Blood-group wise count for dashboard cards
router.get("/group-counts", (req, res) => {
  const sql = `
    SELECT blood_group, COUNT(*) AS total
    FROM donors
    WHERE availability = 1
    GROUP BY blood_group
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Group count error:", err);
      return res.status(500).send("Failed to load blood group counts");
    }

    const counts = {
      "A+": 0,
      "A-": 0,
      "B+": 0,
      "B-": 0,
      "O+": 0,
      "O-": 0,
      "AB+": 0,
      "AB-": 0
    };

    result.forEach((row) => {
      counts[row.blood_group] = row.total;
    });

    res.json(counts);
  });
});

// Advanced search
router.get("/search", (req, res) => {
  const { blood_group = "", location = "", availability = "", emergency = "" } = req.query;

  let sql = `
    SELECT donors.id, donors.user_id, users.name, users.email,
           donors.blood_group, donors.location, donors.phone,
           donors.last_donation, donors.availability
    FROM donors
    JOIN users ON donors.user_id = users.id
    WHERE 1=1
  `;

  const params = [];

  if (blood_group) {
    sql += ` AND donors.blood_group = ?`;
    params.push(blood_group);
  }

  if (location) {
    sql += ` AND LOWER(donors.location) LIKE ?`;
    params.push(`%${location.toLowerCase()}%`);
  }

  if (availability !== "") {
    sql += ` AND donors.availability = ?`;
    params.push(Number(availability));
  }

  sql += ` ORDER BY donors.availability DESC, donors.id DESC`;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.log("Advanced search error:", err);
      return res.status(500).send("Donor search failed");
    }

    let donors = result.map(mapDonor);

    if (emergency === "1") {
      donors = donors.sort((a, b) => {
        if (a.available !== b.available) return b.available - a.available;
        if (a.eligible !== b.eligible) return Number(b.eligible) - Number(a.eligible);
        return 0;
      });
    }

    res.json(donors);
  });
});

// Search by blood group
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

    res.json(result.map(mapDonor));
  });
});

// Get donor profile by user id
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

    if (!result[0]) {
      return res.json(null);
    }

    res.json(mapDonor(result[0]));
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

  db.query(sql, [blood_group, location, phone, last_donation || null, userId], (err) => {
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

// Delete donor
router.delete("/delete/:user_id", (req, res) => {
  const userId = req.params.user_id;

  const sql1 = "DELETE FROM donors WHERE user_id = ?";
  const sql2 = "DELETE FROM users WHERE id = ?";

  db.query(sql1, [userId], (err1) => {
    if (err1) {
      console.log("Delete donor row error:", err1);
      return res.status(500).send("Delete failed");
    }

    db.query(sql2, [userId], (err2) => {
      if (err2) {
        console.log("Delete user error:", err2);
        return res.status(500).send("Delete failed");
      }

      res.send("Donor Deleted Successfully");
    });
  });
});

// Total donor count
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
