const pool = require("../config/db");

const createJob = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        const {
            title,
            description,
            location,
            salary,
            min_cgpa,
            required_branch,
            required_skills,
            graduation_year
        } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Job title is required"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO jobs
            (
                recruiter_id,
                title,
                description,
                location,
                salary,
                min_cgpa,
                required_branch,
                required_skills,
                graduation_year
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                recruiterId,
                title,
                description || null,
                location || null,
                salary || null,
                min_cgpa || null,
                required_branch || null,
                required_skills || null,
                graduation_year || null
            ]
        );

        res.status(201).json({
            message: "Job created successfully",
            jobId: result.insertId
        });

    } catch (error) {
        console.error("CREATE JOB ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


const getRecruiterJobs = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        const [jobs] = await pool.execute(
            `SELECT *
             FROM jobs
             WHERE recruiter_id = ?
             ORDER BY created_at DESC`,
            [recruiterId]
        );

        res.json({
            jobs
        });

    } catch (error) {
        console.error("GET JOBS ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


const getAllOpenJobs = async (req, res) => {
    try {
        const [jobs] = await pool.execute(
            `SELECT
                j.id,
                j.title,
                j.description,
                j.location,
                j.salary,
                j.min_cgpa,
                j.required_branch,
                j.required_skills,
                j.graduation_year,
                j.created_at,
                u.name AS recruiter_name
             FROM jobs j
             JOIN users u
             ON j.recruiter_id = u.id
             WHERE j.status = 'OPEN'
             ORDER BY j.created_at DESC`
        );

        res.json({
            jobs
        });

    } catch (error) {
        console.error("GET ALL JOBS ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};

const updateJob = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId } = req.params;

        const {
            title,
            description,
            location,
            salary,
            min_cgpa,
            required_branch,
            required_skills,
            graduation_year,
            status
        } = req.body;

        // Check that this job belongs to the logged-in recruiter
        const [existingJob] = await pool.execute(
            `SELECT id
             FROM jobs
             WHERE id = ? AND recruiter_id = ?`,
            [jobId, recruiterId]
        );

        if (existingJob.length === 0) {
            return res.status(404).json({
                message: "Job not found or access denied"
            });
        }

        await pool.execute(
            `UPDATE jobs
             SET title = ?,
                 description = ?,
                 location = ?,
                 salary = ?,
                 min_cgpa = ?,
                 required_branch = ?,
                 required_skills = ?,
                 graduation_year = ?,
                 status = ?
             WHERE id = ? AND recruiter_id = ?`,
            [
                title,
                description || null,
                location || null,
                salary || null,
                min_cgpa || null,
                required_branch || null,
                required_skills || null,
                graduation_year || null,
                status || "OPEN",
                jobId,
                recruiterId
            ]
        );

        res.json({
            message: "Job updated successfully"
        });

    } catch (error) {
        console.error("UPDATE JOB ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};

const deleteJob = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId } = req.params;

        // Check job belongs to logged-in recruiter
        const [existingJob] = await pool.execute(
            `SELECT id
             FROM jobs
             WHERE id = ? AND recruiter_id = ?`,
            [jobId, recruiterId]
        );

        if (existingJob.length === 0) {
            return res.status(404).json({
                message: "Job not found or access denied"
            });
        }

        await pool.execute(
            `DELETE FROM jobs
             WHERE id = ? AND recruiter_id = ?`,
            [jobId, recruiterId]
        );

        res.json({
            message: "Job deleted successfully"
        });

    } catch (error) {
        console.error("DELETE JOB ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createJob,
    getRecruiterJobs,
    getAllOpenJobs,
    updateJob,
    deleteJob
};