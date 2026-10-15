
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");

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


const forgotPassword = async (req, res) => {
    const genericMessage =
        "If an account exists for this email, a password reset link will be sent.";

    try {
        const { email } = req.body;

        if (
            typeof email !== "string" ||
            !email.trim() ||
            email.length > 150
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            "SELECT id, email FROM users WHERE email = ?",
            [normalizedEmail]
        );

        // Do not reveal whether an email is registered.
        if (users.length === 0) {
            return res.status(200).json({
                message: genericMessage
            });
        }

        const frontendUrl = process.env.FRONTEND_URL;

        if (
            !frontendUrl ||
            !process.env.SMTP_HOST ||
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASS ||
            !process.env.SMTP_FROM
        ) {
            console.error(
                "Password reset email configuration is incomplete."
            );

            return res.status(200).json({
                message: genericMessage
            });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        // Remove previous reset tokens for this user.
        await pool.execute(
            "DELETE FROM password_reset_tokens WHERE user_id = ?",
            [users[0].id]
        );

        await pool.execute(
            `INSERT INTO password_reset_tokens
                (user_id, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE))`,
            [users[0].id, tokenHash]
        );

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure:
                String(process.env.SMTP_SECURE).toLowerCase() === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const resetUrl = new URL(
            "/reset-password",
            frontendUrl
        );

        resetUrl.searchParams.set("token", rawToken);

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: users[0].email,
                subject: "CareerConnect Password Reset",
                text:
                    "We received a request to reset your CareerConnect password.\n\n" +
                    `Open this link to reset it: ${resetUrl.href}\n\n` +
                    "This link expires in 15 minutes. If you did not request this, ignore this email.",
                html: `
                    <h2>Reset your CareerConnect password</h2>
                    <p>We received a request to reset your password.</p>
                    <p>
                        <a href="${resetUrl.href}">Reset Password</a>
                    </p>
                    <p>This link expires in 15 minutes.</p>
                    <p>If you did not request this, you can ignore this email.</p>
                `
            });
        } catch (mailError) {
            console.error(
                "PASSWORD RESET EMAIL ERROR:",
                mailError.message
            );

            // Invalidate the token if the email could not be sent.
            await pool.execute(
                "DELETE FROM password_reset_tokens WHERE token_hash = ?",
                [tokenHash]
            );
        }

        return res.status(200).json({
            message: genericMessage
        });
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error.message);

        return res.status(500).json({
            message: "Unable to process the request right now"
        });
    }
};

const resetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        return res.status(400).json({
            message: "Invalid or expired reset link"
        });
    }

    if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
    ) {
        return res.status(400).json({
            message: "Password must be between 8 and 128 characters"
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            message: "Passwords do not match"
        });
    }

    let connection;

    try {
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const hashedPassword = await bcrypt.hash(password, 10);

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [tokens] = await connection.execute(
            `SELECT id, user_id
             FROM password_reset_tokens
             WHERE token_hash = ?
               AND used_at IS NULL
               AND expires_at > UTC_TIMESTAMP()
             FOR UPDATE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "Invalid or expired reset link"
            });
        }

        const resetRecord = tokens[0];

        await connection.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, resetRecord.user_id]
        );

        // Mark the token as used.
        await connection.execute(
            `UPDATE password_reset_tokens
             SET used_at = UTC_TIMESTAMP()
             WHERE id = ?`,
            [resetRecord.id]
        );

        // Invalidate all other reset links for this user.
        await connection.execute(
            `UPDATE password_reset_tokens
             SET used_at = UTC_TIMESTAMP()
             WHERE user_id = ?
               AND id != ?
               AND used_at IS NULL`,
            [resetRecord.user_id, resetRecord.id]
        );

        await connection.commit();

        return res.status(200).json({
            message: "Password reset successful. You can now log in."
        });
    } catch (error) {
        if (connection) {
            await connection.rollback().catch(() => {});
        }

        console.error("RESET PASSWORD ERROR:", error.message);

        return res.status(500).json({
            message: "Unable to reset password right now"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};



module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    forgotPassword,
    resetPassword
};
