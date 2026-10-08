import { useEffect, useState } from "react";
import "./Login.css";

const GOOGLE_CLIENT_ID =
    "700199088984-b2vcg5m7ghbj1p0dobauvh924h33bnlo.apps.googleusercontent.com";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("STUDENT");
    const [message, setMessage] = useState("");
    const [googleReady, setGoogleReady] = useState(false);

    const redirectUser = (user) => {
        if (user.role === "STUDENT") {
            window.location.href = "/student/dashboard";
            return;
        }

        if (user.role === "RECRUITER") {
            window.location.href = "/recruiter/dashboard";
            return;
        }

        setMessage("Unknown user role");
    };

    const saveLoginAndRedirect = (data) => {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        setMessage("Login successful!");

        console.log("USER:", data.user);
        console.log("TOKEN SAVED");

        redirectUser(data.user);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("Logging in...");

        try {
            const response = await fetch(
                "https://careerconnect-api-nxj8.onrender.com/api/auth/login",
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
                    data.message ||
                        "Invalid email or password"
                );
                return;
            }

            saveLoginAndRedirect(data);
        } catch (error) {
            console.error("LOGIN ERROR:", error);
            setMessage("Cannot connect to server");
        }
    };

    const handleGoogleLogin = async (credential) => {
        setMessage("Signing in with Google...");

        try {
            const response = await fetch(
                "https://careerconnect-api-nxj8.onrender.com/api/auth/google",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        credential,
                        role,
                    }),
                }
            );

            const data = await response.json();

            console.log(
                "GOOGLE LOGIN STATUS:",
                response.status
            );

            if (!response.ok) {
                setMessage(
                    data.message ||
                        "Google login failed"
                );
                return;
            }

            saveLoginAndRedirect(data);
        } catch (error) {
            console.error(
                "GOOGLE LOGIN ERROR:",
                error
            );

            setMessage(
                "Cannot connect to server"
            );
        }
    };

    useEffect(() => {
        const initializeGoogle = () => {
            if (
                !window.google ||
                !window.google.accounts ||
                !window.google.accounts.id
            ) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response) => {
                    handleGoogleLogin(
                        response.credential
                    );
                },
            });

            const googleButton =
                document.getElementById(
                    "google-signin-button"
                );

            if (googleButton) {
                googleButton.innerHTML = "";

                window.google.accounts.id.renderButton(
                    googleButton,
                    {
                        theme: "outline",
                        size: "large",
                        width: 320,
                        text: "continue_with",
                        shape: "rectangular",
                    }
                );
            }

            setGoogleReady(true);
        };

        if (window.google?.accounts?.id) {
            initializeGoogle();
            return;
        }

        const existingScript =
            document.querySelector(
                'script[src="https://accounts.google.com/gsi/client"]'
            );

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                initializeGoogle
            );

            return () => {
                existingScript.removeEventListener(
                    "load",
                    initializeGoogle
                );
            };
        }

        const script =
            document.createElement("script");

        script.src =
            "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        script.onload = initializeGoogle;

        document.head.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, [role]);

    const isLoading =
        message === "Logging in..." ||
        message ===
            "Signing in with Google...";

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
                            Connecting talent with
                            opportunity.
                        </p>

                        <div className="brand-features">
                            <div className="brand-feature">
                                <span className="feature-icon">
                                    ✓
                                </span>

                                <span>
                                    Discover career
                                    opportunities
                                </span>
                            </div>

                            <div className="brand-feature">
                                <span className="feature-icon">
                                    ✓
                                </span>

                                <span>
                                    Connect with
                                    recruiters
                                </span>
                            </div>

                            <div className="brand-feature">
                                <span className="feature-icon">
                                    ✓
                                </span>

                                <span>
                                    Manage your placement
                                    journey
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
                                Access your CareerConnect
                                dashboard
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
                                        setEmail(
                                            e.target.value
                                        )
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
                                        setPassword(
                                            e.target.value
                                        )
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

                        <div
                            style={{
                                marginTop: "20px",
                                marginBottom: "14px",
                            }}
                        >
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: "10px",
                                    fontSize: "14px",
                                    color: "#777",
                                }}
                            >
                                New Google users: choose
                                your role
                            </div>

                            <select
                                value={role}
                                onChange={(e) =>
                                    setRole(
                                        e.target.value
                                    )
                                }
                                disabled={isLoading}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #ddd",
                                    fontSize: "15px",
                                    background: "#fff",
                                    marginBottom: "12px",
                                }}
                            >
                                <option value="STUDENT">
                                    Student
                                </option>

                                <option value="RECRUITER">
                                    Recruiter
                                </option>
                            </select>

                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: "10px",
                                    color: "#888",
                                    fontSize: "13px",
                                }}
                            >
                                or
                            </div>

                            <div
                                id="google-signin-button"
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "center",
                                    minHeight:
                                        googleReady
                                            ? "40px"
                                            : "0px",
                                }}
                            ></div>
                        </div>

                        {message && (
                            <div
                                className={`login-message ${
                                    message ===
                                    "Login successful!"
                                        ? "success"
                                        : message ===
                                          "Logging in..." ||
                                          message ===
                                          "Signing in with Google..."
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
                                Campus Placement
                                Platform
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;