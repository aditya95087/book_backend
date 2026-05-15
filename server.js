require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

/* ================= CONSTANTS ================= */
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

/* ================= ROOT ROUTE ================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* ================= MONGODB ================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
    
    // Auto-create admin if it doesn't exist (to match frontend Admin_login.jsx)
    const adminEmail = "admin@gmail.com";
    const adminPassword = "admin123";
    
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: "System Admin",
        email: adminEmail,
        password: hashedAdminPassword,
        role: "admin",
        isRegistered: true,
        isActive: true,
      });
      console.log("👑 Default Admin Created: admin@gmail.com / admin123");
    }
  } catch (err) {
    console.error("❌ MongoDB Connection Error Details:");
    console.error("Message:", err.message);
    console.error("Code:", err.code);
    if (err.message.includes("bad auth")) {
      console.warn("💡 Tip: Check your MONGO_URI username and password in .env");
      console.warn("💡 Tip: A local MongoDB was detected on your machine. You can try: MONGO_URI=mongodb://localhost:27017/bookstore");
    }
  }
};

connectDB();

/* ================= USER SCHEMA ================= */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    isRegistered: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/* ================= AUTH MIDDLEWARE ================= */
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

/* ================= ROUTES ================= */

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      isRegistered: true,
      isActive: true,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role === "user" && user.isRegistered !== true) {
      return res.status(403).json({ message: "Please register first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account blocked" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ADMIN USERS (optional)
app.get("/admin/users", protect, isAdmin, async (req, res) => {
  const users = await User.find({}, "-password");
  res.json(users);
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});