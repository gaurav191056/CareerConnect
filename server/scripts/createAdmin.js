
require("dotenv").config();

const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const ADMIN_EMAIL = "gaurav1910@gmail.com";
const ADMIN_NAME = "Gaurav";

async function createAdmin() {
    try {
        const [existing] = await pool.execute(
            "SELECT id, role FROM users WHERE email = ?",
            [ADMIN_EMAIL]
        );

        if (existing.length > 0) {
            console.log(
                "Account already exists. No changes made."
            );
            return;
        }

        // Random password: the admin will use verified Google login.
        const randomPassword = crypto
            .randomBytes(32)
            .toString("hex");

        const hashedPassword = await bcrypt.hash(
            randomPassword,
            10
        );

        await pool.execute(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, ?)`,
            [
                ADMIN_NAME,
                ADMIN_EMAIL,
                hashedPassword,
                "ADMIN"
            ]
        );

        console.log("Admin account created successfully.");
        console.log("Email:", ADMIN_EMAIL);
        console.log("Role: ADMIN");
        console.log("Sign in using verified Google login.");
    } finally {
        await pool.end();
    }
}

createAdmin().catch((error) => {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
});
