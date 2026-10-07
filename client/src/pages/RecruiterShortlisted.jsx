import { useEffect, useState } from "react";

const API_URL = "https://careerconnect-api-nxj8.onrender.com";

function RecruiterShortlisted({ jobId }) {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedApplicant, setSelectedApplicant] = useState(null);

    const [interviewDate, setInterviewDate] = useState("");
    const [interviewTime, setInterviewTime] = useState("");
    const [mode, setMode] = useState("ONLINE");
    const [meetingLink, setMeetingLink] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");

    const [scheduling, setScheduling] = useState(false);
    const [scheduleMessage, setScheduleMessage] = useState("");
    const [scheduleError, setScheduleError] = useState("");

    useEffect(() => {
        const fetchShortlistedApplicants = async () => {
            try {
                const token = sessionStorage.getItem("token");

                if (!token) {
                    window.location.href = "/login";
                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/applications/job/${jobId}/shortlisted`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();

                console.log("SHORTLISTED API RESPONSE:", result);

                if (response.status === 401) {
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    window.location.href = "/login";
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                            "Failed to load shortlisted applicants"
                    );
                }

                let shortlisted = [];

                if (Array.isArray(result)) {
                    shortlisted = result;
                } else if (Array.isArray(result.shortlisted)) {
                    shortlisted = result.shortlisted;
                } else if (Array.isArray(result.applicants)) {
                    shortlisted = result.applicants;
                } else if (
                    Array.isArray(result.shortlistedApplicants)
                ) {
                    shortlisted = result.shortlistedApplicants;
                }

                setApplicants(shortlisted);
            } catch (err) {
                console.error("SHORTLISTED ERROR:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchShortlistedApplicants();
    }, [jobId]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
    };

    const handleBackToDashboard = () => {
        window.location.href = "/recruiter/dashboard";
    };

    const openScheduleForm = (applicant) => {
        setSelectedApplicant(applicant);

        setInterviewDate("");
        setInterviewTime("");
        setMode("ONLINE");
        setMeetingLink("");
        setLocation("");
        setNotes("");

        setScheduleMessage("");
        setScheduleError("");
    };

    const closeScheduleForm = () => {
        if (scheduling) {
            return;
        }

        setSelectedApplicant(null);
        setScheduleMessage("");
        setScheduleError("");
    };

    const handleScheduleInterview = async (event) => {
        event.preventDefault();

        setScheduleMessage("");
        setScheduleError("");

        if (!interviewDate || !interviewTime) {
            setScheduleError(
                "Interview date and time are required."
            );
            return;
        }

        if (mode === "ONLINE" && !meetingLink.trim()) {
            setScheduleError(
                "Meeting link is required for online interview."
            );
            return;
        }

        if (mode === "OFFLINE" && !location.trim()) {
            setScheduleError(
                "Location is required for offline interview."
            );
            return;
        }

        try {
            setScheduling(true);

            const token = sessionStorage.getItem("token");

            const response = await fetch(
                `${API_URL}/api/interviews`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        application_id:
                            selectedApplicant.application_id,
                        interview_date: interviewDate,
                        interview_time: interviewTime,
                        mode,
                        meeting_link:
                            mode === "ONLINE"
                                ? meetingLink
                                : "",
                        location:
                            mode === "OFFLINE"
                                ? location
                                : "",
                        notes,
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
                        "Failed to schedule interview"
                );
            }

            setScheduleMessage(
                `Interview scheduled successfully for ${selectedApplicant.name}.`
            );

            setTimeout(() => {
                setSelectedApplicant(null);
                setScheduleMessage("");
            }, 1800);
        } catch (err) {
            console.error(
                "SCHEDULE INTERVIEW ERROR:",
                err
            );

            setScheduleError(err.message);
        } finally {
            setScheduling(false);
        }
    };

    const formatAppliedDate = (date) => {
        if (!date) {
            return "N/A";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "N/A";
        }

        return parsedDate.toLocaleDateString("en-GB");
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <header style={styles.header}>
                    <div style={styles.brandArea}>
                        <div style={styles.logoBox}>CC</div>

                        <div>
                            <div style={styles.logoText}>
                                CareerConnect
                            </div>

                            <div style={styles.logoSubtext}>
                                Campus Career Platform
                            </div>
                        </div>
                    </div>

                    <div style={styles.headerRight}>
                        <div style={styles.recruiterInfo}>
                            <div style={styles.avatar}>
                                A
                            </div>

                            <div>
                                <div style={styles.recruiterName}>
                                    ABC Company
                                </div>

                                <div style={styles.recruiterRole}>
                                    Recruiter
                                </div>
                            </div>
                        </div>

                        <button
                            style={styles.logoutButton}
                            onClick={handleLogout}
                        >
                            ↪ Logout
                        </button>
                    </div>
                </header>

                <main style={styles.container}>
                    <div style={styles.loadingCard}>
                        <div style={styles.loadingIcon}>
                            ✓
                        </div>

                        <h2 style={styles.loadingTitle}>
                            Loading shortlisted applicants
                        </h2>

                        <p style={styles.loadingText}>
                            Please wait while we load the selected
                            candidates.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.brandArea}>
                    <div style={styles.logoBox}>CC</div>

                    <div>
                        <div style={styles.logoText}>
                            CareerConnect
                        </div>

                        <div style={styles.logoSubtext}>
                            Campus Career Platform
                        </div>
                    </div>
                </div>

                <div style={styles.headerRight}>
                    <div style={styles.recruiterInfo}>
                        <div style={styles.avatar}>
                            A
                        </div>

                        <div>
                            <div style={styles.recruiterName}>
                                ABC Company
                            </div>

                            <div style={styles.recruiterRole}>
                                Recruiter
                            </div>
                        </div>
                    </div>

                    <button
                        style={styles.logoutButton}
                        onClick={handleLogout}
                    >
                        ↪ Logout
                    </button>
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

                {/* PAGE HEADER */}
                <div style={styles.pageHeader}>
                    <div>
                        <div style={styles.eyebrow}>
                            RECRUITMENT
                        </div>

                        <h1 style={styles.title}>
                            Shortlisted Applicants
                        </h1>

                        <p style={styles.subtitle}>
                            Review candidates selected for the next
                            stage of the hiring process.
                        </p>
                    </div>

                    <div style={styles.countBadge}>
                        {applicants.length}{" "}
                        {applicants.length === 1
                            ? "Applicant"
                            : "Applicants"}
                    </div>
                </div>

                {/* JOB CARD */}
                <div style={styles.jobCard}>
                    <div style={styles.jobIcon}>A</div>

                    <div style={styles.jobInfo}>
                        <div style={styles.companyName}>
                            ABC Company
                        </div>

                        <div style={styles.jobTitle}>
                            Job #{jobId}
                        </div>

                        <div style={styles.jobId}>
                            Job ID: {jobId}
                        </div>
                    </div>

                    <div style={styles.openBadge}>
                        <span style={styles.badgeDot}></span>
                        OPEN
                    </div>
                </div>

                {/* SUMMARY */}
                <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                        <div
                            style={{
                                ...styles.summaryIcon,
                                background: "#eef4ff",
                                color: "#2563eb",
                            }}
                        >
                            👥
                        </div>

                        <div>
                            <div style={styles.summaryLabel}>
                                Total Shortlisted
                            </div>

                            <div style={styles.summaryValue}>
                                {applicants.length}
                            </div>
                        </div>
                    </div>

                    <div style={styles.summaryCard}>
                        <div
                            style={{
                                ...styles.summaryIcon,
                                background: "#ecfdf3",
                                color: "#16a34a",
                            }}
                        >
                            ✓
                        </div>

                        <div>
                            <div style={styles.summaryLabel}>
                                Candidate Status
                            </div>

                            <div style={styles.summaryTextValue}>
                                Ready for Interview
                            </div>
                        </div>
                    </div>

                    <div style={styles.summaryCard}>
                        <div
                            style={{
                                ...styles.summaryIcon,
                                background: "#fff7ed",
                                color: "#f97316",
                            }}
                        >
                            ★
                        </div>

                        <div>
                            <div style={styles.summaryLabel}>
                                Hiring Stage
                            </div>

                            <div style={styles.summaryTextValue}>
                                Interview
                            </div>
                        </div>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div style={styles.errorCard}>
                        <div style={styles.errorIcon}>!</div>

                        <div>
                            <h3 style={styles.errorTitle}>
                                Failed to load applicants
                            </h3>

                            <p style={styles.errorText}>
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* CANDIDATES HEADER */}
                {!error && (
                    <div style={styles.sectionHeader}>
                        <div>
                            <div style={styles.eyebrow}>
                                CANDIDATES
                            </div>

                            <h2 style={styles.sectionTitle}>
                                Selected Candidates
                            </h2>

                            <p style={styles.sectionSubtitle}>
                                Review candidate profiles and schedule
                                interviews.
                            </p>
                        </div>

                        <div style={styles.countBadge}>
                            {applicants.length}{" "}
                            {applicants.length === 1
                                ? "Applicant"
                                : "Applicants"}
                        </div>
                    </div>
                )}

                {/* EMPTY */}
                {!error && applicants.length === 0 && (
                    <div style={styles.emptyCard}>
                        <div style={styles.emptyIcon}>
                            👥
                        </div>

                        <h2 style={styles.emptyTitle}>
                            No Shortlisted Applicants
                        </h2>

                        <p style={styles.emptyText}>
                            No applicants have been shortlisted
                            for this job yet.
                        </p>
                    </div>
                )}

                {/* APPLICANTS */}
                {!error && applicants.length > 0 && (
                    <div style={styles.applicantsList}>
                        {applicants.map((applicant, index) => (
                            <div
                                key={
                                    applicant.application_id ||
                                    applicant.id ||
                                    index
                                }
                                style={styles.applicantCard}
                            >
                                {/* CANDIDATE HEADER */}
                                <div style={styles.candidateHeader}>
                                    <div style={styles.candidateIdentity}>
                                        <div style={styles.candidateAvatar}>
                                            {(
                                                applicant.name ||
                                                "S"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            <h2
                                                style={
                                                    styles.candidateName
                                                }
                                            >
                                                {applicant.name ||
                                                    "Unknown Student"}
                                            </h2>

                                            <p
                                                style={
                                                    styles.candidateEmail
                                                }
                                            >
                                                {applicant.email ||
                                                    "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    <span style={styles.shortlistedBadge}>
                                        <span
                                            style={
                                                styles.badgeDot
                                            }
                                        ></span>
                                        SHORTLISTED
                                    </span>
                                </div>

                                {/* DETAILS */}
                                <div style={styles.detailsGrid}>
                                    <div style={styles.detailItem}>
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
                                            {applicant.phone ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                    <div style={styles.detailItem}>
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

                                    <div style={styles.detailItem}>
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
                                            {applicant.college ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                    <div style={styles.detailItem}>
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
                                            {applicant.degree ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                    <div style={styles.detailItem}>
                                        <span
                                            style={
                                                styles.detailLabel
                                            }
                                        >
                                            CGPA
                                        </span>

                                        <strong
                                            style={
                                                styles.cgpaValue
                                            }
                                        >
                                            {applicant.cgpa ??
                                                "N/A"}
                                        </strong>
                                    </div>

                                    <div style={styles.detailItem}>
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
                                </div>

                                {/* SKILLS */}
                                <div style={styles.section}>
                                    <div
                                        style={
                                            styles.sectionLabel
                                        }
                                    >
                                        SKILLS
                                    </div>

                                    {applicant.skills ? (
                                        <div style={styles.skillList}>
                                            {String(
                                                applicant.skills
                                            )
                                                .split(",")
                                                .map(
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
                                                            {skill.trim()}
                                                        </span>
                                                    )
                                                )}
                                        </div>
                                    ) : (
                                        <p
                                            style={
                                                styles.naText
                                            }
                                        >
                                            N/A
                                        </p>
                                    )}
                                </div>

                                {/* PROJECTS */}
                                <div style={styles.section}>
                                    <div
                                        style={
                                            styles.sectionLabel
                                        }
                                    >
                                        PROJECTS
                                    </div>

                                    <p
                                        style={
                                            styles.sectionContent
                                        }
                                    >
                                        {applicant.projects ||
                                            "N/A"}
                                    </p>
                                </div>

                                {/* CERTIFICATIONS */}
                                <div style={styles.section}>
                                    <div
                                        style={
                                            styles.sectionLabel
                                        }
                                    >
                                        CERTIFICATIONS
                                    </div>

                                    <p
                                        style={
                                            styles.sectionContent
                                        }
                                    >
                                        {applicant.certification ||
                                            applicant.certifications ||
                                            "N/A"}
                                    </p>
                                </div>

                                {/* INTERNSHIP */}
                                <div style={styles.section}>
                                    <div
                                        style={
                                            styles.sectionLabel
                                        }
                                    >
                                        INTERNSHIP
                                    </div>

                                    <p
                                        style={
                                            styles.sectionContent
                                        }
                                    >
                                        {applicant.internship ||
                                            applicant.internships ||
                                            "N/A"}
                                    </p>
                                </div>

                                {/* FOOTER ACTIONS */}
                                <div style={styles.cardFooter}>
                                    <div>
                                        {applicant.resume_url ? (
                                            <a
                                                href={
                                                    applicant.resume_url.startsWith(
                                                        "http"
                                                    )
                                                        ? applicant.resume_url
                                                        : `${API_URL}/uploads/student-documents/${applicant.resume_url}`
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                style={
                                                    styles.resumeButton
                                                }
                                            >
                                                View Resume
                                            </a>
                                        ) : (
                                            <span
                                                style={
                                                    styles.noResume
                                                }
                                            >
                                                Resume not available
                                            </span>
                                        )}

                                        {applicant.applied_at && (
                                            <div
                                                style={
                                                    styles.appliedDate
                                                }
                                            >
                                                Applied{" "}
                                                {formatAppliedDate(
                                                    applicant.applied_at
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        style={
                                            styles.scheduleButton
                                        }
                                        onClick={() =>
                                            openScheduleForm(
                                                applicant
                                            )
                                        }
                                    >
                                        Schedule Interview →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* SCHEDULE INTERVIEW MODAL */}
            {selectedApplicant && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <div>
                                <div style={styles.modalEyebrow}>
                                    INTERVIEW SCHEDULING
                                </div>

                                <h2
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    Schedule Interview
                                </h2>

                                <p
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    Candidate:{" "}
                                    <strong>
                                        {
                                            selectedApplicant.name
                                        }
                                    </strong>
                                </p>
                            </div>

                            <button
                                style={styles.closeButton}
                                onClick={closeScheduleForm}
                                disabled={scheduling}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleScheduleInterview
                            }
                        >
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label
                                        style={
                                            styles.formLabel
                                        }
                                    >
                                        Interview Date
                                    </label>

                                    <input
                                        type="date"
                                        value={interviewDate}
                                        onChange={(e) =>
                                            setInterviewDate(
                                                e.target.value
                                            )
                                        }
                                        required
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label
                                        style={
                                            styles.formLabel
                                        }
                                    >
                                        Interview Time
                                    </label>

                                    <input
                                        type="time"
                                        value={interviewTime}
                                        onChange={(e) =>
                                            setInterviewTime(
                                                e.target.value
                                            )
                                        }
                                        required
                                        style={
                                            styles.input
                                        }
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label
                                    style={styles.formLabel}
                                >
                                    Interview Mode
                                </label>

                                <select
                                    value={mode}
                                    onChange={(e) =>
                                        setMode(
                                            e.target.value
                                        )
                                    }
                                    style={styles.input}
                                >
                                    <option value="ONLINE">
                                        Online
                                    </option>

                                    <option value="OFFLINE">
                                        Offline
                                    </option>
                                </select>
                            </div>

                            {mode === "ONLINE" && (
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.formLabel
                                        }
                                    >
                                        Meeting Link
                                    </label>

                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/..."
                                        value={meetingLink}
                                        onChange={(e) =>
                                            setMeetingLink(
                                                e.target.value
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </div>
                            )}

                            {mode === "OFFLINE" && (
                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >
                                    <label
                                        style={
                                            styles.formLabel
                                        }
                                    >
                                        Location
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Interview venue"
                                        value={location}
                                        onChange={(e) =>
                                            setLocation(
                                                e.target.value
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    />
                                </div>
                            )}

                            <div style={styles.formGroup}>
                                <label
                                    style={styles.formLabel}
                                >
                                    Notes
                                </label>

                                <textarea
                                    placeholder="Optional interview instructions..."
                                    value={notes}
                                    onChange={(e) =>
                                        setNotes(
                                            e.target.value
                                        )
                                    }
                                    rows="4"
                                    style={
                                        styles.textarea
                                    }
                                />
                            </div>

                            {scheduleError && (
                                <div
                                    style={
                                        styles.formError
                                    }
                                >
                                    {scheduleError}
                                </div>
                            )}

                            {scheduleMessage && (
                                <div
                                    style={
                                        styles.formSuccess
                                    }
                                >
                                    {scheduleMessage}
                                </div>
                            )}

                            <div
                                style={
                                    styles.modalActions
                                }
                            >
                                <button
                                    type="button"
                                    onClick={
                                        closeScheduleForm
                                    }
                                    disabled={scheduling}
                                    style={
                                        styles.cancelButton
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={scheduling}
                                    style={
                                        styles.submitButton
                                    }
                                >
                                    {scheduling
                                        ? "Scheduling..."
                                        : "Schedule Interview →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer style={styles.footer}>
                <span>
                    CareerConnect · Campus Career Platform
                </span>

                <span>Recruiter Portal</span>
            </footer>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#172033",
        fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    header: {
        height: "72px",
        padding: "0 64px",
        background: "#ffffff",
        borderBottom: "1px solid #e8edf5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
    },

    brandArea: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    logoBox: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background:
            "linear-gradient(135deg, #2563eb, #4f7cff)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "800",
        boxShadow:
            "0 5px 14px rgba(37, 99, 235, 0.22)",
    },

    logoText: {
        fontSize: "16px",
        fontWeight: "800",
        color: "#172033",
        lineHeight: "18px",
    },

    logoSubtext: {
        fontSize: "9px",
        color: "#8b9ab3",
        marginTop: "2px",
        letterSpacing: "0.2px",
    },

    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
    },

    recruiterInfo: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
    },

    avatar: {
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "13px",
    },

    recruiterName: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#263248",
    },

    recruiterRole: {
        fontSize: "9px",
        color: "#93a0b5",
        marginTop: "2px",
    },

    logoutButton: {
        background: "#ffffff",
        border: "1px solid #dce3ed",
        color: "#344054",
        padding: "8px 13px",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer",
    },

    container: {
        width: "calc(100% - 128px)",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "38px 0 70px",
        boxSizing: "border-box",
    },

    backButton: {
        border: "none",
        background: "transparent",
        color: "#2563eb",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600",
        padding: "0",
        marginBottom: "30px",
    },

    pageHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "26px",
    },

    eyebrow: {
        color: "#2563eb",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "2.4px",
        marginBottom: "8px",
    },

    title: {
        margin: 0,
        fontSize: "32px",
        lineHeight: "1.1",
        letterSpacing: "-1px",
        color: "#172033",
        fontWeight: "800",
    },

    subtitle: {
        margin: "9px 0 0",
        color: "#8492aa",
        fontSize: "12px",
        lineHeight: "1.5",
    },

    countBadge: {
        background: "#eef4ff",
        color: "#2563eb",
        padding: "10px 15px",
        borderRadius: "10px",
        fontSize: "11px",
        fontWeight: "700",
        whiteSpace: "nowrap",
    },

    jobCard: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "14px",
        padding: "22px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow:
            "0 4px 14px rgba(28, 45, 75, 0.035)",
        marginBottom: "18px",
    },

    jobIcon: {
        width: "44px",
        height: "44px",
        borderRadius: "10px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "14px",
    },

    jobInfo: {
        flex: 1,
    },

    companyName: {
        color: "#8492aa",
        fontSize: "10px",
        fontWeight: "600",
        marginBottom: "4px",
    },

    jobTitle: {
        color: "#172033",
        fontSize: "18px",
        fontWeight: "800",
    },

    jobId: {
        color: "#a0aabe",
        fontSize: "10px",
        marginTop: "4px",
    },

    openBadge: {
        background: "#ecfdf3",
        color: "#16834c",
        borderRadius: "20px",
        padding: "7px 11px",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "0.6px",
        display: "flex",
        alignItems: "center",
        gap: "5px",
    },

    badgeDot: {
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: "currentColor",
        display: "inline-block",
    },

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap: "14px",
        marginBottom: "40px",
    },

    summaryCard: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "13px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        boxShadow:
            "0 4px 14px rgba(28, 45, 75, 0.03)",
    },

    summaryIcon: {
        width: "34px",
        height: "34px",
        borderRadius: "9px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "800",
        flexShrink: 0,
    },

    summaryLabel: {
        color: "#8c99af",
        fontSize: "9px",
        fontWeight: "700",
        marginBottom: "4px",
    },

    summaryValue: {
        color: "#172033",
        fontSize: "20px",
        fontWeight: "800",
    },

    summaryTextValue: {
        color: "#263248",
        fontSize: "12px",
        fontWeight: "800",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "18px",
        gap: "20px",
    },

    sectionTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "21px",
        letterSpacing: "-0.4px",
        fontWeight: "800",
    },

    sectionSubtitle: {
        margin: "6px 0 0",
        color: "#92a0b5",
        fontSize: "10px",
    },

    applicantsList: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },

    applicantCard: {
        background: "#ffffff",
        border: "1px solid #e6ebf2",
        borderRadius: "14px",
        padding: "24px",
        boxShadow:
            "0 5px 18px rgba(28, 45, 75, 0.035)",
    },

    candidateHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        paddingBottom: "18px",
        borderBottom: "1px solid #edf0f5",
    },

    candidateIdentity: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    candidateAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "800",
    },

    candidateName: {
        margin: 0,
        color: "#172033",
        fontSize: "16px",
        fontWeight: "800",
    },

    candidateEmail: {
        margin: "4px 0 0",
        color: "#91a0b5",
        fontSize: "10px",
    },

    shortlistedBadge: {
        background: "#ecfdf3",
        color: "#16834c",
        borderRadius: "20px",
        padding: "7px 11px",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.7px",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        whiteSpace: "nowrap",
    },

    detailsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap: "20px",
        padding: "20px 0",
        borderBottom: "1px solid #edf0f5",
    },

    detailItem: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },

    detailLabel: {
        color: "#9aa7ba",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "1.8px",
    },

    detailValue: {
        color: "#344054",
        fontSize: "11px",
        fontWeight: "700",
    },

    cgpaValue: {
        color: "#2563eb",
        fontSize: "13px",
        fontWeight: "800",
    },

    section: {
        padding: "16px 0",
        borderBottom: "1px solid #edf0f5",
    },

    sectionLabel: {
        color: "#9aa7ba",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "1.8px",
        marginBottom: "10px",
    },

    sectionContent: {
        margin: 0,
        color: "#536176",
        fontSize: "11px",
        lineHeight: "1.6",
    },

    naText: {
        margin: 0,
        color: "#8c98aa",
        fontSize: "11px",
    },

    skillList: {
        display: "flex",
        flexWrap: "wrap",
        gap: "7px",
    },

    skillTag: {
        background: "#eef4ff",
        color: "#2563eb",
        padding: "6px 9px",
        borderRadius: "6px",
        fontSize: "9px",
        fontWeight: "700",
    },

    cardFooter: {
        paddingTop: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
    },

    noResume: {
        color: "#9aa7ba",
        fontSize: "10px",
    },

    resumeButton: {
        display: "inline-block",
        color: "#2563eb",
        textDecoration: "none",
        fontSize: "10px",
        fontWeight: "700",
        marginRight: "15px",
    },

    appliedDate: {
        color: "#a0aabe",
        fontSize: "9px",
        marginTop: "7px",
    },

    scheduleButton: {
        border: "none",
        background:
            "linear-gradient(135deg, #2563eb, #356df0)",
        color: "#ffffff",
        padding: "11px 17px",
        borderRadius: "9px",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow:
            "0 6px 14px rgba(37, 99, 235, 0.2)",
        whiteSpace: "nowrap",
    },

    errorCard: {
        background: "#fff5f5",
        border: "1px solid #fecaca",
        borderRadius: "12px",
        padding: "18px",
        display: "flex",
        gap: "12px",
        marginBottom: "25px",
    },

    errorIcon: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "#fee2e2",
        color: "#dc2626",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        flexShrink: 0,
    },

    errorTitle: {
        margin: 0,
        color: "#991b1b",
        fontSize: "13px",
    },

    errorText: {
        margin: "5px 0 0",
        color: "#b91c1c",
        fontSize: "11px",
    },

    emptyCard: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "14px",
        padding: "60px 25px",
        textAlign: "center",
    },

    emptyIcon: {
        width: "50px",
        height: "50px",
        margin: "0 auto 15px",
        borderRadius: "14px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
    },

    emptyTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "18px",
    },

    emptyText: {
        color: "#8d9bb0",
        fontSize: "11px",
        marginTop: "7px",
    },

    loadingCard: {
        background: "#ffffff",
        border: "1px solid #e8edf4",
        borderRadius: "14px",
        padding: "70px 30px",
        textAlign: "center",
        boxShadow:
            "0 5px 18px rgba(28, 45, 75, 0.035)",
    },

    loadingIcon: {
        width: "45px",
        height: "45px",
        margin: "0 auto 15px",
        borderRadius: "12px",
        background: "#eef4ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
    },

    loadingTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "18px",
    },

    loadingText: {
        color: "#8c99af",
        fontSize: "11px",
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
    },

    modal: {
        width: "100%",
        maxWidth: "560px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#ffffff",
        borderRadius: "16px",
        padding: "28px",
        boxShadow:
            "0 25px 70px rgba(15, 23, 42, 0.22)",
        boxSizing: "border-box",
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "25px",
    },

    modalEyebrow: {
        color: "#2563eb",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "1.8px",
        marginBottom: "7px",
    },

    modalTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "22px",
        fontWeight: "800",
    },

    modalSubtitle: {
        margin: "7px 0 0",
        color: "#8b98ac",
        fontSize: "11px",
    },

    closeButton: {
        border: "none",
        background: "#f5f7fb",
        color: "#667085",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        fontSize: "22px",
        lineHeight: "1",
        cursor: "pointer",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
    },

    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        marginBottom: "16px",
    },

    formLabel: {
        color: "#344054",
        fontSize: "10px",
        fontWeight: "700",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 12px",
        border: "1px solid #dce2eb",
        borderRadius: "8px",
        fontSize: "12px",
        color: "#344054",
        background: "#ffffff",
        outline: "none",
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 12px",
        border: "1px solid #dce2eb",
        borderRadius: "8px",
        fontSize: "12px",
        color: "#344054",
        background: "#ffffff",
        resize: "vertical",
        fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        outline: "none",
    },

    formError: {
        background: "#fff1f2",
        color: "#be123c",
        padding: "11px 13px",
        borderRadius: "8px",
        marginBottom: "15px",
        fontSize: "11px",
    },

    formSuccess: {
        background: "#ecfdf3",
        color: "#15803d",
        padding: "11px 13px",
        borderRadius: "8px",
        marginBottom: "15px",
        fontSize: "11px",
        fontWeight: "600",
    },

    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "8px",
    },

    cancelButton: {
        border: "1px solid #dce2eb",
        background: "#ffffff",
        color: "#475467",
        padding: "10px 17px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: "700",
    },

    submitButton: {
        border: "none",
        background:
            "linear-gradient(135deg, #2563eb, #356df0)",
        color: "#ffffff",
        padding: "10px 17px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: "700",
    },

    footer: {
        width: "calc(100% - 128px)",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px 0 30px",
        borderTop: "1px solid #e5eaf1",
        display: "flex",
        justifyContent: "space-between",
        color: "#a1adbf",
        fontSize: "9px",
        boxSizing: "border-box",
    },
};

export default RecruiterShortlisted;