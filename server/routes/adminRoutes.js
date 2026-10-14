
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    getAdminLoginHistory
} = require("../controllers/adminController");

const router = express.Router();

router.get(
    "/login-history",
    authMiddleware,
    adminMiddleware,
    getAdminLoginHistory
);

module.exports = router;
