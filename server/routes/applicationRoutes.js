const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    applyForJob,
    getMyApplications,
    getJobApplicants,
    evaluateApplicants,
    autoShortlistApplicants,
    rejectApplicant,
    getShortlistedApplicants
} = require("../controllers/applicationController");

const router = express.Router();


// ============================================
// STUDENT ROUTES
// ============================================

// Apply for a job
router.post(
    "/",
    authMiddleware,
    roleMiddleware("STUDENT"),
    applyForJob
);


// Get my applications
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("STUDENT"),
    getMyApplications
);


// ============================================
// RECRUITER ROUTES
// ============================================

// Get applicants for a job
router.get(
    "/job/:jobId/applicants",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    getJobApplicants
);


// Evaluate applicants
router.get(
    "/job/:jobId/evaluate",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    evaluateApplicants
);


// Automatically shortlist applicants
router.post(
    "/job/:jobId/auto-shortlist",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    autoShortlistApplicants
);


// Reject an applicant
router.put(
    "/job/:jobId/applicant/:applicationId/reject",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    rejectApplicant
);


// Get shortlisted applicants
router.get(
    "/job/:jobId/shortlisted",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    getShortlistedApplicants
);


module.exports = router;