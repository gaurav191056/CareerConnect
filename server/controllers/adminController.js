
const pool = require("../config/db");

const getAdminLoginHistory = async (req, res) => {
    try {
        const [history] = await pool.execute(
            `SELECT email, login_method, logged_in_at
             FROM admin_login_history
             ORDER BY logged_in_at DESC
             LIMIT 100`
        );

        return res.status(200).json({
            message: "Admin login history fetched successfully",
            history
        });
    } catch (error) {
        console.error("LOGIN HISTORY ERROR:", error.message);

        return res.status(500).json({
            message: "Unable to fetch login history"
        });
    }
};

module.exports = {
    getAdminLoginHistory
};
