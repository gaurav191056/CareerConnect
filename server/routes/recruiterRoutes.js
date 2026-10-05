const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createOrUpdateRecruiterProfile,
    getRecruiterProfile
} = require("../controllers/recruiterController");

const router = express.Router();

router.post(
    "/profile",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    createOrUpdateRecruiterProfile
);

router.get(
    "/profile",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    getRecruiterProfile
);

module.exports = router;