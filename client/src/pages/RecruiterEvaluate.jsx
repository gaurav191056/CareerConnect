import { useEffect, useState } from "react";

const API_URL = "http://localhost:5001";

function RecruiterEvaluate({ jobId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [shortlistLimit, setShortlistLimit] = useState(1);
    const [shortlisting, setShortlisting] = useState(false);
    const [shortlistMessage, setShortlistMessage] = useState("");

    useEffect(() => {
        const fetchEvaluation = async () => {
            try {
                const token = sessionStorage.getItem("token");

                if (!token) {
                    window.location.href = "/login";
                    return;
                }

                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/applications/job/${jobId}/evaluate`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();

                if (response.status === 401) {
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    window.location.href = "/login";
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                            "Failed to evaluate applicants"
                    );
                }

                setData(result);
            } catch (err) {
                console.error("EVALUATION ERROR:", err);
                setError(
                    err.message || "Failed to load evaluation"
                );
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchEvaluation();
        } else {
            setError("Job ID is missing.");
            setLoading(false);
        }
    }, [jobId]);

    const handleAutoShortlist = async () => {
        try {
            setShortlisting(true);
            setShortlistMessage("");
            setError("");

            const limit = Number(shortlistLimit);

            if (!Number.isInteger(limit) || limit < 1) {
                setError(
                    "Please enter a valid shortlist limit."
                );
                setShortlisting(false);
                return;
            }

            const token = sessionStorage.getItem("token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            const response = await fetch(
                `${API_URL}/api/applications/job/${jobId}/auto-shortlist`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        limit,
                    }),
                }
            );

            const result = await response.json();

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result.message ||
                        "Auto shortlist failed"
                );
            }

            const shortlistedCount =
                result.shortlisted?.length || 0;

            setShortlistMessage(
                `${shortlistedCount} applicant${
                    shortlistedCount !== 1 ? "s" : ""
                } shortlisted successfully.`
            );
        } catch (err) {
            console.error("AUTO SHORTLIST ERROR:", err);

            setError(
                err.message || "Auto shortlist failed"
            );
        } finally {
            setShortlisting(false);
        }
    };

    const handleBackToDashboard = () => {
        window.location.href = "/recruiter/dashboard";
    };

    const handleViewShortlisted = () => {
        window.location.href =
            `/recruiter/shortlisted/${jobId}`;
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <header style={styles.header}>
                    <div style={styles.headerInner}>
                        <div style={styles.brandArea}>
                            <div style={styles.brandIcon}>
                                CC
                            </div>

                            <div>
                                <h1 style={styles.logo}>
                                    CareerConnect
                                </h1>

                                <p style={styles.brandSubtitle}>
                                    Campus Career Platform
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main style={styles.container}>
                    <div style={styles.loadingCard}>
                        <div style={styles.loadingIcon}>
                            ✓
                        </div>

                        <h2 style={styles.loadingTitle}>
                            Evaluating applicants...
                        </h2>

                        <p style={styles.loadingText}>
                            Please wait while we prepare the
                            candidate evaluation.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div style={styles.page}>
                <header style={styles.header}>
                    <div style={styles.headerInner}>
                        <div style={styles.brandArea}>
                            <div style={styles.brandIcon}>
                                CC
                            </div>

                            <div>
                                <h1 style={styles.logo}>
                                    CareerConnect
                                </h1>

                                <p style={styles.brandSubtitle}>
                                    Campus Career Platform
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main style={styles.container}>
                    <button
                        style={styles.backButton}
                        onClick={handleBackToDashboard}
                    >
                        ← Back to Dashboard
                    </button>

                    <div style={styles.errorCard}>
                        <div style={styles.errorIcon}>
                            !
                        </div>

                        <h2 style={styles.errorHeading}>
                            Evaluation Error
                        </h2>

                        <p style={styles.errorText}>
                            {error}
                        </p>

                        <button
                            style={styles.primaryButton}
                            onClick={handleBackToDashboard}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const applicants =
        data?.applicants ||
        data?.evaluatedApplicants ||
        [];

    const job = data?.job || null;

    const eligibleApplicants = applicants.filter(
        (applicant) => applicant.eligible
    );

    const averageScore =
        applicants.length > 0
            ? Math.round(
                  applicants.reduce(
                      (total, applicant) =>
                          total +
                          Number(applicant.score || 0),
                      0
                  ) / applicants.length
              )
            : 0;

    return (
        <div style={styles.page}>
            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.headerInner}>
                    <div style={styles.brandArea}>
                        <div style={styles.brandIcon}>
                            CC
                        </div>

                        <div>
                            <h1 style={styles.logo}>
                                CareerConnect
                            </h1>

                            <p style={styles.brandSubtitle}>
                                Campus Career Platform
                            </p>
                        </div>
                    </div>

                    <div style={styles.headerRight}>
                        <div style={styles.userArea}>
                            <div style={styles.userAvatar}>
                                A
                            </div>

                            <div>
                                <strong style={styles.userName}>
                                    ABC Company
                                </strong>

                                <span style={styles.userRole}>
                                    Recruiter
                                </span>
                            </div>
                        </div>

                        <button
                            style={styles.logoutButton}
                            onClick={() => {
                                sessionStorage.removeItem(
                                    "token"
                                );
                                sessionStorage.removeItem(
                                    "user"
                                );
                                window.location.href =
                                    "/login";
                            }}
                        >
                            ↪ Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main style={styles.container}>
                {/* BACK BUTTON */}
                <button
                    style={styles.backButton}
                    onClick={handleBackToDashboard}
                >
                    ← Back to Dashboard
                </button>

                {/* PAGE HEADER */}
                <div style={styles.pageHeader}>
                    <div>
                        <div style={styles.eyebrow}>
                            RECRUITMENT
                        </div>

                        <h2 style={styles.pageTitle}>
                            Applicant Evaluation
                        </h2>

                        <p style={styles.pageSubtitle}>
                            Review candidate eligibility,
                            skill matches, and evaluation
                            scores.
                        </p>
                    </div>

                    <div style={styles.jobBadge}>
                        Job #{jobId}
                    </div>
                </div>

                {/* JOB CARD */}
                <div style={styles.jobCard}>
                    <div style={styles.jobCompanyIcon}>
                        A
                    </div>

                    <div style={styles.jobDetails}>
                        <span style={styles.companyName}>
                            ABC Company
                        </span>

                        <h3 style={styles.jobTitle}>
                            {job?.title ||
                                "Job Evaluation"}
                        </h3>

                        {job?.location && (
                            <span style={styles.jobMeta}>
                                📍 {job.location}
                            </span>
                        )}
                    </div>

                    <div style={styles.openBadge}>
                        ● OPEN
                    </div>
                </div>

                {/* SUMMARY STATS */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div
                            style={{
                                ...styles.statIcon,
                                background: "#eef4ff",
                                color: "#2563eb",
                            }}
                        >
                            👥
                        </div>

                        <div>
                            <span style={styles.statLabel}>
                                Total Applicants
                            </span>

                            <strong style={styles.statValue}>
                                {applicants.length}
                            </strong>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div
                            style={{
                                ...styles.statIcon,
                                background: "#ecfdf3",
                                color: "#16a34a",
                            }}
                        >
                            ✓
                        </div>

                        <div>
                            <span style={styles.statLabel}>
                                Eligible
                            </span>

                            <strong style={styles.statValue}>
                                {eligibleApplicants.length}
                            </strong>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div
                            style={{
                                ...styles.statIcon,
                                background: "#fff7ed",
                                color: "#ea580c",
                            }}
                        >
                            ★
                        </div>

                        <div>
                            <span style={styles.statLabel}>
                                Average Score
                            </span>

                            <strong style={styles.statValue}>
                                {averageScore}/100
                            </strong>
                        </div>
                    </div>
                </div>

                {/* EVALUATION SECTION */}
                <section style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <div style={styles.eyebrow}>
                                AUTOMATED SCREENING
                            </div>

                            <h2 style={styles.sectionTitle}>
                                Evaluation Results
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Candidates are evaluated
                                using eligibility criteria
                                and matched skills.
                            </p>
                        </div>
                    </div>

                    {/* AUTO SHORTLIST */}
                    <div style={styles.shortlistCard}>
                        <div style={styles.shortlistIcon}>
                            ✦
                        </div>

                        <div style={styles.shortlistContent}>
                            <h3 style={styles.shortlistTitle}>
                                Automatic Shortlisting
                            </h3>

                            <p style={styles.description}>
                                Select how many eligible
                                applicants should be
                                shortlisted automatically
                                based on their evaluation
                                score.
                            </p>

                            <div
                                style={
                                    styles.shortlistControls
                                }
                            >
                                <div>
                                    <label
                                        style={
                                            styles.inputLabel
                                        }
                                    >
                                        Applicants to
                                        shortlist
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        value={
                                            shortlistLimit
                                        }
                                        onChange={(e) =>
                                            setShortlistLimit(
                                                e.target
                                                    .value
                                            )
                                        }
                                        style={
                                            styles.limitInput
                                        }
                                    />
                                </div>

                                <button
                                    style={{
                                        ...styles.primaryButton,
                                        ...styles.shortlistButton,
                                        opacity:
                                            shortlisting
                                                ? 0.6
                                                : 1,
                                        cursor:
                                            shortlisting
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                    onClick={
                                        handleAutoShortlist
                                    }
                                    disabled={shortlisting}
                                >
                                    {shortlisting
                                        ? "Shortlisting..."
                                        : "Auto Shortlist →"}
                                </button>
                            </div>

                            {error && data && (
                                <div
                                    style={
                                        styles.inlineError
                                    }
                                >
                                    {error}
                                </div>
                            )}

                            {shortlistMessage && (
                                <div
                                    style={
                                        styles.successBox
                                    }
                                >
                                    <div>
                                        <strong
                                            style={
                                                styles.successTitle
                                            }
                                        >
                                            ✓ Shortlisting
                                            Complete
                                        </strong>

                                        <p
                                            style={
                                                styles.successText
                                            }
                                        >
                                            {
                                                shortlistMessage
                                            }
                                        </p>
                                    </div>

                                    <button
                                        onClick={
                                            handleViewShortlisted
                                        }
                                        style={
                                            styles.viewButton
                                        }
                                    >
                                        View Shortlisted →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* APPLICANTS */}
                <section style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <div style={styles.eyebrow}>
                                CANDIDATES
                            </div>

                            <h2 style={styles.sectionTitle}>
                                Candidate Evaluation
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Review individual candidate
                                scores and eligibility.
                            </p>
                        </div>

                        <div style={styles.applicantCount}>
                            {applicants.length} Applicant
                            {applicants.length !== 1
                                ? "s"
                                : ""}
                        </div>
                    </div>

                    {applicants.length === 0 ? (
                        <div style={styles.emptyCard}>
                            <div style={styles.emptyIcon}>
                                👥
                            </div>

                            <h3 style={styles.emptyHeading}>
                                No Applicants Found
                            </h3>

                            <p style={styles.emptyText}>
                                No students have applied
                                for this job yet.
                            </p>
                        </div>
                    ) : (
                        <div style={styles.applicantList}>
                            {applicants.map(
                                (applicant, index) => {
                                    const score = Number(
                                        applicant.score || 0
                                    );

                                    const matchedSkills =
                                        applicant.matched_skills ||
                                        [];

                                    return (
                                        <div
                                            key={
                                                applicant.application_id ||
                                                applicant.student_id ||
                                                index
                                            }
                                            style={
                                                styles.applicantCard
                                            }
                                        >
                                            {/* APPLICANT HEADER */}
                                            <div
                                                style={
                                                    styles.applicantTop
                                                }
                                            >
                                                <div
                                                    style={
                                                        styles.applicantIdentity
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.applicantAvatar
                                                        }
                                                    >
                                                        {(
                                                            applicant.name ||
                                                            "S"
                                                        )
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <h3
                                                            style={
                                                                styles.applicantName
                                                            }
                                                        >
                                                            {applicant.name ||
                                                                "Unknown Student"}
                                                        </h3>

                                                        <p
                                                            style={
                                                                styles.applicantEmail
                                                            }
                                                        >
                                                            {applicant.email ||
                                                                "Email not available"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    style={
                                                        applicant.eligible
                                                            ? styles.eligibleBadge
                                                            : styles.notEligibleBadge
                                                    }
                                                >
                                                    ●{" "}
                                                    {applicant.eligible
                                                        ? "ELIGIBLE"
                                                        : "NOT ELIGIBLE"}
                                                </span>
                                            </div>

                                            {/* DETAILS */}
                                            <div
                                                style={
                                                    styles.detailsGrid
                                                }
                                            >
                                                <div
                                                    style={
                                                        styles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.detailLabel
                                                        }
                                                    >
                                                        CGPA
                                                    </span>

                                                    <strong
                                                        style={
                                                            styles.detailValue
                                                        }
                                                    >
                                                        {applicant.cgpa ??
                                                            "N/A"}
                                                    </strong>
                                                </div>

                                                <div
                                                    style={
                                                        styles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.detailLabel
                                                        }
                                                    >
                                                        BRANCH
                                                    </span>

                                                    <strong
                                                        style={
                                                            styles.detailValue
                                                        }
                                                    >
                                                        {applicant.branch ||
                                                            "N/A"}
                                                    </strong>
                                                </div>

                                                <div
                                                    style={
                                                        styles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.detailLabel
                                                        }
                                                    >
                                                        GRADUATION
                                                    </span>

                                                    <strong
                                                        style={
                                                            styles.detailValue
                                                        }
                                                    >
                                                        {applicant.graduation_year ||
                                                            "N/A"}
                                                    </strong>
                                                </div>

                                                <div
                                                    style={
                                                        styles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.detailLabel
                                                        }
                                                    >
                                                        SCORE
                                                    </span>

                                                    <strong
                                                        style={
                                                            styles.scoreValue
                                                        }
                                                    >
                                                        {score}/100
                                                    </strong>
                                                </div>
                                            </div>

                                            {/* SCORE BAR */}
                                            <div
                                                style={
                                                    styles.scoreSection
                                                }
                                            >
                                                <div
                                                    style={
                                                        styles.scoreHeader
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.detailLabel
                                                        }
                                                    >
                                                        EVALUATION
                                                        SCORE
                                                    </span>

                                                    <strong
                                                        style={
                                                            styles.scoreText
                                                        }
                                                    >
                                                        {score}%
                                                    </strong>
                                                </div>

                                                <div
                                                    style={
                                                        styles.scoreTrack
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            ...styles.scoreFill,
                                                            width: `${Math.min(
                                                                Math.max(
                                                                    score,
                                                                    0
                                                                ),
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* MATCHED SKILLS */}
                                            <div
                                                style={
                                                    styles.skillsSection
                                                }
                                            >
                                                <span
                                                    style={
                                                        styles.detailLabel
                                                    }
                                                >
                                                    MATCHED
                                                    SKILLS
                                                </span>

                                                {matchedSkills.length >
                                                0 ? (
                                                    <div
                                                        style={
                                                            styles.skillsList
                                                        }
                                                    >
                                                        {matchedSkills.map(
                                                            (
                                                                skill,
                                                                skillIndex
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        skillIndex
                                                                    }
                                                                    style={
                                                                        styles.skillChip
                                                                    }
                                                                >
                                                                    {skill}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span
                                                        style={
                                                            styles.noSkills
                                                        }
                                                    >
                                                        No matched
                                                        skills
                                                    </span>
                                                )}
                                            </div>

                                            {/* ELIGIBILITY SUMMARY */}
                                            <div
                                                style={
                                                    applicant.eligible
                                                        ? styles.eligibilitySuccess
                                                        : styles.eligibilityWarning
                                                }
                                            >
                                                <strong>
                                                    {applicant.eligible
                                                        ? "✓ Eligible for shortlisting"
                                                        : "⚠ Does not meet eligibility criteria"}
                                                </strong>

                                                <span>
                                                    Eligibility:
                                                    {" "}
                                                    {applicant.eligible
                                                        ? "Eligible"
                                                        : "Not Eligible"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>

                {/* FOOTER */}
                <footer style={styles.footer}>
                    <span>
                        CareerConnect · Campus Career Platform
                    </span>

                    <span>
                        Recruiter Portal
                    </span>
                </footer>
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#172033",
        fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    header: {
        background: "#ffffff",
        borderBottom: "1px solid #e5eaf2",
        position: "sticky",
        top: 0,
        zIndex: 20,
    },

    headerInner: {
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    brandArea: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    brandIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "11px",
        background:
            "linear-gradient(135deg, #315bea, #2563eb)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "800",
        boxShadow:
            "0 5px 12px rgba(37, 99, 235, 0.22)",
    },

    logo: {
        margin: 0,
        fontSize: "17px",
        lineHeight: 1.2,
        fontWeight: "800",
        color: "#172033",
    },

    brandSubtitle: {
        margin: "3px 0 0",
        fontSize: "10px",
        color: "#94a0b5",
        fontWeight: "500",
    },

    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
    },

    userArea: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
    },

    userAvatar: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "800",
    },

    userName: {
        display: "block",
        fontSize: "12px",
        color: "#263247",
    },

    userRole: {
        display: "block",
        fontSize: "10px",
        color: "#94a0b5",
        marginTop: "2px",
    },

    logoutButton: {
        background: "#ffffff",
        color: "#475569",
        border: "1px solid #d8dee9",
        padding: "9px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "700",
    },

    container: {
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "28px 20px 50px",
        boxSizing: "border-box",
    },

    backButton: {
        background: "#ffffff",
        color: "#2563eb",
        border: "1px solid #d7e2f5",
        padding: "9px 15px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "700",
        marginBottom: "24px",
    },

    pageHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "20px",
    },

    eyebrow: {
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "2px",
        color: "#2563eb",
        marginBottom: "7px",
    },

    pageTitle: {
        margin: 0,
        fontSize: "30px",
        lineHeight: 1.15,
        color: "#172033",
        fontWeight: "800",
        letterSpacing: "-0.8px",
    },

    pageSubtitle: {
        margin: "7px 0 0",
        color: "#8390a5",
        fontSize: "12px",
    },

    jobBadge: {
        background: "#eef4ff",
        color: "#2563eb",
        padding: "9px 14px",
        borderRadius: "9px",
        fontSize: "11px",
        fontWeight: "800",
        whiteSpace: "nowrap",
    },

    jobCard: {
        background: "#ffffff",
        border: "1px solid #e4e9f1",
        borderRadius: "13px",
        padding: "17px 18px",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        boxShadow:
            "0 3px 12px rgba(20, 35, 60, 0.04)",
        marginBottom: "16px",
    },

    jobCompanyIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "13px",
        flexShrink: 0,
    },

    jobDetails: {
        flex: 1,
    },

    companyName: {
        display: "block",
        fontSize: "10px",
        color: "#7c879a",
        fontWeight: "700",
        marginBottom: "3px",
    },

    jobTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "18px",
        fontWeight: "800",
    },

    jobMeta: {
        display: "inline-block",
        marginTop: "4px",
        color: "#8a96a9",
        fontSize: "10px",
    },

    openBadge: {
        background: "#ecfdf3",
        color: "#15803d",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "1px",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap: "12px",
        marginBottom: "30px",
    },

    statCard: {
        background: "#ffffff",
        border: "1px solid #e4e9f1",
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        alignItems: "center",
        gap: "11px",
        boxShadow:
            "0 3px 12px rgba(20, 35, 60, 0.035)",
    },

    statIcon: {
        width: "34px",
        height: "34px",
        borderRadius: "9px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        flexShrink: 0,
    },

    statLabel: {
        display: "block",
        color: "#8b96a8",
        fontSize: "9px",
        fontWeight: "600",
        marginBottom: "2px",
    },

    statValue: {
        display: "block",
        color: "#172033",
        fontSize: "18px",
        lineHeight: 1.1,
        fontWeight: "800",
    },

    section: {
        marginBottom: "30px",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "14px",
    },

    sectionTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "21px",
        fontWeight: "800",
        letterSpacing: "-0.3px",
    },

    sectionSubtitle: {
        margin: "5px 0 0",
        color: "#8a96a9",
        fontSize: "11px",
    },

    shortlistCard: {
        background:
            "linear-gradient(135deg, #f8fbff, #ffffff)",
        border: "1px solid #dce7fa",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        gap: "15px",
        boxShadow:
            "0 4px 15px rgba(37, 99, 235, 0.04)",
    },

    shortlistIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        flexShrink: 0,
    },

    shortlistContent: {
        flex: 1,
        minWidth: 0,
    },

    shortlistTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "15px",
        fontWeight: "800",
    },

    description: {
        margin: "5px 0 16px",
        color: "#7f8ba0",
        fontSize: "11px",
        lineHeight: 1.6,
    },

    shortlistControls: {
        display: "flex",
        alignItems: "flex-end",
        gap: "12px",
        flexWrap: "wrap",
    },

    inputLabel: {
        display: "block",
        color: "#667389",
        fontSize: "9px",
        fontWeight: "700",
        marginBottom: "5px",
    },

    limitInput: {
        width: "85px",
        height: "38px",
        padding: "0 10px",
        border: "1px solid #d6deea",
        borderRadius: "8px",
        fontSize: "12px",
        color: "#172033",
        outline: "none",
        boxSizing: "border-box",
        background: "#ffffff",
    },

    primaryButton: {
        background:
            "linear-gradient(135deg, #3264e8, #2563eb)",
        color: "#ffffff",
        border: "none",
        padding: "10px 17px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "800",
        boxShadow:
            "0 5px 12px rgba(37, 99, 235, 0.18)",
    },

    shortlistButton: {
        minHeight: "38px",
    },

    inlineError: {
        marginTop: "12px",
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        color: "#be123c",
        padding: "9px 12px",
        borderRadius: "8px",
        fontSize: "10px",
    },

    successBox: {
        marginTop: "15px",
        padding: "13px",
        borderRadius: "9px",
        background: "#ecfdf3",
        border: "1px solid #bbf7d0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
    },

    successTitle: {
        display: "block",
        color: "#15803d",
        fontSize: "11px",
        marginBottom: "2px",
    },

    successText: {
        margin: 0,
        color: "#4b8061",
        fontSize: "10px",
    },

    viewButton: {
        background: "#16a34a",
        color: "#ffffff",
        border: "none",
        padding: "9px 13px",
        borderRadius: "7px",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: "800",
    },

    applicantCount: {
        background: "#eef4ff",
        color: "#2563eb",
        padding: "8px 11px",
        borderRadius: "8px",
        fontSize: "10px",
        fontWeight: "800",
        whiteSpace: "nowrap",
    },

    applicantList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },

    applicantCard: {
        background: "#ffffff",
        border: "1px solid #e3e8f0",
        borderRadius: "14px",
        padding: "19px",
        boxShadow:
            "0 3px 12px rgba(20, 35, 60, 0.035)",
    },

    applicantTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        paddingBottom: "15px",
        borderBottom: "1px solid #edf0f5",
    },

    applicantIdentity: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        minWidth: 0,
    },

    applicantAvatar: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "800",
        flexShrink: 0,
    },

    applicantName: {
        margin: 0,
        color: "#172033",
        fontSize: "15px",
        fontWeight: "800",
    },

    applicantEmail: {
        margin: "3px 0 0",
        color: "#8b96a8",
        fontSize: "10px",
    },

    eligibleBadge: {
        background: "#ecfdf3",
        color: "#15803d",
        padding: "6px 9px",
        borderRadius: "20px",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.8px",
        whiteSpace: "nowrap",
    },

    notEligibleBadge: {
        background: "#fff1f2",
        color: "#be123c",
        padding: "6px 9px",
        borderRadius: "20px",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.8px",
        whiteSpace: "nowrap",
    },

    detailsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px",
        padding: "16px 0",
        borderBottom: "1px solid #edf0f5",
    },

    detailItem: {
        minWidth: 0,
    },

    detailLabel: {
        display: "block",
        color: "#94a0b1",
        fontSize: "8px",
        letterSpacing: "1.2px",
        fontWeight: "800",
        marginBottom: "5px",
    },

    detailValue: {
        display: "block",
        color: "#334155",
        fontSize: "11px",
        fontWeight: "700",
        overflowWrap: "anywhere",
    },

    scoreValue: {
        display: "block",
        color: "#2563eb",
        fontSize: "12px",
        fontWeight: "800",
    },

    scoreSection: {
        padding: "15px 0",
        borderBottom: "1px solid #edf0f5",
    },

    scoreHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "7px",
    },

    scoreText: {
        color: "#2563eb",
        fontSize: "10px",
        fontWeight: "800",
    },

    scoreTrack: {
        width: "100%",
        height: "7px",
        background: "#e9eef7",
        borderRadius: "10px",
        overflow: "hidden",
    },

    scoreFill: {
        height: "100%",
        background:
            "linear-gradient(90deg, #4b7bec, #2563eb)",
        borderRadius: "10px",
        transition: "width 0.4s ease",
    },

    skillsSection: {
        padding: "15px 0",
        borderBottom: "1px solid #edf0f5",
    },

    skillsList: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "8px",
    },

    skillChip: {
        background: "#eef4ff",
        color: "#315eb9",
        border: "1px solid #dce7fb",
        padding: "5px 8px",
        borderRadius: "6px",
        fontSize: "9px",
        fontWeight: "700",
    },

    noSkills: {
        display: "block",
        marginTop: "7px",
        color: "#9aa4b4",
        fontSize: "10px",
    },

    eligibilitySuccess: {
        marginTop: "13px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "#f0fdf4",
        border: "1px solid #dcfce7",
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        color: "#15803d",
        fontSize: "10px",
    },

    eligibilityWarning: {
        marginTop: "13px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "#fff7ed",
        border: "1px solid #fed7aa",
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        color: "#c2410c",
        fontSize: "10px",
    },

    loadingCard: {
        maxWidth: "520px",
        margin: "80px auto",
        background: "#ffffff",
        padding: "45px 30px",
        borderRadius: "14px",
        textAlign: "center",
        border: "1px solid #e3e8f0",
        boxShadow:
            "0 5px 20px rgba(20, 35, 60, 0.06)",
    },

    loadingIcon: {
        width: "46px",
        height: "46px",
        margin: "0 auto 14px",
        borderRadius: "50%",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "800",
    },

    loadingTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "19px",
    },

    loadingText: {
        margin: "7px 0 0",
        color: "#8a96a9",
        fontSize: "11px",
    },

    errorCard: {
        maxWidth: "600px",
        margin: "50px auto",
        background: "#ffffff",
        padding: "35px",
        borderRadius: "14px",
        textAlign: "center",
        border: "1px solid #fecdd3",
        boxShadow:
            "0 5px 20px rgba(20, 35, 60, 0.05)",
    },

    errorIcon: {
        width: "42px",
        height: "42px",
        margin: "0 auto 12px",
        borderRadius: "50%",
        background: "#fff1f2",
        color: "#be123c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "800",
    },

    errorHeading: {
        margin: 0,
        color: "#172033",
        fontSize: "19px",
    },

    errorText: {
        color: "#be123c",
        margin: "8px 0 20px",
        fontSize: "11px",
    },

    emptyCard: {
        background: "#ffffff",
        border: "1px solid #e3e8f0",
        borderRadius: "14px",
        padding: "45px 20px",
        textAlign: "center",
    },

    emptyIcon: {
        fontSize: "28px",
        marginBottom: "10px",
    },

    emptyHeading: {
        margin: 0,
        color: "#172033",
        fontSize: "17px",
    },

    emptyText: {
        margin: "6px 0 0",
        color: "#8a96a9",
        fontSize: "11px",
    },

    footer: {
        borderTop: "1px solid #e3e8f0",
        paddingTop: "18px",
        marginTop: "40px",
        display: "flex",
        justifyContent: "space-between",
        color: "#a0aabd",
        fontSize: "9px",
    },
};

export default RecruiterEvaluate;