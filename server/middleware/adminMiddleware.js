
const pool = require("../config/db");

const ADMIN_EMAIL = "gaurav191056@gmail.com";

const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const [users] = await pool.execute(
            "SELECT id, email, role FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "User account not found"
            });
        }

        const user = users[0];

        if (
            user.role !== "ADMIN" ||
            user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
        ) {
            return res.status(403).json({
                message: "Admin access denied"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("ADMIN MIDDLEWARE ERROR:", error.message);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = adminMiddleware;
