
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ADMIN_EMAIL = "gaurav191056@gmail.com";

const createJwtToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};

const formatUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
});

// Record successful logins for the designated admin account only.
const recordAdminLogin = async (user, loginMethod) => {
    if (
        user.role !== "ADMIN" ||
        user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {
        return;
    }

    await pool.execute(
        `INSERT INTO admin_login_history
            (user_id, email, login_method)
         VALUES (?, ?, ?)`,
        [user.id, user.email, loginMethod]
    );
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const allowedRoles = ["STUDENT", "RECRUITER"];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existingUser] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, ?)`,
            [name.trim(), normalizedEmail, hashedPassword, role]
        );

        return res.status(201).json({
            message: "User registered successfully",
            userId: result.insertId
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error.message);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            "SELECT * FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Save the admin login event before responding.
        await recordAdminLogin(user, "PASSWORD");

        const token = createJwtToken(user);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: formatUser(user)
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error.message);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential, role } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: "Google credential is required"
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("GOOGLE_CLIENT_ID is not configured");

            return res.status(500).json({
                message: "Google login is not configured"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(401).json({
                message: "Invalid Google account"
            });
        }

        if (payload.email_verified !== true) {
            return res.status(401).json({
                message: "Google email is not verified"
            });
        }

        const email = payload.email.trim().toLowerCase();
        const name = payload.name || email.split("@")[0];

        const [existingUsers] = await pool.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        let user;

        if (existingUsers.length > 0) {
            // Preserve the role of an existing account.
            user = existingUsers[0];
        } else {
            const allowedGoogleRoles = ["STUDENT", "RECRUITER"];

            if (!allowedGoogleRoles.includes(role)) {
                return res.status(400).json({
                    message:
                        "Please select Student or Recruiter before continuing with Google"
                });
            }

            const randomPassword = crypto
                .randomBytes(32)
                .toString("hex");

            const hashedPassword = await bcrypt.hash(
                randomPassword,
                10
            );

            const [result] = await pool.execute(
                `INSERT INTO users (name, email, password, role)
                 VALUES (?, ?, ?, ?)`,
                [name, email, hashedPassword, role]
            );

            user = {
                id: result.insertId,
                name,
                email,
                role
            };
        }

        await recordAdminLogin(user, "GOOGLE");

        const token = createJwtToken(user);

        return res.status(200).json({
            message: "Google login successful",
            token,
            user: formatUser(user)
        });
    } catch (error) {
        console.error("GOOGLE LOGIN ERROR:", error.message);

        return res.status(401).json({
            message: "Google authentication failed"
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin
};
