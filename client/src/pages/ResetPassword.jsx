
import { useState } from "react";

const API_BASE_URL = "https://careerconnect-api-nxj8.onrender.com/api";

function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const token = new URLSearchParams(
        window.location.search
    ).get("token");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        if (!token) {
            setMessage("Invalid or missing password reset link.");
            return;
        }

        if (password.length < 8 || password.length > 128) {
            setMessage("Password must be between 8 and 128 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        password,
                        confirmPassword,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to reset password."
                );
            }

            setMessage(
                data.message ||
                "Password reset successfully. You can now log in."
            );

            setPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } catch (error) {
            setMessage(
                error.message || "Something went wrong. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: "420px",
                margin: "80px auto",
                padding: "30px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <h2>Reset Password</h2>
            <p>Enter your new password below.</p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="password">New Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                    style={{
                        display: "block",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        margin: "8px 0 18px",
                    }}
                />

                <label htmlFor="confirmPassword">
                    Confirm New Password
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                    style={{
                        display: "block",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        margin: "8px 0 18px",
                    }}
                />

                {message && (
                    <p role="status" aria-live="polite">{message}</p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        border: "none",
                        borderRadius: "6px",
                        background: "#2563eb",
                        color: "#fff",
                        cursor: isLoading ? "wait" : "pointer",
                    }}
                >
                    {isLoading ? "Resetting..." : "Reset Password"}
                </button>
            </form>

            <button
                type="button"
                onClick={() => {
                    window.location.href = "/login";
                }}
                style={{
                    display: "block",
                    margin: "18px auto 0",
                    border: "none",
                    background: "transparent",
                    color: "#2563eb",
                    cursor: "pointer",
                }}
            >
                Back to Login
            </button>
        </div>
    );
}

export default ResetPassword;
