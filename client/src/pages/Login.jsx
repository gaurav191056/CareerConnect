import { useState } from "react";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("Logging in...");

        try {
            const response = await fetch(
                "http://localhost:5001/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                    }),
                }
            );

            const data = await response.json();

            console.log("LOGIN STATUS:", response.status);
            console.log("LOGIN RESPONSE:", data);

            if (!response.ok) {
                setMessage(
                    data.message || "Invalid email or password"
                );
                return;
            }

            // Save authentication data
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setMessage("Login successful!");

            console.log("USER:", data.user);
            console.log("TOKEN SAVED");

            // Redirect according to role
            if (data.user.role === "STUDENT") {
                window.location.href = "/student/dashboard";
                return;
            }

            if (data.user.role === "RECRUITER") {
                window.location.href = "/recruiter/dashboard";
                return;
            }

            setMessage("Unknown user role");
        } catch (error) {
            console.error("LOGIN ERROR:", error);
            setMessage("Cannot connect to server");
        }
    };

    const isLoading = message === "Logging in...";

    return (
        <div className="login-page">
            <div className="login-shell">

                <div className="login-brand-panel">
                    <div className="brand-content">

                        <div className="brand-logo">
                            CC
                        </div>

                        <h1>CareerConnect</h1>

                        <p className="brand-tagline">
                            Connecting talent with opportunity.
                        </p>

                        <div className="brand-features">
                            <div className="brand-feature">
                                <span className="feature-icon">
                                    ✓
                                </span>
                                <span>
                                    Discover career opportunities
                                </span>
                            </div>

                            <div className="brand-feature">
                                <span className="feature-icon">
                                    ✓
                                </span>
                                <span>
                                    Connect with recruiters
                                </span>
                            </div>

                            <div className="brand-feature">
                                <span className="feature-icon">
                                    ✓
                                </span>
                                <span>
                                    Manage your placement journey
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="login-form-panel">
                    <div className="login-card">

                        <div className="login-heading">
                            <p className="welcome-text">
                                Welcome back
                            </p>

                            <h2>
                                Sign in to your account
                            </h2>

                            <p className="login-subtitle">
                                Access your CareerConnect dashboard
                            </p>
                        </div>

                        <form
                            onSubmit={handleLogin}
                            className="login-form"
                        >
                            <div className="form-group">
                                <label htmlFor="email">
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">
                                    Password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Signing in..."
                                    : "Sign In"}
                            </button>
                        </form>

                        {message && (
                            <div
                                className={`login-message ${
                                    message === "Login successful!"
                                        ? "success"
                                        : message === "Logging in..."
                                        ? "loading"
                                        : "error"
                                }`}
                            >
                                {message}
                            </div>
                        )}

                        <div className="login-footer">
                            <span>
                                CareerConnect
                            </span>
                            <span className="footer-dot">
                                •
                            </span>
                            <span>
                                Campus Placement Platform
                            </span>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;