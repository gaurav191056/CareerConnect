const pool = require("../config/db");

// Normalize common branch abbreviations and full names before comparing.
// CE intentionally means Computer Engineering (not Civil Engineering).
const normalizeBranch = (value) => {
    const text = String(value || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");

    const aliases = {
        "cse": "CSE",
        "computer science": "CSE",
        "computer science engineering": "CSE",
        "computer science and engineering": "CSE",
        "cs": "CSE",
        "it": "IT",
        "information technology": "IT",
        "eee": "EEE",
        "electrical electronics": "EEE",
        "electrical and electronics": "EEE",
        "electrical and electronics engineering": "EEE",
        "electrical electronics engineering": "EEE",
        "ece": "ECE",
        "electronics and communication": "ECE",
        "electronics and communication engineering": "ECE",
        "electronics communication engineering": "ECE",
        "ce": "CE",
        "computer engineering": "CE",
        "computer engineering technology": "CE",
        "civil": "CIVIL",
        "civil engineering": "CIVIL",
        "me": "ME",
        "mechanical": "ME",
        "mechanical engineering": "ME",
        "ee": "EE",
        "electrical engineering": "EE",
        "electrical": "EE",
        "ai": "AI",
        "artificial intelligence": "AI",
        "aiml": "AIML",
        "ai ml": "AIML",
        "artificial intelligence and machine learning": "AIML",
        "ds": "DS",
        "data science": "DS",
        "cs ds": "CSD",
        "computer science and data science": "CSD",
        "cs ai": "CSAI",
        "computer science and artificial intelligence": "CSAI",
        "iot": "IOT",
        "internet of things": "IOT",
        "aids": "AIDS",
        "artificial intelligence and data science": "AIDS",
        "etc": "ETC",
        "electronics and telecommunications": "ETC",
        "electronics and telecommunications engineering": "ETC",
        "chemical": "CHEMICAL",
        "chemical engineering": "CHEMICAL",
        "biotech": "BIOTECH",
        "biotechnology": "BIOTECH",
        "biomedical": "BIOMEDICAL",
        "biomedical engineering": "BIOMEDICAL",
        "aero": "AERO",
        "aerospace engineering": "AERO",
        "aeronautical engineering": "AERO",
        "production": "PRODUCTION",
        "production engineering": "PRODUCTION",
        "instrumentation": "INSTRUMENTATION",
        "instrumentation engineering": "INSTRUMENTATION"
    };

    return aliases[text] || text.toUpperCase();
};

// Recruiters can enter several branches separated by commas, slashes, or semicolons.
const parseRequiredBranches = (value) => {
    if (!value || !String(value).trim()) return [];
    return String(value)
        .split(/[,;/|]+/)
        .map((branch) => branch.trim())
        .filter(Boolean)
        .map(normalizeBranch);
};

const isBranchEligible = (studentBranch, requiredBranchesValue) => {
    const requiredBranches = parseRequiredBranches(requiredBranchesValue);
    if (requiredBranches.length === 0) return true;
    if (!studentBranch || !String(studentBranch).trim()) return false;

    // Student profiles normally store one branch; split defensively if a profile
    // contains multiple values.
    const studentBranches = parseRequiredBranches(studentBranch);
    return studentBranches.some((branch) => requiredBranches.includes(branch));
};


// =====================================================
// STUDENT: APPLY FOR JOB
// POST /api/applications
// =====================================================

const applyForJob = async (req, res) => {
    try {
        console.log("APPLY REQUEST BODY:", req.body);
        console.log("APPLY USER:", req.user);

        const studentId = req.user.id;
        const { job_id } = req.body;

        console.log("JOB ID:", job_id);

        if (!job_id) {
            return res.status(400).json({
                message: "Job ID is required"
            });
        }

        // Check job exists and is open
        const [jobs] = await pool.execute(
            `
            SELECT id
            FROM jobs
            WHERE id = ? AND status = 'OPEN'
            `,
            [job_id]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                message: "Job not found or job is closed"
            });
        }

        // Check duplicate application
        const [existingApplication] = await pool.execute(
            `
            SELECT id
            FROM applications
            WHERE job_id = ? AND student_id = ?
            `,
            [job_id, studentId]
        );

        if (existingApplication.length > 0) {
            return res.status(409).json({
                message: "You have already applied for this job"
            });
        }

        // Create application
        const [result] = await pool.execute(
            `
            INSERT INTO applications
            (job_id, student_id)
            VALUES (?, ?)
            `,
            [job_id, studentId]
        );

        return res.status(201).json({
            message: "Application submitted successfully",
            applicationId: result.insertId
        });

    } catch (error) {
        console.error("APPLY JOB ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// STUDENT: GET MY APPLICATIONS
// GET /api/applications/my
// =====================================================

const getMyApplications = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [applications] = await pool.execute(
            `
            SELECT
                a.id AS application_id,
                a.status,
                a.applied_at,
                j.id AS job_id,
                j.title,
                j.location,
                j.salary,
                u.name AS recruiter_name
            FROM applications a
            JOIN jobs j
                ON a.job_id = j.id
            JOIN users u
                ON j.recruiter_id = u.id
            WHERE a.student_id = ?
            ORDER BY a.applied_at DESC
            `,
            [studentId]
        );

        return res.json({
            totalApplications: applications.length,
            applications
        });

    } catch (error) {
        console.error("GET APPLICATIONS ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// RECRUITER: GET JOB APPLICANTS
// GET /api/applications/job/:jobId/applicants
// =====================================================

const getJobApplicants = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId } = req.params;

        const [jobs] = await pool.execute(
            `
            SELECT id, title
            FROM jobs
            WHERE id = ? AND recruiter_id = ?
            `,
            [jobId, recruiterId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                message: "Job not found or access denied"
            });
        }

        const [applicants] = await pool.execute(
            `
            SELECT
                a.id AS application_id,
                a.status,
                a.applied_at,
                u.id AS student_id,
                u.name,
                u.email,
                sp.phone,
                sp.college,
                sp.degree,
                sp.branch,
                sp.cgpa,
                sp.graduation_year,
                sp.skills,
                sp.projects,
                sp.certifications,
                sp.internships,
                sp.resume_url
            FROM applications a
            JOIN users u
                ON a.student_id = u.id
            LEFT JOIN student_profiles sp
                ON a.student_id = sp.user_id
            WHERE a.job_id = ?
            ORDER BY a.applied_at DESC
            `,
            [jobId]
        );

        return res.json({
            job: jobs[0],
            applicants
        });

    } catch (error) {
        console.error("GET JOB APPLICANTS ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// RECRUITER: EVALUATE APPLICANTS
// GET /api/applications/job/:jobId/evaluate
// =====================================================

const evaluateApplicants = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId } = req.params;

        const [jobs] = await pool.execute(
            `
            SELECT *
            FROM jobs
            WHERE id = ? AND recruiter_id = ?
            `,
            [jobId, recruiterId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                message: "Job not found or access denied"
            });
        }

        const job = jobs[0];

        const [applicants] = await pool.execute(
            `
            SELECT
                a.id AS application_id,
                a.student_id,
                a.status,
                u.name,
                u.email,
                sp.cgpa,
                sp.branch,
                sp.graduation_year,
                sp.skills
            FROM applications a
            JOIN users u
                ON a.student_id = u.id
            LEFT JOIN student_profiles sp
                ON a.student_id = sp.user_id
            WHERE a.job_id = ?
            `,
            [jobId]
        );

        const evaluatedApplicants = applicants.map((student) => {
            const cgpaEligible =
                student.cgpa !== null &&
                (
                    job.min_cgpa === null ||
                    Number(student.cgpa) >= Number(job.min_cgpa)
                );

            const branchEligible = isBranchEligible(
                student.branch,
                job.required_branch
            );

            const yearEligible =
                !job.graduation_year ||
                (
                    student.graduation_year &&
                    Number(student.graduation_year) ===
                    Number(job.graduation_year)
                );

            const studentSkills = (student.skills || "")
                .toLowerCase()
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);

            const requiredSkills = (job.required_skills || "")
                .toLowerCase()
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);

            const matchedSkills = requiredSkills.filter((skill) =>
                studentSkills.includes(skill)
            );

            const skillsEligible =
                requiredSkills.length === 0 ||
                matchedSkills.length > 0;

            const eligible =
                cgpaEligible &&
                branchEligible &&
                yearEligible &&
                skillsEligible;

            let score = 0;

            if (cgpaEligible) score += 40;
            if (branchEligible) score += 20;
            if (yearEligible) score += 20;

            if (requiredSkills.length > 0) {
                score += Math.round(
                    (matchedSkills.length / requiredSkills.length) * 20
                );
            } else {
                score += 20;
            }

            return {
                application_id: student.application_id,
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                cgpa: student.cgpa,
                branch: student.branch,
                graduation_year: student.graduation_year,
                matched_skills: matchedSkills,
                status: student.status,
                eligible,
                score
            };
        });

        evaluatedApplicants.sort(
            (a, b) => b.score - a.score
        );

        return res.json({
            job: {
                id: job.id,
                title: job.title,
                min_cgpa: job.min_cgpa,
                required_branch: job.required_branch,
                required_skills: job.required_skills,
                graduation_year: job.graduation_year
            },
            applicants: evaluatedApplicants
        });

    } catch (error) {
        console.error("EVALUATE APPLICANTS ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// RECRUITER: AUTO SHORTLIST
// POST /api/applications/job/:jobId/auto-shortlist
// =====================================================

const autoShortlistApplicants = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId } = req.params;

        const [jobs] = await pool.execute(
            `
            SELECT *
            FROM jobs
            WHERE id = ? AND recruiter_id = ?
            `,
            [jobId, recruiterId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                message: "Job not found or access denied"
            });
        }

        const job = jobs[0];

        const [applicants] = await pool.execute(
            `
            SELECT
                a.id AS application_id,
                a.student_id,
                a.status,
                u.name,
                u.email,
                sp.cgpa,
                sp.branch,
                sp.graduation_year,
                sp.skills
            FROM applications a
            JOIN users u
                ON a.student_id = u.id
            LEFT JOIN student_profiles sp
                ON a.student_id = sp.user_id
            WHERE a.job_id = ?
            `,
            [jobId]
        );

        const evaluated = applicants.map((student) => {
            const cgpaEligible =
                student.cgpa !== null &&
                (
                    job.min_cgpa === null ||
                    Number(student.cgpa) >= Number(job.min_cgpa)
                );

            const branchEligible = isBranchEligible(
                student.branch,
                job.required_branch
            );

            const yearEligible =
                !job.graduation_year ||
                (
                    student.graduation_year &&
                    Number(student.graduation_year) ===
                    Number(job.graduation_year)
                );

            const studentSkills = (student.skills || "")
                .toLowerCase()
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);

            const requiredSkills = (job.required_skills || "")
                .toLowerCase()
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);

            const matchedSkills = requiredSkills.filter((skill) =>
                studentSkills.includes(skill)
            );

            const skillsEligible =
                requiredSkills.length === 0 ||
                matchedSkills.length > 0;

            const eligible =
                cgpaEligible &&
                branchEligible &&
                yearEligible &&
                skillsEligible;

            let score = 0;

            if (cgpaEligible) score += 40;
            if (branchEligible) score += 20;
            if (yearEligible) score += 20;

            if (requiredSkills.length > 0) {
                score += Math.round(
                    (matchedSkills.length / requiredSkills.length) * 20
                );
            } else {
                score += 20;
            }

            return {
                application_id: student.application_id,
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                cgpa: student.cgpa,
                branch: student.branch,
                graduation_year: student.graduation_year,
                matched_skills: matchedSkills,
                status: student.status,
                eligible,
                score
            };
        });

        const eligibleApplicants = evaluated
            .filter((student) =>
                student.eligible &&
                student.status !== "REJECTED"
            )
            .sort(
                (a, b) => b.score - a.score
            );

        const shortlisted = eligibleApplicants;

        // Reset only active applications.
        // REJECTED applications must remain REJECTED.
        await pool.execute(
            `
            UPDATE applications
            SET status = 'APPLIED'
            WHERE job_id = ?
            AND status <> 'REJECTED'
            `,
            [jobId]
        );

        for (const student of shortlisted) {
            await pool.execute(
                `
                UPDATE applications
                SET status = 'SHORTLISTED'
                WHERE id = ?
                `,
                [student.application_id]
            );
        }

        return res.json({
            message: "Automatic shortlisting completed",
            jobId,
            totalApplicants: applicants.length,
            eligibleApplicants: eligibleApplicants.length,
            shortlisted
        });

    } catch (error) {
        console.error("AUTO SHORTLIST ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// RECRUITER: REJECT APPLICANT
// PUT /api/applications/job/:jobId/applicant/:applicationId/reject
// =====================================================

const rejectApplicant = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId, applicationId } = req.params;

        // Verify that this job belongs to this recruiter
        const [jobs] = await pool.execute(
            `
            SELECT id, title
            FROM jobs
            WHERE id = ? AND recruiter_id = ?
            `,
            [jobId, recruiterId]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                message: "Job not found or access denied"
            });
        }

        // Verify that application belongs to this job
        const [applications] = await pool.execute(
            `
            SELECT id, status
            FROM applications
            WHERE id = ? AND job_id = ?
            `,
            [applicationId, jobId]
        );

        if (applications.length === 0) {
            return res.status(404).json({
                message: "Application not found for this job"
            });
        }

        const currentStatus = applications[0].status;

        // Prevent rejecting an already rejected application
        if (currentStatus === "REJECTED") {
            return res.status(400).json({
                message: "Application is already rejected"
            });
        }

        // Update application status
        await pool.execute(
            `
            UPDATE applications
            SET status = 'REJECTED'
            WHERE id = ? AND job_id = ?
            `,
            [applicationId, jobId]
        );

        return res.json({
            message: "Applicant rejected successfully",
            applicationId: Number(applicationId),
            status: "REJECTED"
        });

    } catch (error) {
        console.error("REJECT APPLICANT ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// RECRUITER: GET SHORTLISTED
// GET /api/applications/job/:jobId/shortlisted
// =====================================================

const getShortlistedApplicants = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId } = req.params;

        const [applicants] = await pool.execute(
            `
            SELECT
                a.id AS application_id,
                a.status,
                a.applied_at,
                u.id AS student_id,
                u.name,
                u.email,
                sp.phone,
                sp.college,
                sp.degree,
                sp.branch,
                sp.cgpa,
                sp.graduation_year,
                sp.skills,
                sp.projects,
                sp.certifications,
                sp.internships,
                sp.resume_url
            FROM applications a
            JOIN jobs j
                ON a.job_id = j.id
            JOIN users u
                ON a.student_id = u.id
            LEFT JOIN student_profiles sp
                ON a.student_id = sp.user_id
            WHERE a.job_id = ?
              AND j.recruiter_id = ?
              AND a.status = 'SHORTLISTED'
            ORDER BY sp.cgpa DESC
            `,
            [jobId, recruiterId]
        );

        return res.json({
            jobId,
            totalShortlisted: applicants.length,
            shortlisted: applicants
        });

    } catch (error) {
        console.error("GET SHORTLISTED ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    applyForJob,
    getMyApplications,
    getJobApplicants,
    evaluateApplicants,
    autoShortlistApplicants,
    rejectApplicant,
    getShortlistedApplicants
};