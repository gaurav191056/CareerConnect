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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [message, setMessage] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const googleButtonRef = useRef(null);
  const roleRef = useRef(role);
  const loadingRef = useRef(false);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const saveLoginAndRedirect = useCallback((data) => {
    const user = data?.user;
    const token = data?.token;

    if (!token || !user || !user.role) {
      setMessage("Login response is missing user or token information.");
      return;
    }

    const normalizedUser = {
      ...user,
      role: normalizeRole(user.role),
    };

    const dashboardPath = getDashboardPath(normalizedUser.role);

    if (!dashboardPath) {
      setMessage(`Unknown account role: ${String(user.role)}`);
      return;
    }

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));

    setMessage("Login successful! Redirecting...");

    window.location.replace(dashboardPath);
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setMessage("Logging in...");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        setMessage(data?.message || "Invalid email or password.");
        return;
      }

      saveLoginAndRedirect(data);
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage(
        error.message || "Cannot connect to server. Please try again."
      );
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(
    async (credential) => {
      if (!credential) {
        setMessage("Google did not return a credential. Please try again.");
        return;
      }

      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);
      setMessage("Signing in with Google...");

      try {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential,
            // The backend should use this role only when creating
            // a new Google account. Existing account roles must
            // come from the database.
            role: normalizeRole(roleRef.current),
          }),
        });

        const data = await readJsonResponse(response);
        console.log("Selected Google role:", roleRef.current);
        console.log("Backend returned user:", data?.user);
        console.log("Backend returned role:", data?.user?.role);

        if (!response.ok) {
          setMessage(data?.message || "Google login failed.");
          return;
        }

        saveLoginAndRedirect(data);
      } catch (error) {
        console.error("GOOGLE LOGIN ERROR:", error);

        setMessage(
          error.message || "Cannot connect to server. Please try again."
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
    let createdScript = false;

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

      if (!cancelled) {
        setGoogleReady(true);
      }
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

    const handleScriptLoad = () => {
      initializeGoogle();
    };

    const handleScriptError = () => {
      if (!cancelled) {
        setMessage(
          "Google sign-in could not be loaded. Refresh and try again."
        );
      }
    };

    if (scriptElement) {
      scriptElement.addEventListener("load", handleScriptLoad);

      // Initialize immediately if the existing script has already loaded.
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
      createdScript = true;
    }

    return () => {
      cancelled = true;

      scriptElement?.removeEventListener("load", handleScriptLoad);
      scriptElement?.removeEventListener("error", handleScriptError);

      // Do not remove the shared Google script from the document.
      if (createdScript && scriptElement?.parentNode) {
        scriptElement.remove();
      }
    };
  }, [handleGoogleLogin]);

  const messageType =
    message === "Login successful! Redirecting..."
      ? "success"
      : isLoading
        ? "loading"
        : "error";

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
              <p className="welcome-text">Welcome back</p>

              <h2>Sign in to your account</h2>

              <p className="login-subtitle">
                Access your CareerConnect dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div
              style={{
                marginTop: 20,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 10,
                  fontSize: 14,
                  color: "#777",
                }}
              >
                For a new Google account, choose a role
              </div>

              <label
                htmlFor="google-role"
                className="sr-only"
              >
                Role for a new Google account
              </label>

              <select
                id="google-role"
                value={role}
                onChange={(event) =>
                  setRole(normalizeRole(event.target.value))
                }
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 15,
                  background: "#fff",
                  marginBottom: 12,
                }}
              >
                <option value="STUDENT">Student</option>
                <option value="RECRUITER">Recruiter</option>
              </select>

              <div
                style={{
                  textAlign: "center",
                  marginBottom: 10,
                  color: "#888",
                  fontSize: 13,
                }}
              >
                or continue with Google
              </div>

              <div
                id="google-signin-button"
                ref={googleButtonRef}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  minHeight: googleReady ? 40 : 0,
                  pointerEvents: isLoading ? "none" : "auto",
                  opacity: isLoading ? 0.7 : 1,
                }}
              />
            </div>

            {message && (
              <div
                className={`login-message ${messageType}`}
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