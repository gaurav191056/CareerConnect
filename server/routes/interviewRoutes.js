const express = require("express");

const router = express.Router();

const {
    scheduleInterview,
    getJobInterviews,
    getMyInterviews,
    getInterviewHistory
} = require("../controllers/interviewController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Recruiter
router.post(
    "/",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    scheduleInterview
);

router.get(
    "/job/:jobId",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    getJobInterviews
);

// Student - Upcoming Interviews
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("STUDENT"),
    getMyInterviews
);

// Student - Interview History
router.get(
    "/history",
    authMiddleware,
    roleMiddleware("STUDENT"),
    getInterviewHistory
);

module.exports = router;