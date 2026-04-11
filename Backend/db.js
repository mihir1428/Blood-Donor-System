const mysql = require("mysql2");

const db = mysql.createPool(process.env.MYSQL_PUBLIC_URL);

db.getConnection((err, connection) => {
  if (err) {
    console.log("MySQL pool error:", err);
  } else {
    console.log("MySQL Pool Connected");
    connection.release();
  }
});

module.exports = db;
