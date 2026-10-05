import Login from "./pages/Login";

import RecruiterDashboard from "./pages/RecruiterDashboard";

import StudentDashboard from "./pages/StudentDashboard";

import RecruiterApplicants from "./pages/RecruiterApplicants";

import RecruiterEvaluate from "./pages/RecruiterEvaluate";

import RecruiterShortlisted from "./pages/RecruiterShortlisted";

function App() {

    const token = sessionStorage.getItem("token");

    let user = null;

    try {

        user = JSON.parse(
            sessionStorage.getItem("user") || "null"
        );

    } catch (error) {

        console.error("USER PARSE ERROR:", error);

        sessionStorage.removeItem("token");

        sessionStorage.removeItem("user");

    }

    const path = window.location.pathname;

    // =========================
    // LOGIN PAGE
    // =========================

    if (path === "/login") {

        return <Login />;

    }

    // =========================
    // NOT LOGGED IN
    // =========================

    if (!token || !user) {

        window.location.href = "/login";

        return null;

    }

    // =========================
    // RECRUITER APPLICANTS
    // =========================

    if (

        path.startsWith("/recruiter/applicants/") &&

        user.role === "RECRUITER"

    ) {

        const jobId = path.split("/")[3];

        return (

            <RecruiterApplicants

                jobId={jobId}

            />

        );

    }

    // =========================
    // RECRUITER EVALUATE
    // =========================

    if (

        path.startsWith("/recruiter/evaluate/") &&

        user.role === "RECRUITER"

    ) {

        const jobId = path.split("/")[3];

        return (

            <RecruiterEvaluate

                jobId={jobId}

            />

        );

    }

    // =========================
    // RECRUITER SHORTLISTED
    // =========================

    if (

        path.startsWith("/recruiter/shortlisted/") &&

        user.role === "RECRUITER"

    ) {

        const jobId = path.split("/")[3];

        return (

            <RecruiterShortlisted

                jobId={jobId}

            />

        );

    }

    // =========================
    // STUDENT DASHBOARD
    // =========================

    if (

        path === "/student/dashboard" &&

        user.role === "STUDENT"

    ) {

        return <StudentDashboard />;

    }

    // =========================
    // RECRUITER DASHBOARD
    // =========================

    if (

        path === "/recruiter/dashboard" &&

        user.role === "RECRUITER"

    ) {

        return <RecruiterDashboard />;

    }

    // =========================
    // DEFAULT REDIRECT
    // =========================

    if (user.role === "STUDENT") {

        window.location.href = "/student/dashboard";

        return null;

    }

    if (user.role === "RECRUITER") {

        window.location.href = "/recruiter/dashboard";

        return null;

    }

    // =========================
    // ACCESS DENIED
    // =========================

    return (

        <div

            style={{

                padding: "40px",

                textAlign: "center",

            }}

        >

            <h2>Access denied</h2>

        </div>

    );

}

export default App;