const pool = require("../config/db");


// ======================================================
// Create or Update Student Profile
// ======================================================

const createOrUpdateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            phone,
            college,
            degree,
            branch,
            cgpa,
            graduation_year,
            skills,
            projects,
            certifications,
            internships,
            resume_url
        } = req.body;


        // --------------------------------------------------
        // Convert undefined values to null
        // --------------------------------------------------

        const profilePhone =
            phone !== undefined ? phone : null;

        const profileCollege =
            college !== undefined ? college : null;

        const profileDegree =
            degree !== undefined ? degree : null;

        const profileBranch =
            branch !== undefined ? branch : null;

        const profileCgpa =
            cgpa !== undefined ? cgpa : null;

        const profileGraduationYear =
            graduation_year !== undefined
                ? graduation_year
                : null;

        const profileSkills =
            skills !== undefined ? skills : null;

        const profileProjects =
            projects !== undefined ? projects : null;

        const profileCertifications =
            certifications !== undefined
                ? certifications
                : null;

        const profileInternships =
            internships !== undefined
                ? internships
                : null;

        const profileResumeUrl =
            resume_url !== undefined
                ? resume_url
                : null;


        // --------------------------------------------------
        // Check existing profile
        // --------------------------------------------------

        const [existingProfile] = await pool.execute(
            `
            SELECT id
            FROM student_profiles
            WHERE user_id = ?
            `,
            [
                userId
            ]
        );


        // ==================================================
        // UPDATE EXISTING PROFILE
        // ==================================================

        if (existingProfile.length > 0) {

            await pool.execute(
                `
                UPDATE student_profiles

                SET
                    phone = ?,
                    college = ?,
                    degree = ?,
                    branch = ?,
                    cgpa = ?,
                    graduation_year = ?,
                    skills = ?,
                    projects = ?,
                    certifications = ?,
                    internships = ?,
                    resume_url = ?

                WHERE user_id = ?
                `,
                [
                    profilePhone,
                    profileCollege,
                    profileDegree,
                    profileBranch,
                    profileCgpa,
                    profileGraduationYear,
                    profileSkills,
                    profileProjects,
                    profileCertifications,
                    profileInternships,
                    profileResumeUrl,
                    userId
                ]
            );


            return res.json({
                message:
                    "Student profile updated successfully"
            });
        }


        // ==================================================
        // CREATE NEW PROFILE
        // ==================================================

        await pool.execute(
            `
            INSERT INTO student_profiles
            (
                user_id,
                phone,
                college,
                degree,
                branch,
                cgpa,
                graduation_year,
                skills,
                projects,
                certifications,
                internships,
                resume_url
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                userId,
                profilePhone,
                profileCollege,
                profileDegree,
                profileBranch,
                profileCgpa,
                profileGraduationYear,
                profileSkills,
                profileProjects,
                profileCertifications,
                profileInternships,
                profileResumeUrl
            ]
        );


        return res.status(201).json({
            message:
                "Student profile created successfully"
        });

    } catch (error) {

        console.error(
            "STUDENT PROFILE ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error.message
        });
    }
};



// ======================================================
// Get Student Profile
// ======================================================

const getStudentProfile = async (req, res) => {
    try {

        const userId = req.user.id;


        const [profiles] = await pool.execute(
            `
            SELECT
                u.id,
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

            FROM users u

            LEFT JOIN student_profiles sp
                ON u.id = sp.user_id

            WHERE u.id = ?
            `,
            [
                userId
            ]
        );


        if (profiles.length === 0) {

            return res.status(404).json({
                message:
                    "Student not found"
            });
        }


        return res.json(
            profiles[0]
        );

    } catch (error) {

        console.error(
            "GET STUDENT PROFILE ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error.message
        });
    }
};



// ======================================================
// Export Controllers
// ======================================================

module.exports = {
    createOrUpdateProfile,
    getStudentProfile
};