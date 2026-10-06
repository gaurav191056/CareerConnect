import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5001/api";

const EMPTY_FORM = {
  title: "",
  description: "",
  location: "",
  salary: "",
  min_cgpa: "",
  required_branch: "",
  required_skills: "",
  graduation_year: "",
};

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [savingJob, setSavingJob] = useState(false);
  const [jobForm, setJobForm] = useState({ ...EMPTY_FORM });

  const token = sessionStorage.getItem("token");

  const getUser = () => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch (error) {
      console.error("USER PARSE ERROR:", error);
      return {};
    }
  };

  const user = getUser();

  const recruiterName = user?.name || "Recruiter";

  const recruiterInitial =
    recruiterName?.charAt(0)?.toUpperCase() || "R";

  const isRecruiter =
    user?.role?.toUpperCase() === "RECRUITER";

  // =========================
  // FETCH JOBS
  // =========================

  const fetchJobs = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/jobs/recruiter`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to load jobs"
        );
      }

      setJobs(
        Array.isArray(data.jobs)
          ? data.jobs
          : Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error("FETCH JOBS ERROR:", err);

      setError(
        err.message || "Failed to load jobs"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // =========================
  // DYNAMIC STATISTICS
  // =========================

  const totalJobs = useMemo(() => {
    return jobs.length;
  }, [jobs]);

  const openJobs = useMemo(() => {
    return jobs.filter((job) => {
      const status = String(
        job?.status || "OPEN"
      ).trim().toUpperCase();

      return (
        status === "OPEN" ||
        status === "ACTIVE"
      );
    }).length;
  }, [jobs]);

  const closedJobs = useMemo(() => {
    return jobs.filter((job) => {
      const status = String(
        job?.status || "OPEN"
      ).trim().toUpperCase();

      return (
        status === "CLOSED" ||
        status === "EXPIRED"
      );
    }).length;
  }, [jobs]);

  const recruitmentStatus =
    openJobs > 0 ? "Active" : "Inactive";

  // =========================
  // FORM HELPERS
  // =========================

  const resetJobForm = () => {
    setJobForm({ ...EMPTY_FORM });
  };

  const closeJobForm = () => {
    resetJobForm();
    setShowCreateJob(false);
    setEditingJobId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setJobForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================
  // CREATE JOB
  // =========================

  const createJob = async (e) => {
    e.preventDefault();

    if (!jobForm.title.trim()) {
      alert("Please enter a job title.");
      return;
    }

    try {
      setSavingJob(true);

      const response = await fetch(
        `${API_URL}/jobs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jobForm),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create job"
        );
      }

      alert("Job created successfully!");

      closeJobForm();

      await fetchJobs();
    } catch (err) {
      console.error("CREATE JOB ERROR:", err);

      alert(
        err.message || "Failed to create job"
      );
    } finally {
      setSavingJob(false);
    }
  };

  // =========================
  // EDIT JOB
  // =========================

  const openEditJob = (job) => {
    setJobForm({
      title: job.title || "",
      description: job.description || "",
      location: job.location || "",
      salary: job.salary || "",
      min_cgpa:
        job.min_cgpa === null ||
        job.min_cgpa === undefined
          ? ""
          : job.min_cgpa,
      required_branch:
        job.required_branch || "",
      required_skills:
        job.required_skills || "",
      graduation_year:
        job.graduation_year === null ||
        job.graduation_year === undefined
          ? ""
          : job.graduation_year,
    });

    setEditingJobId(job.id);
    setShowCreateJob(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // UPDATE JOB
  // =========================

  const updateJob = async (e) => {
    e.preventDefault();

    if (!editingJobId) {
      return;
    }

    if (!jobForm.title.trim()) {
      alert("Please enter a job title.");
      return;
    }

    try {
      setSavingJob(true);

      const response = await fetch(
        `${API_URL}/jobs/${editingJobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jobForm),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to update job"
        );
      }

      alert("Job updated successfully!");

      closeJobForm();

      await fetchJobs();
    } catch (err) {
      console.error("UPDATE JOB ERROR:", err);

      alert(
        err.message || "Failed to update job"
      );
    } finally {
      setSavingJob(false);
    }
  };

  // =========================
  // DELETE JOB
  // =========================

  const deleteJob = async (jobId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingJobId(jobId);

      const response = await fetch(
        `${API_URL}/jobs/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to delete job"
        );
      }

      alert("Job deleted successfully!");

      setJobs((currentJobs) =>
        currentJobs.filter(
          (job) => job.id !== jobId
        )
      );

      if (editingJobId === jobId) {
        closeJobForm();
      }
    } catch (err) {
      console.error("DELETE JOB ERROR:", err);

      alert(
        err.message || "Failed to delete job"
      );
    } finally {
      setDeletingJobId(null);
    }
  };

  // =========================
  // NAVIGATION
  // =========================

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    window.location.href = "/login";
  };

  const goToApplicants = (jobId) => {
    window.location.href =
      `/recruiter/applicants/${jobId}`;
  };

  const goToEvaluate = (jobId) => {
    window.location.href =
      `/recruiter/evaluate/${jobId}`;
  };

  // =========================
  // LOGIN CHECK
  // =========================

  if (!token) {
    return (
      <div style={styles.center}>
        <div style={styles.loginCard}>
          <div style={styles.loginIcon}>
            CC
          </div>

          <h2 style={styles.loginTitle}>
            Please login first
          </h2>

          <p style={styles.loginText}>
            You need to login as a recruiter
            to access this dashboard.
          </p>

          <button
            onClick={() => {
              window.location.href =
                "/login";
            }}
            style={styles.primaryButton}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isRecruiter) {
    return (
      <div style={styles.center}>
        <div style={styles.loginCard}>
          <div style={styles.loginIcon}>
            CC
          </div>

          <h2 style={styles.loginTitle}>
            Recruiter access required
          </h2>

          <p style={styles.loginText}>
            This dashboard is available only
            for recruiter accounts.
          </p>

          <button
            onClick={handleLogout}
            style={styles.primaryButton}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div style={styles.page}>
      {/* HEADER */}

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandArea}>
            <div style={styles.brandLogo}>
              CC
            </div>

            <div>
              <div style={styles.brandName}>
                CareerConnect
              </div>

              <div style={styles.brandSubtitle}>
                Campus Career Platform
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                {recruiterInitial}
              </div>

              <div style={styles.userDetails}>
                <strong>
                  {recruiterName}
                </strong>

                <span>Recruiter</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              ↪&nbsp; Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main style={styles.container}>
        {/* HERO */}

        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>
              RECRUITER DASHBOARD
            </div>

            <h1 style={styles.heroTitle}>
              Manage your{" "}
              <span
                style={{
                  color: "#b9d0ff",
                }}
              >
                career opportunities
              </span>
            </h1>

            <p style={styles.heroText}>
              Create job openings, review
              applicants, and find the right
              candidates for your organization.
            </p>
          </div>

          <div style={styles.heroDecoration}>
            <div
              style={styles.heroCircleOne}
            />

            <div
              style={styles.heroCircleTwo}
            />

            <div style={styles.heroSpark}>
              ✦
            </div>
          </div>
        </section>

        {/* STATS */}

        <section style={styles.statsGrid}>
          {/* TOTAL JOBS */}

          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                background: "#eef4ff",
              }}
            >
              💼
            </div>

            <div>
              <span style={styles.statLabel}>
                Total Jobs
              </span>

              <strong style={styles.statValue}>
                {totalJobs}
              </strong>
            </div>
          </div>

          {/* OPEN JOBS */}

          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                background: "#ecfdf3",
              }}
            >
              ✓
            </div>

            <div>
              <span style={styles.statLabel}>
                Open Jobs
              </span>

              <strong style={styles.statValue}>
                {openJobs}
              </strong>
            </div>
          </div>

          {/* RECRUITMENT */}

          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                background:
                  recruitmentStatus === "Active"
                    ? "#fff7ed"
                    : "#fef2f2",
              }}
            >
              📋
            </div>

            <div>
              <span style={styles.statLabel}>
                Recruitment
              </span>

              <strong
                style={{
                  ...styles.statValue,
                  color:
                    recruitmentStatus ===
                    "Active"
                      ? "#172033"
                      : "#b42318",
                }}
              >
                {recruitmentStatus}
              </strong>
            </div>
          </div>

          {/* PLATFORM */}

          <div style={styles.statCard}>
            <div
              style={{
                ...styles.statIcon,
                background: "#f3e8ff",
              }}
            >
              ⚡
            </div>

            <div>
              <span style={styles.statLabel}>
                Platform
              </span>

              <strong
                style={{
                  ...styles.statValue,
                  fontSize: "14px",
                }}
              >
                CareerConnect
              </strong>
            </div>
          </div>
        </section>

        {/* JOB SECTION HEADER */}

        <section style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>
              RECRUITMENT
            </div>

            <h2 style={styles.sectionTitle}>
              My Jobs
            </h2>

            <p style={styles.sectionSubtitle}>
              Manage your job openings and
              applicants.
            </p>
          </div>

          <button
            onClick={() => {
              if (editingJobId) {
                closeJobForm();
              } else {
                resetJobForm();

                setShowCreateJob(
                  (current) => !current
                );
              }
            }}
            style={styles.primaryButton}
          >
            {showCreateJob || editingJobId
              ? "× Close"
              : "+ Create Job"}
          </button>
        </section>

        {/* JOB FORM */}

        {(showCreateJob || editingJobId) && (
          <form
            onSubmit={
              editingJobId
                ? updateJob
                : createJob
            }
            style={styles.form}
          >
            <div style={styles.formHeader}>
              <div>
                <div style={styles.formEyebrow}>
                  {editingJobId
                    ? "EDIT OPPORTUNITY"
                    : "NEW OPPORTUNITY"}
                </div>

                <h2 style={styles.formTitle}>
                  {editingJobId
                    ? "Edit Job"
                    : "Create New Job"}
                </h2>

                <p
                  style={
                    styles.formSubtitle
                  }
                >
                  {editingJobId
                    ? "Update the details candidates should know about this role."
                    : "Add the details candidates should know about this role."}
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Job Title
                </label>

                <input
                  name="title"
                  value={jobForm.title}
                  onChange={handleChange}
                  placeholder="Software Developer"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Location
                </label>

                <input
                  name="location"
                  value={jobForm.location}
                  onChange={handleChange}
                  placeholder="Bangalore"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Salary
                </label>

                <input
                  name="salary"
                  value={jobForm.salary}
                  onChange={handleChange}
                  placeholder="8-12 LPA"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Minimum CGPA
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  name="min_cgpa"
                  value={jobForm.min_cgpa}
                  onChange={handleChange}
                  placeholder="7.50"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Required Branch
                </label>

                <input
                  name="required_branch"
                  value={
                    jobForm.required_branch
                  }
                  onChange={handleChange}
                  placeholder="Computer Science"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Graduation Year
                </label>

                <input
                  type="number"
                  name="graduation_year"
                  value={
                    jobForm.graduation_year
                  }
                  onChange={handleChange}
                  placeholder="2027"
                  style={styles.input}
                />
              </div>

              <div
                style={{
                  ...styles.fieldGroup,
                  gridColumn: "1 / -1",
                }}
              >
                <label style={styles.label}>
                  Required Skills
                </label>

                <input
                  name="required_skills"
                  value={
                    jobForm.required_skills
                  }
                  onChange={handleChange}
                  placeholder="JavaScript, React, Node.js, MySQL"
                  style={styles.input}
                />

                <span style={styles.fieldHint}>
                  Separate multiple skills with
                  commas.
                </span>
              </div>

              <div
                style={{
                  ...styles.fieldGroup,
                  gridColumn: "1 / -1",
                }}
              >
                <label style={styles.label}>
                  Description
                </label>

                <textarea
                  name="description"
                  value={jobForm.description}
                  onChange={handleChange}
                  placeholder="Describe the role, responsibilities, and expectations..."
                  rows={5}
                  style={{
                    ...styles.input,
                    resize: "vertical",
                    minHeight: "120px",
                  }}
                />
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={closeJobForm}
                style={styles.cancelButton}
                disabled={savingJob}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  ...styles.primaryButton,
                  opacity: savingJob
                    ? 0.7
                    : 1,
                  cursor: savingJob
                    ? "not-allowed"
                    : "pointer",
                }}
                disabled={savingJob}
              >
                {savingJob
                  ? editingJobId
                    ? "Saving..."
                    : "Creating..."
                  : editingJobId
                  ? "Save Changes"
                  : "Create Job"}
              </button>
            </div>
          </form>
        )}

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            <span style={styles.errorIcon}>
              !
            </span>

            <div>
              <strong>
                Unable to load jobs
              </strong>

              <p
                style={{
                  margin: "3px 0 0",
                }}
              >
                {error}
              </p>

              <button
                onClick={fetchJobs}
                style={styles.retryButton}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* LOADING / JOBS */}

        {loading ? (
          <div style={styles.messageCard}>
            <div style={styles.loader}>
              ⟳
            </div>

            <h3 style={styles.messageTitle}>
              Loading jobs...
            </h3>

            <p style={styles.messageText}>
              Please wait while we fetch your
              job openings.
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              💼
            </div>

            <h3 style={styles.emptyTitle}>
              No jobs created yet
            </h3>

            <p style={styles.emptyText}>
              Create your first job opening to
              start receiving applications from
              eligible candidates.
            </p>

            <button
              onClick={() => {
                resetJobForm();
                setEditingJobId(null);
                setShowCreateJob(true);
              }}
              style={styles.primaryButton}
            >
              + Create Your First Job
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {jobs.map((job) => {
              const status = String(
                job?.status || "OPEN"
              )
                .trim()
                .toUpperCase();

              const isDeleting =
                deletingJobId === job.id;

              return (
                <div
                  key={job.id}
                  style={styles.card}
                >
                  {/* CARD HEADER */}

                  <div style={styles.cardHeader}>
                    <div style={styles.companyIcon}>
                      {recruiterName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div
                      style={
                        styles.cardHeaderContent
                      }
                    >
                      <div
                        style={styles.companyName}
                      >
                        {user?.company_name ||
                          user?.company ||
                          "CareerConnect Recruiter"}
                      </div>

                      <span
                        style={styles.verified}
                      >
                        ✓ Verified Recruiter
                      </span>
                    </div>

                    <span
                      style={{
                        ...styles.status,
                        ...(status !== "OPEN" &&
                        status !== "ACTIVE"
                          ? styles.closedStatus
                          : {}),
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  {/* JOB TITLE */}

                  <h3 style={styles.jobTitle}>
                    {job.title}
                  </h3>

                  <p style={styles.description}>
                    {job.description ||
                      "No description provided"}
                  </p>

                  {/* META */}

                  <div style={styles.metaGrid}>
                    <div style={styles.metaItem}>
                      <span
                        style={styles.metaLabel}
                      >
                        LOCATION
                      </span>

                      <strong
                        style={styles.metaValue}
                      >
                        📍{" "}
                        {job.location ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span
                        style={styles.metaLabel}
                      >
                        SALARY
                      </span>

                      <strong
                        style={styles.metaValue}
                      >
                        ₹{" "}
                        {job.salary ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span
                        style={styles.metaLabel}
                      >
                        MINIMUM CGPA
                      </span>

                      <strong
                        style={styles.metaValue}
                      >
                        {job.min_cgpa ??
                          "Any"}
                      </strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span
                        style={styles.metaLabel}
                      >
                        BRANCH
                      </span>

                      <strong
                        style={styles.metaValue}
                      >
                        {job.required_branch ||
                          "Any"}
                      </strong>
                    </div>

                    <div style={styles.metaItem}>
                      <span
                        style={styles.metaLabel}
                      >
                        GRADUATION
                      </span>

                      <strong
                        style={styles.metaValue}
                      >
                        {job.graduation_year ||
                          "Any"}
                      </strong>
                    </div>
                  </div>

                  {/* SKILLS */}

                  <div style={styles.skillsSection}>
                    <span
                      style={styles.skillsLabel}
                    >
                      REQUIRED SKILLS
                    </span>

                    <div style={styles.skillsList}>
                      {job.required_skills ? (
                        String(
                          job.required_skills
                        )
                          .split(",")
                          .map(
                            (skill, index) => {
                              const cleanedSkill =
                                skill.trim();

                              if (!cleanedSkill) {
                                return null;
                              }

                              return (
                                <span
                                  key={`${job.id}-skill-${index}`}
                                  style={
                                    styles.skillTag
                                  }
                                >
                                  {cleanedSkill}
                                </span>
                              );
                            }
                          )
                      ) : (
                        <span
                          style={styles.noSkills}
                        >
                          No specific skills
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div style={styles.actions}>
                    <button
                      style={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        goToApplicants(job.id)
                      }
                      disabled={isDeleting}
                    >
                      View Applicants
                      <span>→</span>
                    </button>

                    <button
                      style={
                        styles.primaryOutlineButton
                      }
                      onClick={() =>
                        goToEvaluate(job.id)
                      }
                      disabled={isDeleting}
                    >
                      Evaluate
                      <span>✦</span>
                    </button>

                    <button
                      style={styles.editButton}
                      onClick={() =>
                        openEditJob(job)
                      }
                      disabled={isDeleting}
                    >
                      Edit Job
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() =>
                        deleteJob(job.id)
                      }
                      disabled={isDeleting}
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete Job"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}

      <footer style={styles.footer}>
        <div>
          <strong>CareerConnect</strong>
          <span>
            &nbsp;•&nbsp; Campus Career Platform
          </span>
        </div>

        <span>Recruiter Portal</span>
      </footer>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f8fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e4e7ec",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  headerInner: {
    maxWidth: "1280px",
    margin: "0 auto",
    minHeight: "72px",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  brandLogo: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "800",
    boxShadow:
      "0 4px 10px rgba(37, 99, 235, 0.25)",
  },

  brandName: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#172033",
    lineHeight: 1.2,
  },

  brandSubtitle: {
    marginTop: "3px",
    fontSize: "10px",
    color: "#98a2b3",
    fontWeight: "600",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  userInfo: {
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
    fontSize: "13px",
    fontWeight: "800",
  },

  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    fontSize: "12px",
  },

  logoutButton: {
    background: "#ffffff",
    color: "#344054",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "9px 14px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: "220px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, #172f75 0%, #2452ae 55%, #3166c8 100%)",
    color: "#ffffff",
    padding: "42px 44px",
    display: "flex",
    alignItems: "center",
    boxShadow:
      "0 12px 30px rgba(37, 82, 174, 0.18)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "680px",
  },

  heroBadge: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1.3px",
    marginBottom: "15px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.15,
    letterSpacing: "-1px",
    fontWeight: "800",
    color: "#ffffff",
  },

  heroText: {
    marginTop: "12px",
    maxWidth: "620px",
    color: "rgba(255,255,255,0.78)",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  heroDecoration: {
    position: "absolute",
    right: "-15px",
    top: 0,
    width: "300px",
    height: "100%",
  },

  heroCircleOne: {
    position: "absolute",
    width: "230px",
    height: "230px",
    borderRadius: "50%",
    border:
      "1px solid rgba(255,255,255,0.13)",
    right: "-20px",
    top: "-70px",
  },

  heroCircleTwo: {
    position: "absolute",
    width: "145px",
    height: "145px",
    borderRadius: "50%",
    border:
      "1px solid rgba(255,255,255,0.13)",
    right: "45px",
    top: "-28px",
  },

  heroSpark: {
    position: "absolute",
    right: "92px",
    top: "66px",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background:
      "rgba(255,255,255,0.12)",
    border:
      "1px solid rgba(255,255,255,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "16px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "13px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow:
      "0 2px 8px rgba(16,24,40,0.04)",
  },

  statIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },

  statLabel: {
    display: "block",
    color: "#667085",
    fontSize: "10px",
    fontWeight: "600",
    marginBottom: "2px",
  },

  statValue: {
    display: "block",
    color: "#172033",
    fontSize: "20px",
    fontWeight: "800",
  },

  sectionHeader: {
    marginTop: "32px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  sectionEyebrow: {
    color: "#2563eb",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1.4px",
    marginBottom: "5px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#172033",
    fontWeight: "800",
  },

  sectionSubtitle: {
    marginTop: "4px",
    color: "#667085",
    fontSize: "12px",
  },

  primaryButton: {
    background:
      "linear-gradient(135deg, #2563eb, #315dcc)",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    padding: "11px 17px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow:
      "0 5px 12px rgba(37,99,235,0.18)",
    whiteSpace: "nowrap",
  },

  form: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "22px",
    boxShadow:
      "0 5px 18px rgba(16,24,40,0.06)",
  },

  formHeader: {
    marginBottom: "22px",
  },

  formEyebrow: {
    color: "#2563eb",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1.3px",
    marginBottom: "5px",
  },

  formTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "21px",
    fontWeight: "800",
  },

  formSubtitle: {
    marginTop: "5px",
    color: "#667085",
    fontSize: "12px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "17px",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    color: "#344054",
    fontSize: "11px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "13px",
    outline: "none",
  },

  fieldHint: {
    color: "#98a2b3",
    fontSize: "10px",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "22px",
    paddingTop: "18px",
    borderTop: "1px solid #eef0f3",
  },

  cancelButton: {
    background: "#ffffff",
    color: "#475467",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    padding: "10px 16px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "15px",
    padding: "20px",
    boxShadow:
      "0 3px 12px rgba(16,24,40,0.05)",
    minWidth: 0,
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    marginBottom: "15px",
  },

  companyIcon: {
    width: "35px",
    height: "35px",
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

  cardHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  companyName: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#344054",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  verified: {
    display: "block",
    marginTop: "2px",
    color: "#98a2b3",
    fontSize: "9px",
  },

  status: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#ecfdf3",
    color: "#16803c",
    fontSize: "8px",
    fontWeight: "800",
    letterSpacing: "0.8px",
    flexShrink: 0,
  },

  closedStatus: {
    background: "#fef2f2",
    color: "#b42318",
  },

  jobTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "17px",
    fontWeight: "800",
    lineHeight: 1.3,
  },

  description: {
    marginTop: "7px",
    color: "#667085",
    fontSize: "11px",
    lineHeight: 1.55,
    minHeight: "34px",
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "17px",
    paddingTop: "15px",
    borderTop: "1px solid #eef0f3",
  },

  metaItem: {
    minWidth: 0,
  },

  metaLabel: {
    display: "block",
    color: "#98a2b3",
    fontSize: "8px",
    fontWeight: "800",
    letterSpacing: "0.8px",
    marginBottom: "3px",
  },

  metaValue: {
    display: "block",
    color: "#344054",
    fontSize: "10px",
    fontWeight: "700",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  skillsSection: {
    marginTop: "16px",
    paddingTop: "15px",
    borderTop: "1px solid #eef0f3",
  },

  skillsLabel: {
    display: "block",
    color: "#98a2b3",
    fontSize: "8px",
    fontWeight: "800",
    letterSpacing: "0.8px",
    marginBottom: "8px",
  },

  skillsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
  },

  skillTag: {
    padding: "4px 7px",
    borderRadius: "5px",
    background: "#eef4ff",
    color: "#2454b8",
    fontSize: "9px",
    fontWeight: "700",
  },

  noSkills: {
    color: "#98a2b3",
    fontSize: "10px",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #eef0f3",
  },

  secondaryButton: {
    background: "#ffffff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "9px 8px",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryOutlineButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    padding: "9px 8px",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  editButton: {
    background: "#ffffff",
    color: "#344054",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "9px 8px",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  deleteButton: {
    background: "#ffffff",
    color: "#b42318",
    border: "1px solid #fecdca",
    borderRadius: "8px",
    padding: "9px 8px",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "13px 15px",
    borderRadius: "10px",
    marginBottom: "18px",
    fontSize: "12px",
  },

  errorIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    flexShrink: 0,
  },

  retryButton: {
    marginTop: "8px",
    background: "#ffffff",
    color: "#991b1b",
    border: "1px solid #fca5a5",
    borderRadius: "7px",
    padding: "6px 10px",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  messageCard: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "15px",
    padding: "60px 20px",
    textAlign: "center",
  },

  loader: {
    fontSize: "30px",
    color: "#2563eb",
    marginBottom: "10px",
  },

  messageTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "17px",
  },

  messageText: {
    marginTop: "5px",
    color: "#667085",
    fontSize: "12px",
  },

  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "15px",
    padding: "65px 25px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "55px",
    height: "55px",
    margin: "0 auto 15px",
    borderRadius: "15px",
    background: "#eef4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },

  emptyTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "20px",
    fontWeight: "800",
  },

  emptyText: {
    maxWidth: "500px",
    margin: "7px auto 20px",
    color: "#667085",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  footer: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "28px 24px",
    borderTop: "1px solid #e4e7ec",
    display: "flex",
    justifyContent: "space-between",
    color: "#98a2b3",
    fontSize: "10px",
  },

  center: {
    minHeight: "100vh",
    background: "#f6f8fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },

  loginCard: {
    width: "100%",
    maxWidth: "400px",
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "16px",
    padding: "35px",
    textAlign: "center",
    boxShadow:
      "0 10px 30px rgba(16,24,40,0.08)",
  },

  loginIcon: {
    width: "50px",
    height: "50px",
    margin: "0 auto 15px",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  loginTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "22px",
  },

  loginText: {
    margin: "8px 0 20px",
    color: "#667085",
    fontSize: "12px",
    lineHeight: 1.6,
  },
};

export default RecruiterDashboard;