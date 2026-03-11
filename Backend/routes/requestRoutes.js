const express = require("express");
const router = express.Router();
const db = require("../db");


// CREATE BLOOD REQUEST
router.post("/add", (req, res) => {

const {
requester_name,
requester_email,
phone,
blood_group,
location,
priority
} = req.body;

if (!requester_name || !requester_email || !phone || !blood_group || !location || !priority) {
return res.status(400).send("All fields are required");
}

const sql = `
INSERT INTO requests
(requester_name, requester_email, phone, blood_group, location, priority, status)
VALUES (?, ?, ?, ?, ?, ?, 'pending')
`;

db.query(
sql,
[requester_name, requester_email, phone, blood_group, location, priority],
(err,result)=>{

if(err){
console.log("Request add error:",err);
return res.status(500).send("Request creation failed");
}

res.send("Request Created Successfully");

});

});



// GET ALL REQUESTS
router.get("/",(req,res)=>{

const sql = "SELECT * FROM requests ORDER BY id DESC";

db.query(sql,(err,result)=>{

if(err){
return res.status(500).send("Failed to fetch requests");
}

res.json(result);

});

});


// REQUEST COUNT
router.get("/count",(req,res)=>{

const sql = "SELECT COUNT(*) AS total FROM requests";

db.query(sql,(err,result)=>{

if(err){
return res.status(500).send("Count failed");
}

res.json(result[0]);

});

});


// EMERGENCY COUNT
router.get("/emergency",(req,res)=>{

const sql = "SELECT COUNT(*) AS total FROM requests WHERE priority='emergency'";

db.query(sql,(err,result)=>{

if(err){
return res.status(500).send("Emergency count failed");
}

res.json(result[0]);

});

});


module.exports = router;
