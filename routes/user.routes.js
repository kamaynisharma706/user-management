const express = require('express');
const jwt = require("jsonwebtoken")

const app = express();
const router = express.Router();

const db = require("../db");

let users = [];
const SECRET_KEY = "your_secret_key";



// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = user; 
    next();
  });
};

router.post("/signup", async (req, res) => {
  const { userId, firstName, lastName, email, password } = req.body;

  if (!userId || !firstName || !lastName || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await db.query("SELECT * FROM tlcsalesforce.users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: "User already exists" })
    }

    const result = await db.query("INSERT INTO tlcsalesforce.users (user_id, first_name, last_name, email, password) VALUES ($1,$2,$3,$4, $5) RETURNING user_id, first_name, last_name, email", [userId, firstName, lastName, email, password])
    res.status(201).json({
      message: "Signup successful.",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal server error." });
  }

});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const result = await db.query("SELECT * FROM tlcsalesforce.users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Invalid password." });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });

  res.status(200).json({
    message: "Login successful.",token
  });
})

router.put("/update/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, email, password } = req.body;

  const result = await db.query("SELECT * FROM tlcsalesforce.users WHERE user_id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const updatedUser = await db.query(
      "UPDATE tlcsalesforce.users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), email = COALESCE($3, email), password = COALESCE($4, password) WHERE user_id = $5 RETURNING user_id, first_name, email",
      [firstName, lastName, email, password, userId]
    );

    res.status(200).json({
      message: "User details updated successfully.",
      user: updatedUser.rows[0],
    });
});


router.get("/get", authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT user_id, first_name, email FROM tlcsalesforce.users");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal server error." });
  }
});



router.get("/get/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const result = await db.query("SELECT user_id, first_name, email FROM tlcsalesforce.users WHERE user_id = $1", [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
