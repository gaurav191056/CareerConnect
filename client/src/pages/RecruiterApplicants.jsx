import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

function RecruiterApplicants({ jobId }) {
    const navigate = useNavigate();

    const [applicants, setApplicants] = useState([]);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [rejectingId, setRejectingId] = useState(null);

    // =========================
    // FETCH APPLICANTS
    // =========================

    useEffect(() => {
        if (!jobId) {
            console.error("JOB ID IS UNDEFINED");
            setMessage("Job ID is missing");
            setLoading(false);
            return;
        }

        fetchApplicants();
    }, [jobId]);

    const fetchApplicants = async () => {
        const token = sessionStorage.getItem("token");

        console.log("================================");
        console.log("FETCH APPLICANTS");
        console.log("JOB ID:", jobId);
        console.log("TOKEN EXISTS:", !!token);
        console.log("================================");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const url =
                `${API_URL}/api/applications/job/${jobId}/applicants`;

            console.log("FETCH URL:", url);

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            console.log("RESPONSE STATUS:", response.status);
            console.log("RESPONSE DATA:", data);

            // =========================
            // UNAUTHORIZED
            // =========================

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                navigate("/login");
                return;
            }

            // =========================
            // API ERROR
            // =========================

            if (!response.ok) {
                console.error("API ERROR:", data.message);

                setMessage(
                    data.message || "Failed to load applicants"
                );

                return;
            }

            // =========================
            // SUCCESS
            // =========================

            console.log(
                "SUCCESS APPLICANTS:",
                data.applicants
            );

            console.log(
                "SUCCESS JOB:",
                data.job
            );

            setApplicants(data.applicants || []);
            setJob(data.job || null);
            setMessage("");
        } catch (error) {
            console.error(
                "FETCH APPLICANTS ERROR:",
                error
            );

            setMessage("Cannot connect to server");
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // REJECT APPLICANT
    // =========================

    const handleRejectApplicant = async (applicationId) => {
        if (!applicationId || !jobId) {
            setMessage("Application or Job ID is missing");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to reject this applicant?"
        );

        if (!confirmed) {
            return;
        }

        const token = sessionStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setRejectingId(applicationId);
            setMessage("");

            const url =
                `${API_URL}/api/applications/job/${jobId}/applicant/${applicationId}/reject`;

            console.log("REJECT APPLICANT URL:", url);

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            console.log(
                "REJECT RESPONSE STATUS:",
                response.status
            );

            console.log(
                "REJECT RESPONSE DATA:",
                data
            );

            // =========================
            // UNAUTHORIZED
            // =========================

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                navigate("/login");
                return;
            }

            // =========================
            // API ERROR
            // =========================

            if (!response.ok) {
                setMessage(
                    data.message || "Failed to reject applicant"
                );

                return;
            }

            // =========================
            // UPDATE UI
            // =========================

            setApplicants((currentApplicants) =>
                currentApplicants.map((applicant) =>
                    Number(applicant.application_id) ===
                    Number(applicationId)
                        ? {
                              ...applicant,
                              status: "REJECTED",
                          }
                        : applicant
                )
            );

            setMessage("Applicant rejected successfully");
        } catch (error) {
            console.error(
                "REJECT APPLICANT ERROR:",
                error
            );

            setMessage(
                "Cannot connect to server while rejecting applicant"
            );
        } finally {
            setRejectingId(null);
        }
    };

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
    };

    // =========================
    // BACK TO DASHBOARD
    // =========================

    const handleBackToDashboard = () => {
        window.location.href = "/recruiter/dashboard";
    };

    // =========================
    // HELPERS
    // =========================

    const getInitial = (name) => {
        if (!name) {
            return "S";
        }

        return name.charAt(0).toUpperCase();
    };

    const getStatusClass = (status) => {
        const normalizedStatus = (
            status || "APPLIED"
        ).toUpperCase();

        if (normalizedStatus === "SHORTLISTED") {
            return "statusShortlisted";
        }

        if (normalizedStatus === "REJECTED") {
            return "statusRejected";
        }

        return "statusApplied";
    };

    const formatDate = (date) => {
        if (!date) {
            return "";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString();
    };

    const parseSkills = (skills) => {
        if (!skills) {
            return [];
        }

        if (Array.isArray(skills)) {
            return skills;
        }

        return skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);
    };

    // =========================
    // PAGE
    // =========================

    return (
        <div style={styles.page}>
            {/* HEADER */}

            <header style={styles.header}>
                <div style={styles.headerInner}>
                    <div style={styles.brandWrapper}>
                        <div style={styles.logoMark}>
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
                        <div style={styles.recruiterProfile}>
                            <div style={styles.profileAvatar}>
                                A
                            </div>

                            <div>
                                <strong style={styles.profileName}>
                                    ABC Company
                                </strong>

                                <span style={styles.profileRole}>
                                    Recruiter
                                </span>
                            </div>
                        </div>

                        <button
                            style={styles.logoutButton}
                            onClick={handleLogout}
                        >
                            ↪ Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN */}

            <main style={styles.container}>
                {/* BACK */}

                <button
                    style={styles.backButton}
                    onClick={handleBackToDashboard}
                >
                    ← Back to Dashboard
                </button>

                {/* PAGE INTRO */}

                <section style={styles.pageIntro}>
                    <div>
                        <span style={styles.eyebrow}>
                            RECRUITMENT
                        </span>

                        <h2 style={styles.pageTitle}>
                            Job Applicants
                        </h2>

                        <p style={styles.pageDescription}>
                            Review students who have applied for this
                            opportunity.
                        </p>
                    </div>

                    {!loading &&
                        !message &&
                        applicants.length > 0 && (
                            <div style={styles.applicantCountBadge}>
                                {applicants.length}{" "}
                                {applicants.length === 1
                                    ? "Applicant"
                                    : "Applicants"}
                            </div>
                        )}
                </section>

                {/* JOB SUMMARY */}

                {job && (
                    <section style={styles.jobSummary}>
                        <div style={styles.jobSummaryTop}>
                            <div style={styles.companyAvatar}>
                                A
                            </div>

                            <div style={styles.jobSummaryContent}>
                                <div style={styles.jobCompany}>
                                    ABC Company
                                </div>

                                <h3 style={styles.jobTitle}>
                                    {job.title}
                                </h3>

                                <div style={styles.jobMetaRow}>
                                    {job.location && (
                                        <span style={styles.metaItem}>
                                            📍 {job.location}
                                        </span>
                                    )}

                                    {job.salary && (
                                        <span style={styles.metaItem}>
                                            ₹ {job.salary}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <span style={styles.openBadge}>
                                ● OPEN
                            </span>
                        </div>
                    </section>
                )}

                {/* STATS */}

                {!loading &&
                    !message &&
                    applicants.length > 0 && (
                        <section style={styles.statsGrid}>
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
                                        color: "#15803d",
                                    }}
                                >
                                    ✓
                                </div>

                                <div>
                                    <span style={styles.statLabel}>
                                        Applications
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
                                        background: "#fff7ed",
                                        color: "#ea580c",
                                    }}
                                >
                                    ★
                                </div>

                                <div>
                                    <span style={styles.statLabel}>
                                        Review Status
                                    </span>

                                    <strong style={styles.statValueSmall}>
                                        Ready to Review
                                    </strong>
                                </div>
                            </div>
                        </section>
                    )}

                {/* LOADING */}

                {loading && (
                    <div style={styles.loadingCard}>
                        <div style={styles.loadingSpinner}>
                            ⟳
                        </div>

                        <h3 style={styles.loadingTitle}>
                            Loading applicants
                        </h3>

                        <p style={styles.loadingText}>
                            Please wait while we fetch the latest
                            applications.
                        </p>
                    </div>
                )}

                {/* ERROR / MESSAGE */}

                {!loading && message && (
                    <div
                        style={
                            message ===
                            "Applicant rejected successfully"
                                ? styles.successCard
                                : styles.errorCard
                        }
                    >
                        <div
                            style={
                                message ===
                                "Applicant rejected successfully"
                                    ? styles.successIcon
                                    : styles.errorIcon
                            }
                        >
                            {message ===
                            "Applicant rejected successfully"
                                ? "✓"
                                : "!"}
                        </div>

                        <div style={styles.errorContent}>
                            <h3
                                style={
                                    message ===
                                    "Applicant rejected successfully"
                                        ? styles.successHeading
                                        : styles.errorHeading
                                }
                            >
                                {message ===
                                "Applicant rejected successfully"
                                    ? "Action completed"
                                    : "Unable to load applicants"}
                            </h3>

                            <p
                                style={
                                    message ===
                                    "Applicant rejected successfully"
                                        ? styles.successText
                                        : styles.errorText
                                }
                            >
                                {message}
                            </p>

                            {message !==
                                "Applicant rejected successfully" && (
                                <button
                                    style={styles.retryButton}
                                    onClick={fetchApplicants}
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* NO APPLICANTS */}

                {!loading &&
                    !message &&
                    applicants.length === 0 && (
                        <div style={styles.emptyCard}>
                            <div style={styles.emptyIcon}>
                                👥
                            </div>

                            <h3 style={styles.emptyHeading}>
                                No applicants yet
                            </h3>

                            <p style={styles.emptyText}>
                                No students have applied for this
                                job yet. Applications will appear
                                here once students apply.
                            </p>
                        </div>
                    )}

                {/* APPLICANTS */}

                {!loading &&
                    applicants.length > 0 && (
                        <section>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <span style={styles.eyebrow}>
                                        CANDIDATES
                                    </span>

                                    <h3 style={styles.sectionTitle}>
                                        Applicant Profiles
                                    </h3>

                                    <p style={styles.sectionDescription}>
                                        Review candidate information
                                        before evaluation.
                                    </p>
                                </div>
                            </div>

                            <div style={styles.grid}>
                                {applicants.map(
                                    (applicant, index) => {
                                        const skills =
                                            parseSkills(
                                                applicant.skills
                                            );

                                        const status =
                                            (
                                                applicant.status ||
                                                "APPLIED"
                                            ).toUpperCase();

                                        const applicationId =
                                            applicant.application_id;

                                        const isRejecting =
                                            Number(rejectingId) ===
                                            Number(applicationId);

                                        return (
                                            <article
                                                key={
                                                    applicationId ||
                                                    applicant.student_id ||
                                                    index
                                                }
                                                style={styles.card}
                                            >
                                                {/* CARD HEADER */}

                                                <div
                                                    style={
                                                        styles.cardHeader
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.studentIdentity
                                                        }
                                                    >
                                                        <div
                                                            style={
                                                                styles.studentAvatar
                                                            }
                                                        >
                                                            {getInitial(
                                                                applicant.name
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h3
                                                                style={
                                                                    styles.name
                                                                }
                                                            >
                                                                {applicant.name ||
                                                                    "Student"}
                                                            </h3>

                                                            <p
                                                                style={
                                                                    styles.email
                                                                }
                                                            >
                                                                {applicant.email ||
                                                                    "Email not available"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,
                                                            ...styles[
                                                                getStatusClass(
                                                                    status
                                                                )
                                                            ],
                                                        }}
                                                    >
                                                        ● {status}
                                                    </span>
                                                </div>

                                                {/* BASIC DETAILS */}

                                                <div
                                                    style={
                                                        styles.detailGrid
                                                    }
                                                >
                                                    {applicant.phone && (
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
                                                                PHONE
                                                            </span>

                                                            <strong
                                                                style={
                                                                    styles.detailValue
                                                                }
                                                            >
                                                                {
                                                                    applicant.phone
                                                                }
                                                            </strong>
                                                        </div>
                                                    )}

                                                    {applicant.college && (
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
                                                                COLLEGE
                                                            </span>

                                                            <strong
                                                                style={
                                                                    styles.detailValue
                                                                }
                                                            >
                                                                {
                                                                    applicant.college
                                                                }
                                                            </strong>
                                                        </div>
                                                    )}

                                                    {applicant.degree && (
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
                                                                DEGREE
                                                            </span>

                                                            <strong
                                                                style={
                                                                    styles.detailValue
                                                                }
                                                            >
                                                                {
                                                                    applicant.degree
                                                                }
                                                            </strong>
                                                        </div>
                                                    )}

                                                    {applicant.branch && (
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
                                                                {
                                                                    applicant.branch
                                                                }
                                                            </strong>
                                                        </div>
                                                    )}

                                                    {applicant.cgpa && (
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
                                                                {
                                                                    applicant.cgpa
                                                                }
                                                            </strong>
                                                        </div>
                                                    )}

                                                    {applicant.graduation_year && (
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
                                                                {
                                                                    applicant.graduation_year
                                                                }
                                                            </strong>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* SKILLS */}

                                                {skills.length > 0 && (
                                                    <div
                                                        style={
                                                            styles.contentSection
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.contentTitle
                                                            }
                                                        >
                                                            REQUIRED SKILLS
                                                        </span>

                                                        <div
                                                            style={
                                                                styles.skillsWrapper
                                                            }
                                                        >
                                                            {skills.map(
                                                                (
                                                                    skill,
                                                                    skillIndex
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            skillIndex
                                                                        }
                                                                        style={
                                                                            styles.skillTag
                                                                        }
                                                                    >
                                                                        {
                                                                            skill
                                                                        }
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* PROJECTS */}

                                                {applicant.projects && (
                                                    <div
                                                        style={
                                                            styles.contentSection
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.contentTitle
                                                            }
                                                        >
                                                            PROJECTS
                                                        </span>

                                                        <p
                                                            style={
                                                                styles.contentText
                                                            }
                                                        >
                                                            {
                                                                applicant.projects
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {/* CERTIFICATIONS */}

                                                {applicant.certifications && (
                                                    <div
                                                        style={
                                                            styles.contentSection
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.contentTitle
                                                            }
                                                        >
                                                            CERTIFICATIONS
                                                        </span>

                                                        <p
                                                            style={
                                                                styles.contentText
                                                            }
                                                        >
                                                            {
                                                                applicant.certifications
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {/* INTERNSHIPS */}

                                                {applicant.internships && (
                                                    <div
                                                        style={
                                                            styles.contentSection
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.contentTitle
                                                            }
                                                        >
                                                            INTERNSHIPS
                                                        </span>

                                                        <p
                                                            style={
                                                                styles.contentText
                                                            }
                                                        >
                                                            {
                                                                applicant.internships
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {/* FOOTER */}

                                                <div
                                                    style={
                                                        styles.cardFooter
                                                    }
                                                >
                                                    <div>
                                                        <span
                                                            style={
                                                                styles.appliedLabel
                                                            }
                                                        >
                                                            APPLIED
                                                        </span>

                                                        <span
                                                            style={
                                                                styles.appliedDate
                                                            }
                                                        >
                                                            {applicant.applied_at
                                                                ? formatDate(
                                                                      applicant.applied_at
                                                                  )
                                                                : "Date not available"}
                                                        </span>
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.footerActions
                                                        }
                                                    >
                                                        {applicant.resume_url && (
                                                            <a
                                                                href={
                                                                    applicant.resume_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                style={
                                                                    styles.resumeButton
                                                                }
                                                            >
                                                                📄 View Resume
                                                            </a>
                                                        )}

                                                        {status !==
                                                            "REJECTED" && (
                                                            <button
                                                                type="button"
                                                                style={{
                                                                    ...styles.rejectButton,
                                                                    ...(isRejecting
                                                                        ? styles.rejectButtonDisabled
                                                                        : {}),
                                                                }}
                                                                disabled={
                                                                    isRejecting
                                                                }
                                                                onClick={() =>
                                                                    handleRejectApplicant(
                                                                        applicationId
                                                                    )
                                                                }
                                                            >
                                                                {isRejecting
                                                                    ? "Rejecting..."
                                                                    : "Reject"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    }
                                )}
                            </div>
                        </section>
                    )}
            </main>

            {/* FOOTER */}

            <footer style={styles.footer}>
                <span>
                    CareerConnect · Campus Career Platform
                </span>

                <span>
                    Recruiter Portal
                </span>
            </footer>
        </div>
    );
}

// =========================
// STYLES
// =========================

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f4f7fb",
        color: "#172033",
        fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    header: {
        background: "#ffffff",
        borderBottom: "1px solid #e5e9f0",
        position: "sticky",
        top: 0,
        zIndex: 20,
    },

    headerInner: {
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "18px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
    },

    brandWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    logoMark: {
        width: "40px",
        height: "40px",
        borderRadius: "11px",
        background:
            "linear-gradient(135deg, #315ee8, #4169e8)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "13px",
        boxShadow:
            "0 5px 12px rgba(37, 99, 235, 0.22)",
    },

    logo: {
        margin: 0,
        fontSize: "18px",
        lineHeight: "1.2",
        fontWeight: "800",
        color: "#172033",
    },

    brandSubtitle: {
        margin: "3px 0 0",
        fontSize: "10px",
        color: "#98a2b3",
        fontWeight: "600",
        letterSpacing: "0.2px",
    },

    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
    },

    recruiterProfile: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },

    profileAvatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "13px",
    },

    profileName: {
        display: "block",
        fontSize: "12px",
        color: "#253047",
    },

    profileRole: {
        display: "block",
        fontSize: "10px",
        color: "#8b95a7",
        marginTop: "2px",
    },

    logoutButton: {
        background: "#ffffff",
        color: "#344054",
        border: "1px solid #d9dee8",
        padding: "9px 14px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
    },

    container: {
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "30px 24px 50px",
    },

    backButton: {
        background: "#ffffff",
        color: "#2563eb",
        border: "1px solid #d8e2f5",
        padding: "9px 15px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "700",
        marginBottom: "24px",
    },

    pageIntro: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "22px",
    },

    eyebrow: {
        display: "block",
        color: "#2563eb",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1.8px",
        marginBottom: "7px",
    },

    pageTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "30px",
        lineHeight: "1.15",
        fontWeight: "800",
        letterSpacing: "-0.7px",
    },

    pageDescription: {
        margin: "7px 0 0",
        color: "#7b879b",
        fontSize: "13px",
    },

    applicantCountBadge: {
        background: "#edf4ff",
        color: "#2563eb",
        padding: "9px 13px",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "800",
        whiteSpace: "nowrap",
    },

    jobSummary: {
        background: "#ffffff",
        border: "1px solid #e4e8ef",
        borderRadius: "13px",
        padding: "20px",
        marginBottom: "18px",
        boxShadow:
            "0 5px 18px rgba(31, 45, 61, 0.04)",
    },

    jobSummaryTop: {
        display: "flex",
        alignItems: "center",
        gap: "13px",
    },

    companyAvatar: {
        width: "46px",
        height: "46px",
        borderRadius: "11px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "800",
        flexShrink: 0,
    },

    jobSummaryContent: {
        flex: 1,
        minWidth: 0,
    },

    jobCompany: {
        color: "#7c879a",
        fontSize: "10px",
        fontWeight: "600",
        marginBottom: "3px",
    },

    jobTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "19px",
        fontWeight: "800",
    },

    jobMetaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "7px",
    },

    metaItem: {
        color: "#69758a",
        background: "#f6f8fb",
        padding: "5px 8px",
        borderRadius: "6px",
        fontSize: "10px",
        fontWeight: "600",
    },

    openBadge: {
        background: "#eaf9f0",
        color: "#16834a",
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.8px",
        whiteSpace: "nowrap",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap: "14px",
        marginBottom: "30px",
    },

    statCard: {
        background: "#ffffff",
        border: "1px solid #e5e9f0",
        borderRadius: "12px",
        padding: "15px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow:
            "0 4px 14px rgba(31, 45, 61, 0.035)",
    },

    statIcon: {
        width: "36px",
        height: "36px",
        borderRadius: "9px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "800",
        flexShrink: 0,
    },

    statLabel: {
        display: "block",
        color: "#8993a5",
        fontSize: "9px",
        fontWeight: "700",
        marginBottom: "2px",
    },

    statValue: {
        display: "block",
        color: "#172033",
        fontSize: "20px",
        lineHeight: "1.2",
        fontWeight: "800",
    },

    statValueSmall: {
        display: "block",
        color: "#172033",
        fontSize: "13px",
        lineHeight: "1.4",
        fontWeight: "800",
    },

    sectionHeader: {
        marginBottom: "16px",
    },

    sectionTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "21px",
        fontWeight: "800",
    },

    sectionDescription: {
        margin: "4px 0 0",
        color: "#8a94a6",
        fontSize: "11px",
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(360px, 1fr))",
        gap: "16px",
    },

    card: {
        background: "#ffffff",
        border: "1px solid #e3e8ef",
        borderRadius: "13px",
        padding: "19px",
        boxShadow:
            "0 5px 18px rgba(31, 45, 61, 0.045)",
        minWidth: 0,
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        paddingBottom: "15px",
        borderBottom: "1px solid #edf0f4",
    },

    studentIdentity: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        minWidth: 0,
    },

    studentAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "14px",
        flexShrink: 0,
    },

    name: {
        margin: 0,
        color: "#172033",
        fontSize: "15px",
        lineHeight: "1.25",
        fontWeight: "800",
    },

    email: {
        margin: "3px 0 0",
        color: "#8993a5",
        fontSize: "10px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "190px",
    },

    statusBadge: {
        padding: "5px 8px",
        borderRadius: "20px",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.7px",
        whiteSpace: "nowrap",
    },

    statusApplied: {
        background: "#eef4ff",
        color: "#2563eb",
    },

    statusShortlisted: {
        background: "#eaf9f0",
        color: "#16834a",
    },

    statusRejected: {
        background: "#fff0f0",
        color: "#dc2626",
    },

    detailGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "12px",
        padding: "16px 0",
    },

    detailItem: {
        minWidth: 0,
    },

    detailLabel: {
        display: "block",
        color: "#98a2b3",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.8px",
        marginBottom: "3px",
    },

    detailValue: {
        display: "block",
        color: "#344054",
        fontSize: "10px",
        fontWeight: "700",
        lineHeight: "1.35",
        wordBreak: "break-word",
    },

    contentSection: {
        borderTop: "1px solid #edf0f4",
        paddingTop: "13px",
        marginTop: "2px",
        marginBottom: "4px",
    },

    contentTitle: {
        display: "block",
        color: "#98a2b3",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.8px",
        marginBottom: "8px",
    },

    contentText: {
        margin: 0,
        color: "#5e6a7e",
        fontSize: "10px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },

    skillsWrapper: {
        display: "flex",
        flexWrap: "wrap",
        gap: "5px",
    },

    skillTag: {
        background: "#edf3ff",
        color: "#2858bd",
        padding: "5px 8px",
        borderRadius: "5px",
        fontSize: "9px",
        fontWeight: "700",
    },

    cardFooter: {
        marginTop: "15px",
        paddingTop: "13px",
        borderTop: "1px solid #edf0f4",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
    },

    appliedLabel: {
        display: "block",
        color: "#98a2b3",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.7px",
    },

    appliedDate: {
        display: "block",
        color: "#667085",
        fontSize: "10px",
        fontWeight: "600",
        marginTop: "2px",
    },

    footerActions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: "7px",
    },

    resumeButton: {
        background: "#ffffff",
        border: "1px solid #cfd9eb",
        color: "#2563eb",
        padding: "8px 10px",
        borderRadius: "7px",
        fontSize: "9px",
        fontWeight: "800",
        textDecoration: "none",
        whiteSpace: "nowrap",
    },

    rejectButton: {
        background: "#fff1f2",
        border: "1px solid #fecaca",
        color: "#dc2626",
        padding: "8px 11px",
        borderRadius: "7px",
        cursor: "pointer",
        fontSize: "9px",
        fontWeight: "800",
        whiteSpace: "nowrap",
    },

    rejectButtonDisabled: {
        opacity: 0.6,
        cursor: "not-allowed",
    },

    loadingCard: {
        background: "#ffffff",
        border: "1px solid #e4e8ef",
        borderRadius: "13px",
        padding: "55px 20px",
        textAlign: "center",
        boxShadow:
            "0 5px 18px rgba(31, 45, 61, 0.04)",
    },

    loadingSpinner: {
        fontSize: "28px",
        color: "#2563eb",
        marginBottom: "10px",
    },

    loadingTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "17px",
        fontWeight: "800",
    },

    loadingText: {
        margin: "6px 0 0",
        color: "#8a94a6",
        fontSize: "11px",
    },

    errorCard: {
        background: "#ffffff",
        border: "1px solid #fecaca",
        borderRadius: "13px",
        padding: "25px",
        display: "flex",
        gap: "15px",
        alignItems: "flex-start",
        marginBottom: "20px",
    },

    errorIcon: {
        width: "36px",
        height: "36px",
        borderRadius: "9px",
        background: "#fff1f2",
        color: "#dc2626",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        flexShrink: 0,
    },

    errorContent: {
        flex: 1,
    },

    errorHeading: {
        margin: 0,
        color: "#991b1b",
        fontSize: "15px",
        fontWeight: "800",
    },

    errorText: {
        margin: "5px 0 12px",
        color: "#b42318",
        fontSize: "11px",
    },

    successCard: {
        background: "#ffffff",
        border: "1px solid #bbf7d0",
        borderRadius: "13px",
        padding: "18px 20px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        marginBottom: "20px",
    },

    successIcon: {
        width: "36px",
        height: "36px",
        borderRadius: "9px",
        background: "#ecfdf3",
        color: "#15803d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        flexShrink: 0,
    },

    successHeading: {
        margin: 0,
        color: "#166534",
        fontSize: "15px",
        fontWeight: "800",
    },

    successText: {
        margin: "5px 0 0",
        color: "#15803d",
        fontSize: "11px",
    },

    retryButton: {
        background: "#2563eb",
        color: "#ffffff",
        border: "none",
        padding: "8px 13px",
        borderRadius: "7px",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: "700",
    },

    emptyCard: {
        background: "#ffffff",
        border: "1px solid #e4e8ef",
        borderRadius: "13px",
        padding: "65px 25px",
        textAlign: "center",
        boxShadow:
            "0 5px 18px rgba(31, 45, 61, 0.04)",
    },

    emptyIcon: {
        width: "54px",
        height: "54px",
        borderRadius: "14px",
        background: "#eef4ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 15px",
        fontSize: "22px",
    },

    emptyHeading: {
        margin: 0,
        color: "#172033",
        fontSize: "18px",
        fontWeight: "800",
    },

    emptyText: {
        maxWidth: "420px",
        margin: "7px auto 0",
        color: "#8a94a6",
        fontSize: "11px",
        lineHeight: "1.6",
    },

    footer: {
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "18px 24px 25px",
        borderTop: "1px solid #e2e7ee",
        display: "flex",
        justifyContent: "space-between",
        color: "#9aa4b4",
        fontSize: "9px",
    },
};

export default RecruiterApplicants;