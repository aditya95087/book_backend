require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Import User Model for initial setup
const User = require("./models/User");

const app = express();

/* ================= MIDDLEWARE ================= */
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );
// app.use(express.json());


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://book-front-rho.vercel.app"
    ],
    credentials: true,
  })
);

app.use(express.json());

/* ================= ROOT ROUTE ================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* ================= MONGODB ================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
    
    // Auto-create admin if it doesn't exist
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
    console.error("❌ MongoDB Connection Error:", err.message);
  }
};

connectDB();

/* ================= ROUTES ================= */
// Auth routes (mounted at root for /login and /register)
app.use("/", authRoutes);

// Admin routes (mounted at /admin for /admin/users, /admin/stats, etc.)
app.use("/admin", adminRoutes);

/* ================= SERVER EXPORT ================= */
// Export for Vercel
module.exports = app;

// Also listen locally for development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}