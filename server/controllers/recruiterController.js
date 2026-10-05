const pool = require("../config/db");

const createOrUpdateRecruiterProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            company_name,
            company_email,
            company_website,
            company_description
        } = req.body;

        if (!company_name) {
            return res.status(400).json({
                message: "Company name is required"
            });
        }

        const [existingProfile] = await pool.execute(
            "SELECT id FROM recruiter_profiles WHERE user_id = ?",
            [userId]
        );

        if (existingProfile.length > 0) {
            await pool.execute(
                `UPDATE recruiter_profiles
                 SET company_name = ?,
                     company_email = ?,
                     company_website = ?,
                     company_description = ?
                 WHERE user_id = ?`,
                [
                    company_name,
                    company_email,
                    company_website,
                    company_description,
                    userId
                ]
            );

            return res.json({
                message: "Recruiter profile updated successfully"
            });
        }

        await pool.execute(
            `INSERT INTO recruiter_profiles
             (user_id, company_name, company_email,
              company_website, company_description)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                company_name,
                company_email,
                company_website,
                company_description
            ]
        );

        res.status(201).json({
            message: "Recruiter profile created successfully"
        });

    } catch (error) {
        console.error("RECRUITER PROFILE ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


const getRecruiterProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [profiles] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                rp.company_name,
                rp.company_email,
                rp.company_website,
                rp.company_description
             FROM users u
             LEFT JOIN recruiter_profiles rp
             ON u.id = rp.user_id
             WHERE u.id = ?`,
            [userId]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                message: "Recruiter not found"
            });
        }

        res.json(profiles[0]);

    } catch (error) {
        console.error("GET RECRUITER PROFILE ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    createOrUpdateRecruiterProfile,
    getRecruiterProfile
};