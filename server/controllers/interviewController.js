const pool = require("../config/db");

// ======================================================
// Recruiter schedules an interview
// ======================================================

const scheduleInterview = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        const {
            application_id,
            interview_date,
            interview_time,
            mode,
            meeting_link,
            location,
            notes
        } = req.body;

        // --------------------------------------------------
        // Basic validation
        // --------------------------------------------------

        if (
            !application_id ||
            !interview_date ||
            !interview_time
        ) {
            return res.status(400).json({
                message:
                    "Application, interview date and interview time are required"
            });
        }

        // --------------------------------------------------
        // Check that application belongs to a job
        // owned by this recruiter
        // --------------------------------------------------

        const [applications] = await pool.execute(
            `
            SELECT
                a.id AS application_id,
                a.student_id,
                a.job_id,
                a.status,
                j.title
            FROM applications a
            JOIN jobs j
                ON a.job_id = j.id
            WHERE a.id = ?
                AND j.recruiter_id = ?
            `,
            [
                application_id,
                recruiterId
            ]
        );

        if (applications.length === 0) {
            return res.status(404).json({
                message:
                    "Application not found or you do not have access"
            });
        }

        const application = applications[0];

        // --------------------------------------------------
        // Only shortlisted students can be scheduled
        // --------------------------------------------------

        if (application.status !== "SHORTLISTED") {
            return res.status(400).json({
                message:
                    "Interview can only be scheduled for shortlisted applicants"
            });
        }

        // --------------------------------------------------
        // Prevent multiple interviews for same application
        // --------------------------------------------------

        const [existingInterviews] = await pool.execute(
            `
            SELECT id
            FROM interviews
            WHERE application_id = ?
            LIMIT 1
            `,
            [
                application_id
            ]
        );

        if (existingInterviews.length > 0) {
            return res.status(400).json({
                message:
                    "An interview is already scheduled for this application"
            });
        }

        // --------------------------------------------------
        // Validate interview mode
        // --------------------------------------------------

        const interviewMode = mode || "ONLINE";

        if (
            interviewMode !== "ONLINE" &&
            interviewMode !== "OFFLINE"
        ) {
            return res.status(400).json({
                message:
                    "Interview mode must be ONLINE or OFFLINE"
            });
        }

        // --------------------------------------------------
        // Online interview validation
        // --------------------------------------------------

        if (
            interviewMode === "ONLINE" &&
            !meeting_link
        ) {
            return res.status(400).json({
                message:
                    "Meeting link is required for online interviews"
            });
        }

        // --------------------------------------------------
        // Offline interview validation
        // --------------------------------------------------

        if (
            interviewMode === "OFFLINE" &&
            !location
        ) {
            return res.status(400).json({
                message:
                    "Location is required for offline interviews"
            });
        }

        // --------------------------------------------------
        // Insert interview
        // --------------------------------------------------

        const [result] = await pool.execute(
            `
            INSERT INTO interviews
            (
                application_id,
                recruiter_id,
                student_id,
                interview_date,
                interview_time,
                mode,
                meeting_link,
                location,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                application_id,
                recruiterId,
                application.student_id,
                interview_date,
                interview_time,
                interviewMode,
                interviewMode === "ONLINE"
                    ? meeting_link
                    : null,
                interviewMode === "OFFLINE"
                    ? location
                    : null,
                notes || null
            ]
        );

        // --------------------------------------------------
        // Success response
        // --------------------------------------------------

        return res.status(201).json({
            message:
                "Interview scheduled successfully",
            interviewId:
                result.insertId
        });

    } catch (error) {
        console.error(
            "SCHEDULE INTERVIEW ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error.message
        });
    }
};


// ======================================================
// Recruiter views interviews for a job
// ======================================================

const getJobInterviews = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId } = req.params;

        // --------------------------------------------------
        // Get interviews
        // --------------------------------------------------

        const [interviews] = await pool.execute(
            `
            SELECT
                i.id,
                i.application_id,
                i.student_id,
                u.name AS student_name,
                u.email AS student_email,
                j.title AS job_title,

                DATE_FORMAT(
                    i.interview_date,
                    '%Y-%m-%d'
                ) AS interview_date,

                TIME_FORMAT(
                    i.interview_time,
                    '%H:%i:%s'
                ) AS interview_time,

                i.mode,
                i.meeting_link,
                i.location,
                i.status,
                i.notes

            FROM interviews i

            JOIN applications a
                ON i.application_id = a.id

            JOIN jobs j
                ON a.job_id = j.id

            JOIN users u
                ON i.student_id = u.id

            WHERE i.recruiter_id = ?
                AND j.id = ?

            ORDER BY
                i.interview_date ASC,
                i.interview_time ASC
            `,
            [
                recruiterId,
                jobId
            ]
        );

        // --------------------------------------------------
        // Success response
        // --------------------------------------------------

        return res.json({
            jobId,
            totalInterviews:
                interviews.length,
            interviews
        });

    } catch (error) {
        console.error(
            "GET JOB INTERVIEWS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error.message
        });
    }
};


// ======================================================
// Student views upcoming interviews
// ======================================================

const getMyInterviews = async (req, res) => {
    try {
        const studentId = req.user.id;

        // --------------------------------------------------
        // Get only upcoming interviews
        // --------------------------------------------------

        const [interviews] = await pool.execute(
            `
            SELECT
                i.id,
                i.application_id,

                DATE_FORMAT(
                    i.interview_date,
                    '%Y-%m-%d'
                ) AS interview_date,

                TIME_FORMAT(
                    i.interview_time,
                    '%H:%i:%s'
                ) AS interview_time,

                i.mode,
                i.meeting_link,
                i.location,
                i.status,
                i.notes,

                j.id AS job_id,
                j.title AS job_title,

                u.name AS recruiter_name,
                u.email AS recruiter_email

            FROM interviews i

            JOIN applications a
                ON i.application_id = a.id

            JOIN jobs j
                ON a.job_id = j.id

            JOIN users u
                ON i.recruiter_id = u.id

            WHERE i.student_id = ?

                AND TIMESTAMP(
                    i.interview_date,
                    i.interview_time
                ) >= NOW()

            ORDER BY
                i.interview_date ASC,
                i.interview_time ASC
            `,
            [
                studentId
            ]
        );

        // --------------------------------------------------
        // Success response
        // --------------------------------------------------

        return res.json({
            totalInterviews:
                interviews.length,
            interviews
        });

    } catch (error) {
        console.error(
            "GET MY INTERVIEWS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error.message
        });
    }
};


// ======================================================
// Student views interview history
// ======================================================

const getInterviewHistory = async (req, res) => {
    try {
        const studentId = req.user.id;

        // --------------------------------------------------
        // Get only past interviews
        // --------------------------------------------------

        const [interviews] = await pool.execute(
            `
            SELECT
                i.id,
                i.application_id,

                DATE_FORMAT(
                    i.interview_date,
                    '%Y-%m-%d'
                ) AS interview_date,

                TIME_FORMAT(
                    i.interview_time,
                    '%H:%i:%s'
                ) AS interview_time,

                i.mode,
                i.meeting_link,
                i.location,
                i.status,
                i.notes,

                j.id AS job_id,
                j.title AS job_title,

                u.name AS recruiter_name,
                u.email AS recruiter_email

            FROM interviews i

            JOIN applications a
                ON i.application_id = a.id

            JOIN jobs j
                ON a.job_id = j.id

            JOIN users u
                ON i.recruiter_id = u.id

            WHERE i.student_id = ?

                AND TIMESTAMP(
                    i.interview_date,
                    i.interview_time
                ) < NOW()

            ORDER BY
                i.interview_date DESC,
                i.interview_time DESC
            `,
            [
                studentId
            ]
        );

        // --------------------------------------------------
        // Success response
        // --------------------------------------------------

        return res.json({
            totalInterviews:
                interviews.length,
            interviews
        });

    } catch (error) {
        console.error(
            "GET INTERVIEW HISTORY ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error.message
        });
    }
};


// ======================================================
// Export controllers
// ======================================================

module.exports = {
    scheduleInterview,
    getJobInterviews,
    getMyInterviews,
    getInterviewHistory
};