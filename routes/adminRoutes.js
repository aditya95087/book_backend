const express = require("express");
const { 
  getAllUsers, 
  getUserById, 
  toggleUserStatus, 
  deleteUser, 
  getAdminStats 
} = require("../controllers/adminControllers");
const { protect, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply protection and admin check to all admin routes
router.use(protect);
router.use(isAdmin);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/stats", getAdminStats);

module.exports = router;
