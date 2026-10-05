const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createJob,
    getRecruiterJobs,
    getAllOpenJobs,
    updateJob,
    deleteJob
} = require("../controllers/jobController");


const router = express.Router();

// Recruiter creates job
router.post(
    "/",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    createJob
);
// Recruiter updates own job
router.put(
    "/:jobId",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    updateJob
);

// Recruiter sees own jobs
router.get(
    "/recruiter",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    getRecruiterJobs
);

// Students can see open jobs
router.get(
    "/",
    authMiddleware,
    roleMiddleware("STUDENT"),
    getAllOpenJobs
);

// Recruiter deletes own job
router.delete(
    "/:jobId",
    authMiddleware,
    roleMiddleware("RECRUITER"),
    deleteJob
);


module.exports = router;