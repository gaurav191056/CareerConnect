const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createOrUpdateProfile,
    getStudentProfile
} = require("../controllers/studentController");

const router = express.Router();

router.get(
    "/profile",
    authMiddleware,
    roleMiddleware("STUDENT"),
    getStudentProfile
);

router.post(
    "/profile",
    authMiddleware,
    roleMiddleware("STUDENT"),
    createOrUpdateProfile
);

module.exports = router;