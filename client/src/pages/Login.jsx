
import { useCallback, useEffect, useRef, useState } from "react";
import "./Login.css";

const API_BASE_URL =
  "https://careerconnect-api-nxj8.onrender.com/api";

const GOOGLE_CLIENT_ID =
  "700199088984-b2vcg5m7ghbj1p0dobauvh924h33bnlo.apps.googleusercontent.com";

function normalizeRole(role) {
  return String(role ?? "").trim().toUpperCase();
}

function getDashboardPath(role) {
  switch (normalizeRole(role)) {
    case "STUDENT":
      return "/student/dashboard";
    case "RECRUITER":
      return "/recruiter/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return null;
  }
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid response received from server.");
  }
}

function Login() {
  const [mode, setMode] = useState("SIGNIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState("error");
  const [googleReady, setGoogleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const googleButtonRef = useRef(null);
  const roleRef = useRef(role);
  const loadingRef = useRef(false);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const showMessage = (text, kind = "error") => {
    setMessage(text);
    setMessageKind(kind);
  };

  const switchMode = (nextMode) => {
    if (isLoading) return;

    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    showMessage("");
  };

  const saveLoginAndRedirect = useCallback((data) => {
    const user = data?.user;
    const token = data?.token;

    if (!token || !user || !user.role) {
      showMessage(
        "Login response is missing user or token information."
      );
      return;
    }

    const normalizedUser = {
      ...user,
      role: normalizeRole(user.role),
    };

    const dashboardPath = getDashboardPath(normalizedUser.role);

    if (!dashboardPath) {
      showMessage(
        `Unknown account role: ${String(user.role)}`
      );
      return;
    }

    sessionStorage.setItem("token", token);
    sessionStorage.setItem(
      "user",
      JSON.stringify(normalizedUser)
    );

    showMessage("Login successful! Redirecting...", "success");
    window.location.replace(dashboardPath);
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    showMessage("Logging in...", "loading");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
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

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showMessage(
          data?.message || "Invalid email or password."
        );
        return;
      }

      saveLoginAndRedirect(data);
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      showMessage(
        error.message ||
          "Cannot connect to server. Please try again."
      );
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (loadingRef.current) return;

    if (!name.trim()) {
      showMessage("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      showMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    const selectedRole = normalizeRole(role);

    if (!["STUDENT", "RECRUITER"].includes(selectedRole)) {
      showMessage("Please select a valid account type.");
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    showMessage("Creating your account...", "loading");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role: selectedRole,
          }),
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showMessage(
          data?.message || "Could not create your account."
        );
        return;
      }

      setMode("SIGNIN");
      setName("");
      setPassword("");
      setConfirmPassword("");

      showMessage(
        "Account created successfully! Please sign in.",
        "success"
      );
    } catch (error) {
      console.error("REGISTRATION ERROR:", error);
      showMessage(
        error.message ||
          "Cannot connect to server. Please try again."
      );
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(
    async (credential) => {
      if (!credential) {
        showMessage(
          "Google did not return a credential. Please try again."
        );
        return;
      }

      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);
      showMessage("Signing in with Google...", "loading");

      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/google`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential,
              role: normalizeRole(roleRef.current),
            }),
          }
        );

        const data = await readJsonResponse(response);

        if (!response.ok) {
          showMessage(data?.message || "Google login failed.");
          return;
        }

        saveLoginAndRedirect(data);
      } catch (error) {
        console.error("GOOGLE LOGIN ERROR:", error);
        showMessage(
          error.message ||
            "Cannot connect to server. Please try again."
        );
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [saveLoginAndRedirect]
  );

  useEffect(() => {
    let cancelled = false;
    let scriptElement = null;

    const initializeGoogle = () => {
      if (
        cancelled ||
        !window.google?.accounts?.id ||
        !googleButtonRef.current
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          void handleGoogleLogin(response?.credential);
        },
      });

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
          shape: "rectangular",
        }
      );

      if (!cancelled) setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();

      return () => {
        cancelled = true;
      };
    }

    scriptElement = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    const handleScriptLoad = () => initializeGoogle();

    const handleScriptError = () => {
      if (!cancelled) {
        showMessage(
          "Google sign-in could not be loaded. Refresh and try again."
        );
      }
    };

    if (scriptElement) {
      scriptElement.addEventListener("load", handleScriptLoad);
      initializeGoogle();
    } else {
      scriptElement = document.createElement("script");
      scriptElement.src =
        "https://accounts.google.com/gsi/client";
      scriptElement.async = true;
      scriptElement.defer = true;
      scriptElement.addEventListener("load", handleScriptLoad);
      scriptElement.addEventListener("error", handleScriptError);
      document.head.appendChild(scriptElement);
    }

    return () => {
      cancelled = true;
      scriptElement?.removeEventListener("load", handleScriptLoad);
      scriptElement?.removeEventListener("error", handleScriptError);
    };
  }, [handleGoogleLogin]);

  const isSignup = mode === "SIGNUP";

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand-panel">
          <div className="brand-content">
            <div className="brand-logo">CC</div>
            <h1>CareerConnect</h1>

            <p className="brand-tagline">
              Connecting talent with opportunity.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <span className="feature-icon">✓</span>
                <span>Discover career opportunities</span>
              </div>
              <div className="brand-feature">
                <span className="feature-icon">✓</span>
                <span>Connect with recruiters</span>
              </div>
              <div className="brand-feature">
                <span className="feature-icon">✓</span>
                <span>Manage your placement journey</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-card">
            <div className="login-heading">
              <p className="welcome-text">
                {isSignup ? "Join CareerConnect" : "Welcome back"}
              </p>

              <h2>
                {isSignup
                  ? "Create your account"
                  : "Sign in to your account"}
              </h2>

              <p className="login-subtitle">
                {isSignup
                  ? "Get started with your placement journey"
                  : "Access your CareerConnect dashboard"}
              </p>
            </div>

            <div
              className="auth-mode-switch"
              aria-label="Choose authentication mode"
            >
              <button
                type="button"
                className={`auth-mode-button ${
                  !isSignup ? "active" : ""
                }`}
                onClick={() => switchMode("SIGNIN")}
                disabled={isLoading}
              >
                Sign In
              </button>

              <button
                type="button"
                className={`auth-mode-button ${
                  isSignup ? "active" : ""
                }`}
                onClick={() => switchMode("SIGNUP")}
                disabled={isLoading}
              >
                Create Account
              </button>
            </div>

            <form
              onSubmit={isSignup ? handleRegister : handleLogin}
              className="login-form"
            >
              {isSignup && (
                <div className="form-group">
                  <label htmlFor="register-name">Full name</label>
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </div>

              {isSignup && (
                <div className="form-group">
                  <label htmlFor="account-role">Account type</label>
                  <select
                    id="account-role"
                    value={role}
                    onChange={(event) =>
                      setRole(normalizeRole(event.target.value))
                    }
                    required
                    disabled={isLoading}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="RECRUITER">Recruiter</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    isSignup
                      ? "Create a password (8+ characters)"
                      : "Enter your password"
                  }
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  minLength={isSignup ? 8 : undefined}
                  required
                  disabled={isLoading}
                />
              </div>

              {isSignup && (
                <div className="form-group">
                  <label htmlFor="confirm-password">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading
                  ? isSignup
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignup
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>

            <div className="google-login-section">
              <div className="google-role-label">
                {isSignup
                  ? "You can also create an account with Google"
                  : "For a new Google account, choose a role"}
              </div>

              {!isSignup && (
                <div className="form-group google-role-group">
                  <label htmlFor="google-role">
                    Role for a new Google account
                  </label>
                  <select
                    id="google-role"
                    value={role}
                    onChange={(event) =>
                      setRole(normalizeRole(event.target.value))
                    }
                    disabled={isLoading}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="RECRUITER">Recruiter</option>
                  </select>
                </div>
              )}

              <div className="google-divider">
                or continue with Google
              </div>

              <div
                id="google-signin-button"
                ref={googleButtonRef}
                className="google-button-container"
                style={{
                  minHeight: googleReady ? 40 : 0,
                  pointerEvents: isLoading ? "none" : "auto",
                  opacity: isLoading ? 0.7 : 1,
                }}
              />
            </div>

            {message && (
              <div
                className={`login-message ${messageKind}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <div className="login-footer">
              <span>CareerConnect</span>
              <span className="footer-dot">•</span>
              <span>Campus Placement Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
