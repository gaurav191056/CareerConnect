import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const API_URL = "https://careerconnect-api-nxj8.onrender.com";

const parseRepeatableField = (value, blankEntry) => {
    if (!value) return [{ ...blankEntry }];
    if (Array.isArray(value)) return value.length ? value : [{ ...blankEntry }];
    if (typeof value === "object") return [{ ...blankEntry, ...value }];
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.length ? parsed.map((item) => ({ ...blankEntry, ...(typeof item === "string" ? { description: item } : item) })) : [{ ...blankEntry }];
    } catch { /* Older profiles may contain plain text; preserve it below. */ }
    return [{ ...blankEntry, description: String(value) }];
};

const cleanRepeatableEntries = (entries) => entries.filter((entry) => Object.values(entry).some((value) => String(value || "").trim())).map((entry) => Object.fromEntries(Object.entries(entry).map(([key, value]) => [key, String(value || "").trim()])));

const profileInputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "9px", padding: "10px 11px", fontSize: "14px", color: "#0f172a", background: "#fff" };
const profileTextareaStyle = { ...profileInputStyle, resize: "vertical", fontFamily: "inherit" };
const addButtonStyle = { border: "1px solid #2563eb", borderRadius: "9px", padding: "9px 12px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 800, cursor: "pointer" };
const removeButtonStyle = { justifySelf: "start", border: "1px solid #fecaca", borderRadius: "8px", padding: "7px 10px", background: "#fff1f2", color: "#be123c", fontWeight: 700, cursor: "pointer" };

function StudentDashboard() {
    const navigate = useNavigate();

    // ==========================================
    // STATE
    // ==========================================

    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [interviewHistory, setInterviewHistory] = useState([]);
    const [documents, setDocuments] = useState([]);

    // ==========================================
    // STUDENT PROFILE
    // ==========================================

    const emptyStudentProfile = {
        phone: "",
        college: "",
        degree: "",
        branch: "",
        cgpa: "",
        graduation_year: "",
        skills: "",
        projects: [{ name: "", description: "", link: "" }],
        certifications: [{ name: "", issuer: "", link: "" }],
        internships: [{ company: "", role: "", start_date: "", end_date: "", description: "" }],
        resume_url: "",
    };

    const [studentProfile, setStudentProfile] = useState(emptyStudentProfile);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileMessage, setProfileMessage] = useState("");
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileDirty, setProfileDirty] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingApplications, setLoadingApplications] = useState(true);
    const [loadingInterviews, setLoadingInterviews] = useState(true);
    const [loadingInterviewHistory, setLoadingInterviewHistory] =
        useState(true);
    const [loadingDocuments, setLoadingDocuments] = useState(true);

    const [error, setError] = useState("");
    const [applicationError, setApplicationError] = useState("");
    const [interviewError, setInterviewError] = useState("");
    const [interviewHistoryError, setInterviewHistoryError] =
        useState("");
    const [documentError, setDocumentError] = useState("");

    const [applyingJobId, setApplyingJobId] = useState(null);

    const [uploadingDocument, setUploadingDocument] =
        useState(false);

    const [deletingDocumentId, setDeletingDocumentId] =
        useState(null);

    const [viewingDocumentId, setViewingDocumentId] =
        useState(null);

    const [downloadingDocumentId, setDownloadingDocumentId] =
        useState(null);

    const [documentForm, setDocumentForm] = useState({
        document_name: "",
        document_type: "RESUME",
        file: null,
    });

    // ==========================================
    // DASHBOARD CARD / TAB STATE
    // ==========================================

    const [activeDashboardTab, setActiveDashboardTab] =
        useState(null);

    // ==========================================
    // GET USER
    // ==========================================

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const storedUser = sessionStorage.getItem("user");

        if (!token || !storedUser) {
            window.location.href = "/login";
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);

            if (parsedUser.role !== "STUDENT") {
                window.location.href = "/login";
                return;
            }

            setUser(parsedUser);
        } catch (err) {
            console.error("USER PARSE ERROR:", err);

            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");

            window.location.href = "/login";
        }
    }, [navigate]);

    // ==========================================
    // FETCH STUDENT PROFILE
    // ==========================================

    useEffect(() => {
        const fetchStudentProfile = async () => {
            const token = sessionStorage.getItem("token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            try {
                setLoadingProfile(true);
                setProfileError("");

                const response = await fetch(
                    `${API_URL}/api/student/profile`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (response.status === 401) {
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    window.location.href = "/login";
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load student profile"
                    );
                }

                // The API may return the row directly or inside data.profile.
                const profile = data.profile || data;
                const hasProfile = profile && (
                    profile.user_id || profile.phone || profile.college ||
                    profile.degree || profile.branch || profile.skills
                );

                if (hasProfile) {
                    setStudentProfile({
                        ...emptyStudentProfile,
                        ...profile,
                        phone: profile.phone || "",
                        college: profile.college || "",
                        degree: profile.degree || "",
                        branch: profile.branch || "",
                        cgpa: profile.cgpa === null || profile.cgpa === undefined ? "" : String(profile.cgpa),
                        graduation_year: profile.graduation_year === null || profile.graduation_year === undefined ? "" : String(profile.graduation_year),
                        skills: profile.skills || "",
                        projects: parseRepeatableField(profile.projects, { name: "", description: "", link: "" }),
                        certifications: parseRepeatableField(profile.certifications, { name: "", issuer: "", link: "" }),
                        internships: parseRepeatableField(profile.internships, { company: "", role: "", start_date: "", end_date: "", description: "" }),
                        resume_url: profile.resume_url || "",
                    });
                    setProfileSaved(true);
                    setProfileDirty(false);
                    setProfileMessage("Your saved profile has been loaded.");
                } else {
                    setStudentProfile(emptyStudentProfile);
                    setProfileSaved(false);
                    setProfileDirty(false);
                }
            } catch (err) {
                console.error("FETCH STUDENT PROFILE ERROR:", err);
                setProfileError(err.message || "Failed to load student profile");
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchStudentProfile();
    }, []);

    // ==========================================
    // HANDLE PROFILE INPUT
    // ==========================================

    const handleProfileInputChange = (event) => {
        const { name, value } = event.target;
        setStudentProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
        setProfileSaved(false);
        setProfileDirty(true);
        setProfileMessage("");
    };

    const updateRepeatableEntry = (field, index, key, value) => {
        setStudentProfile((previous) => ({
            ...previous,
            [field]: previous[field].map((entry, i) => i === index ? { ...entry, [key]: value } : entry),
        }));
        setProfileSaved(false);
        setProfileDirty(true);
        setProfileMessage("");
    };

    const addRepeatableEntry = (field, blankEntry) => {
        setStudentProfile((previous) => ({ ...previous, [field]: [...previous[field], { ...blankEntry }] }));
        setProfileSaved(false);
        setProfileDirty(true);
    };

    const removeRepeatableEntry = (field, index, blankEntry) => {
        setStudentProfile((previous) => {
            const remaining = previous[field].filter((_, i) => i !== index);
            return { ...previous, [field]: remaining.length ? remaining : [{ ...blankEntry }] };
        });
        setProfileSaved(false);
        setProfileDirty(true);
        setProfileMessage("");
    };

    // ==========================================
    // SAVE STUDENT PROFILE
    // ==========================================

    const saveStudentProfile = async (event, closeAfterSave = true) => {
        event?.preventDefault();

        const token = sessionStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }

        setProfileError("");
        setProfileMessage("");

        const requiredFields = [
            ["phone", "Phone number"],
            ["college", "College / university"],
            ["degree", "Degree"],
            ["branch", "Branch / specialization"],
            ["graduation_year", "Graduation year"],
            ["skills", "Skills"],
        ];

        const missingField = requiredFields.find(([key]) =>
            !String(studentProfile[key] || "").trim()
        );

        if (missingField) {
            setProfileError(`${missingField[1]} is required.`);
            return;
        }

        const graduationYear = Number(studentProfile.graduation_year);
        if (!Number.isInteger(graduationYear) || graduationYear < 2000 || graduationYear > 2100) {
            setProfileError("Please enter a valid graduation year (2000–2100).");
            return;
        }

        if (studentProfile.cgpa !== "") {
            const cgpa = Number(studentProfile.cgpa);
            if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
                setProfileError("CGPA must be between 0 and 10.");
                return;
            }
        }

        if (studentProfile.resume_url.trim()) {
            try {
                const resumeUrl = new URL(studentProfile.resume_url.trim());
                if (!["http:", "https:"].includes(resumeUrl.protocol)) {
                    throw new Error("invalid protocol");
                }
            } catch {
                setProfileError("Please enter a valid resume URL starting with https:// or http://.");
                return;
            }
        }

        try {
            setSavingProfile(true);

            const payload = {
                ...studentProfile,
                phone: studentProfile.phone.trim(),
                college: studentProfile.college.trim(),
                degree: studentProfile.degree.trim(),
                branch: studentProfile.branch.trim(),
                cgpa: studentProfile.cgpa === "" ? null : Number(studentProfile.cgpa),
                graduation_year: graduationYear,
                skills: studentProfile.skills.trim(),
                projects: JSON.stringify(cleanRepeatableEntries(studentProfile.projects)),
                certifications: JSON.stringify(cleanRepeatableEntries(studentProfile.certifications)),
                internships: JSON.stringify(cleanRepeatableEntries(studentProfile.internships)),
                resume_url: studentProfile.resume_url.trim(),
            };

            const response = await fetch(
                `${API_URL}/api/student/profile`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || "Failed to save student profile");
            }

            setProfileSaved(true);
            setProfileDirty(false);
            setProfileMessage(data.message || "Profile saved successfully. You can now apply for jobs.");
            if (closeAfterSave) setProfileOpen(false);
        } catch (err) {
            console.error("SAVE STUDENT PROFILE ERROR:", err);
            setProfileSaved(false);
            setProfileError(err.message || "Failed to save student profile");
        } finally {
            setSavingProfile(false);
        }
    };

    // ==========================================
    // PROFILE TOGGLE
    // ==========================================

    const toggleStudentProfile = async () => {
        if (!profileOpen) {
            setProfileOpen(true);
            window.setTimeout(() => {
                document.getElementById("student-profile")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 50);
            return;
        }

        if (!profileDirty) {
            setProfileOpen(false);
            return;
        }

        const shouldSave = window.confirm(
            "You have unsaved profile changes. Press OK to save and close, or Cancel to continue editing."
        );

        if (shouldSave) {
            await saveStudentProfile({ preventDefault: () => {} }, true);
        }
    };

    // ==========================================
    // OPEN DASHBOARD SECTION
    // ==========================================

    const openDashboardSection = (
        sectionId,
        dashboardTab,
        options = {}
    ) => {
        if (sectionId === "student-profile") setProfileOpen(true);
        setActiveDashboardTab(dashboardTab);

        window.setTimeout(() => {
            const element =
                document.getElementById(sectionId);

            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: options.block || "start",
                });
            }
        }, 50);
    };

    // ==========================================
    // FETCH JOBS
    // ==========================================

    useEffect(() => {
        const fetchJobs = async () => {
            const token = sessionStorage.getItem("token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            try {
                setLoadingJobs(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/jobs`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                console.log("JOBS STATUS:", response.status);
                console.log("JOBS RESPONSE:", data);

                if (response.status === 401) {
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    window.location.href = "/login";
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to fetch jobs"
                    );
                }

                setJobs(data.jobs || []);
            } catch (err) {
                console.error(
                    "FETCH JOBS ERROR:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load jobs"
                );
            } finally {
                setLoadingJobs(false);
            }
        };

        fetchJobs();
    }, [navigate]);

    // ==========================================
    // FETCH MY APPLICATIONS
    // ==========================================

    const fetchApplications = async () => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setLoadingApplications(true);
            setApplicationError("");

            const response = await fetch(
                `${API_URL}/api/applications/my`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(
                "APPLICATIONS STATUS:",
                response.status
            );

            console.log(
                "APPLICATIONS RESPONSE:",
                data
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch applications"
                );
            }

            setApplications(
                data.applications || []
            );
        } catch (err) {
            console.error(
                "FETCH APPLICATIONS ERROR:",
                err
            );

            setApplicationError(
                err.message ||
                    "Failed to load applications"
            );
        } finally {
            setLoadingApplications(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    // ==========================================
    // FETCH MY INTERVIEWS
    // ==========================================

    const fetchInterviews = async () => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setLoadingInterviews(true);
            setInterviewError("");

            const response = await fetch(
                `${API_URL}/api/interviews/my`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(
                "INTERVIEWS STATUS:",
                response.status
            );

            console.log(
                "INTERVIEWS RESPONSE:",
                data
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch interviews"
                );
            }

            setInterviews(
                data.interviews || []
            );
        } catch (err) {
            console.error(
                "FETCH INTERVIEWS ERROR:",
                err
            );

            setInterviewError(
                err.message ||
                    "Failed to load interviews"
            );
        } finally {
            setLoadingInterviews(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    // ==========================================
    // FETCH INTERVIEW HISTORY
    // ==========================================

    const fetchInterviewHistory = async () => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setLoadingInterviewHistory(true);
            setInterviewHistoryError("");

            const response = await fetch(
                `${API_URL}/api/interviews/history`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(
                "INTERVIEW HISTORY STATUS:",
                response.status
            );

            console.log(
                "INTERVIEW HISTORY RESPONSE:",
                data
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch interview history"
                );
            }

            setInterviewHistory(
                data.interviews || []
            );
        } catch (err) {
            console.error(
                "FETCH INTERVIEW HISTORY ERROR:",
                err
            );

            setInterviewHistoryError(
                err.message ||
                    "Failed to load interview history"
            );
        } finally {
            setLoadingInterviewHistory(false);
        }
    };

    useEffect(() => {
        fetchInterviewHistory();
    }, []);

    // ==========================================
    // FETCH MY DOCUMENTS
    // ==========================================

    const fetchDocuments = async () => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setLoadingDocuments(true);
            setDocumentError("");

            const response = await fetch(
                `${API_URL}/api/documents/my`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(
                "DOCUMENTS STATUS:",
                response.status
            );

            console.log(
                "DOCUMENTS RESPONSE:",
                data
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch documents"
                );
            }

            setDocuments(
                data.documents || []
            );
        } catch (err) {
            console.error(
                "FETCH DOCUMENTS ERROR:",
                err
            );

            setDocumentError(
                err.message ||
                    "Failed to load documents"
            );
        } finally {
            setLoadingDocuments(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // ==========================================
    // APPLY FOR JOB
    // ==========================================

    const applyForJob = async (jobId) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        const requiredProfileValues = [
            studentProfile.phone,
            studentProfile.college,
            studentProfile.degree,
            studentProfile.branch,
            studentProfile.graduation_year,
            studentProfile.skills,
        ];

        if (!profileSaved || requiredProfileValues.some((value) => !String(value || "").trim())) {
            alert("Please complete and save your student profile before applying for jobs.");
            openDashboardSection("student-profile", "profile");
            return;
        }

        try {
            setApplyingJobId(jobId);

            const response = await fetch(
                `${API_URL}/api/applications`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        job_id: jobId,
                    }),
                }
            );

            const data = await response.json();

            console.log(
                "APPLY STATUS:",
                response.status
            );

            console.log(
                "APPLY RESPONSE:",
                data
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                alert(
                    data.message ||
                        "Failed to apply for this job"
                );
                return;
            }

            alert(
                data.message ||
                    "Application submitted successfully!"
            );

            await fetchApplications();
        } catch (err) {
            console.error("APPLY ERROR:", err);

            alert(
                err.message ||
                    "Cannot connect to server. Please make sure backend is running."
            );
        } finally {
            setApplyingJobId(null);
        }
    };

    // ==========================================
    // HANDLE DOCUMENT FORM
    // ==========================================

    const handleDocumentInputChange = (event) => {
        const { name, value } = event.target;

        setDocumentForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // HANDLE FILE SELECT
    // ==========================================

    const handleDocumentFileChange = (event) => {
        const file =
            event.target.files?.[0] || null;

        setDocumentForm((previous) => ({
            ...previous,
            file,
        }));

        setDocumentError("");
    };

    // ==========================================
    // FORMAT FILE SIZE
    // ==========================================

    const formatFileSize = (size) => {
        if (
            size === null ||
            size === undefined ||
            Number.isNaN(Number(size))
        ) {
            return "Unknown size";
        }

        const bytes = Number(size);

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(2)} MB`;
    };

    // ==========================================
    // FORMAT DOCUMENT DATE
    // ==========================================

    const formatDocumentDate = (date) => {
        if (!date) {
            return "Not provided";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return String(date);
        }

        return parsedDate.toLocaleDateString(
            "en-GB"
        );
    };

    // ==========================================
    // DOCUMENT TYPE LABEL
    // ==========================================

    const getDocumentTypeLabel = (type) => {
        if (!type) {
            return "Document";
        }

        return String(type)
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    // ==========================================
    // UPLOAD DOCUMENT
    // ==========================================

    const uploadDocument = async (event) => {
        event.preventDefault();

        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        if (!documentForm.document_name.trim()) {
            setDocumentError(
                "Please enter a document name."
            );
            return;
        }

        if (!documentForm.file) {
            setDocumentError(
                "Please select a file."
            );
            return;
        }

        const maximumFileSize =
            5 * 1024 * 1024;

        if (
            documentForm.file.size >
            maximumFileSize
        ) {
            setDocumentError(
                "File size must be 5 MB or less."
            );
            return;
        }

        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".pdf",
            ".doc",
            ".docx",
        ];

        const fileName =
            documentForm.file.name.toLowerCase();

        const hasValidExtension =
            allowedExtensions.some((extension) =>
                fileName.endsWith(extension)
            );

        if (!hasValidExtension) {
            setDocumentError(
                "Only JPG, JPEG, PNG, PDF, DOC and DOCX files are allowed."
            );
            return;
        }

        try {
            setUploadingDocument(true);
            setDocumentError("");

            const formData = new FormData();

            formData.append(
                "document_name",
                documentForm.document_name.trim()
            );

            formData.append(
                "document_type",
                documentForm.document_type
            );

            formData.append(
                "document",
                documentForm.file
            );

            const response = await fetch(
                `${API_URL}/api/documents`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            console.log(
                "UPLOAD DOCUMENT STATUS:",
                response.status
            );

            console.log(
                "UPLOAD DOCUMENT RESPONSE:",
                data
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to upload document"
                );
            }

            setDocumentForm({
                document_name: "",
                document_type: "RESUME",
                file: null,
            });

            const fileInput =
                document.getElementById(
                    "student-document-file"
                );

            if (fileInput) {
                fileInput.value = "";
            }

            alert(
                data.message ||
                    "Document uploaded successfully!"
            );

            await fetchDocuments();
        } catch (err) {
            console.error(
                "UPLOAD DOCUMENT ERROR:",
                err
            );

            setDocumentError(
                err.message ||
                    "Failed to upload document"
            );
        } finally {
            setUploadingDocument(false);
        }
    };

    // ==========================================
    // VIEW DOCUMENT
    // ==========================================

    const viewDocument = async (documentId) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setViewingDocumentId(documentId);
            setDocumentError("");

            const response = await fetch(
                `${API_URL}/api/documents/view/${documentId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                let errorMessage =
                    "Failed to open document";

                try {
                    const data =
                        await response.json();

                    errorMessage =
                        data.message ||
                        errorMessage;
                } catch {
                    // Keep default error message
                }

                throw new Error(errorMessage);
            }

            const blob =
                await response.blob();

            const fileUrl =
                window.URL.createObjectURL(blob);

            window.open(
                fileUrl,
                "_blank",
                "noopener,noreferrer"
            );

            setTimeout(() => {
                window.URL.revokeObjectURL(
                    fileUrl
                );
            }, 60000);
        } catch (err) {
            console.error(
                "VIEW DOCUMENT ERROR:",
                err
            );

            setDocumentError(
                err.message ||
                    "Failed to open document"
            );
        } finally {
            setViewingDocumentId(null);
        }
    };

    // ==========================================
    // DOWNLOAD DOCUMENT
    // ==========================================

    const downloadDocument = async (documentId) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setDownloadingDocumentId(
                documentId
            );

            setDocumentError("");

            const response = await fetch(
                `${API_URL}/api/documents/download/${documentId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                let errorMessage =
                    "Failed to download document";

                try {
                    const data =
                        await response.json();

                    errorMessage =
                        data.message ||
                        errorMessage;
                } catch {
                    // Keep default error message
                }

                throw new Error(errorMessage);
            }

            const blob =
                await response.blob();

            const contentDisposition =
                response.headers.get(
                    "Content-Disposition"
                );

            let fileName =
                "careerconnect-document";

            if (contentDisposition) {
                const fileNameMatch =
                    contentDisposition.match(
                        /filename="([^"]+)"/
                    );

                if (fileNameMatch?.[1]) {
                    fileName =
                        fileNameMatch[1];
                }
            }

            const fileUrl =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = fileUrl;
            link.download = fileName;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(
                fileUrl
            );
        } catch (err) {
            console.error(
                "DOWNLOAD DOCUMENT ERROR:",
                err
            );

            setDocumentError(
                err.message ||
                    "Failed to download document"
            );
        } finally {
            setDownloadingDocumentId(
                null
            );
        }
    };

    // ==========================================
    // DELETE DOCUMENT
    // ==========================================

    const deleteDocument = async (documentId) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this document?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingDocumentId(documentId);
            setDocumentError("");

            const response = await fetch(
                `${API_URL}/api/documents/${documentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(
                "DELETE DOCUMENT STATUS:",
                response.status
            );

            console.log(
                "DELETE DOCUMENT RESPONSE:",
                data
            );

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to delete document"
                );
            }

            setDocuments((previous) =>
                previous.filter(
                    (document) =>
                        Number(document.id) !==
                        Number(documentId)
                )
            );
        } catch (err) {
            console.error(
                "DELETE DOCUMENT ERROR:",
                err
            );

            setDocumentError(
                err.message ||
                    "Failed to delete document"
            );
        } finally {
            setDeletingDocumentId(null);
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        // Ask for confirmation before ending the student session.
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setShowLogoutConfirm(false);
        window.location.href = "/login";
    };

    // ==========================================
    // CHECK IF ALREADY APPLIED
    // ==========================================

    const hasApplied = (jobId) => {
        return applications.some(
            (application) =>
                Number(application.job_id) ===
                Number(jobId)
        );
    };

    // ==========================================
    // APPLICATION STATUS
    // ==========================================

    const getStatusClass = (status) => {
        if (!status) {
            return "status-default";
        }

        switch (status.toUpperCase()) {
            case "SHORTLISTED":
                return "status-shortlisted";

            case "REJECTED":
                return "status-rejected";

            case "SELECTED":
                return "status-selected";

            case "APPLIED":
                return "status-applied";

            default:
                return "status-default";
        }
    };

    // ==========================================
    // INTERVIEW DATE
    // ==========================================

    const formatInterviewDate = (interviewDate) => {
        if (!interviewDate) {
            return "Not provided";
        }

        const dateString =
            String(interviewDate);

        const datePart =
            dateString.split("T")[0];

        const parts =
            datePart.split("-");

        if (parts.length !== 3) {
            return datePart;
        }

        const [year, month, day] =
            parts;

        return `${day}/${month}/${year}`;
    };

    // ==========================================
    // INTERVIEW TIME
    // ==========================================

    const formatInterviewTime = (interviewTime) => {
        if (!interviewTime) {
            return "Not provided";
        }

        return String(
            interviewTime
        ).substring(0, 5);
    };

    // ==========================================
    // INTERVIEW STATUS
    // ==========================================

    const getInterviewStatusClass = (status) => {
        if (!status) {
            return "status-default";
        }

        switch (status.toUpperCase()) {
            case "SCHEDULED":
                return "status-applied";

            case "COMPLETED":
                return "status-selected";

            case "CANCELLED":
                return "status-rejected";

            default:
                return "status-default";
        }
    };

    // ==========================================
    // FORMAT APPLICATION DATE
    // ==========================================

    const formatApplicationDate = (date) => {
        if (!date) {
            return "Not provided";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return String(date);
        }

        return parsedDate.toLocaleDateString(
            "en-GB"
        );
    };

    // ==========================================
    // SKILLS
    // ==========================================

    const getSkills = (skills) => {
        if (!skills) {
            return [];
        }

        return String(skills)
            .split(",")
            .map((skill) =>
                skill.trim()
            )
            .filter(Boolean);
    };

    // ==========================================
    // SHORTLISTED APPLICATIONS
    // ==========================================

    const shortlistedApplications =
        applications.filter(
            (application) =>
                String(
                    application.status || ""
                ).toUpperCase() ===
                "SHORTLISTED"
        );

    const visibleApplications =
        activeDashboardTab ===
        "shortlisted"
            ? shortlistedApplications
            : applications;

    // ==========================================
    // LOADING
    // ==========================================

    if (!user) {
        return (
            <div className="cc-loading-page">
                <div className="cc-loading-card">
                    <div className="cc-spinner"></div>

                    <p>
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="cc-dashboard">

            {/* =====================================
                TOP NAVIGATION
            ====================================== */}

            <header className="cc-header">
                <div className="cc-header-inner">

                    <div className="cc-brand">
                        <div className="cc-brand-icon">
                            CC
                        </div>

                        <div>
                            <div className="cc-brand-name">
                                CareerConnect
                            </div>

                            <div className="cc-brand-subtitle">
                                Campus Career Platform
                            </div>
                        </div>
                    </div>

                    <nav
                        aria-label="Student dashboard navigation"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            flex: "1 1 auto",
                            flexWrap: "wrap",
                            margin: "0 16px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => openDashboardSection("student-documents", "documents")}
                            style={{
                                border: "1px solid #2563eb",
                                borderRadius: "9px",
                                padding: "9px 11px",
                                background: "#2563eb",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Resume Upload
                        </button>
                        {[
                            { label: "My Applications", id: "my-applications", tab: "applications" },
                            { label: "My Interviews", id: "my-interviews", tab: "interviews" },
                            { label: "Interview History", id: "interview-history", tab: "interview-history" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => openDashboardSection(item.id, item.tab)}
                                style={{
                                    border: "1px solid #dbe3ef",
                                    borderRadius: "9px",
                                    padding: "9px 11px",
                                    background: "#fff",
                                    color: "#24324a",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="cc-header-right">

                        <button
                            type="button"
                            onClick={toggleStudentProfile}
                            aria-label={profileOpen ? "Close student profile" : "Open student profile"}
                            title={profileOpen ? "Close student profile" : "Student profile"}
                            style={{
                                width: "42px",
                                height: "42px",
                                minWidth: "42px",
                                borderRadius: "50%",
                                border: "1px solid #cbd5e1",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                fontSize: "20px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            ♙
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="cc-logout-btn"
                        >
                            <span>↪</span>
                            Logout
                        </button>

                    </div>
                </div>
            </header>

            {showLogoutConfirm && (
                <div
                    role="presentation"
                    onClick={() => setShowLogoutConfirm(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        background: "rgba(15, 23, 42, 0.48)",
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-confirm-title"
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "400px",
                            padding: "24px",
                            borderRadius: "16px",
                            background: "#ffffff",
                            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
                            textAlign: "center",
                        }}
                    >
                        <h2 id="logout-confirm-title" style={{ margin: "0 0 10px", color: "#0f172a", fontSize: "21px" }}>
                            Are you sure for logout?
                        </h2>
                        <p style={{ margin: "0 0 22px", color: "#64748b", fontSize: "14px" }}>
                            Do you want to log out of CareerConnect?
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                style={{ border: "none", borderRadius: "9px", padding: "10px 24px", background: "#2563eb", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{ border: "1px solid #cbd5e1", borderRadius: "9px", padding: "10px 24px", background: "#ffffff", color: "#334155", fontWeight: 700, cursor: "pointer" }}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================
                MAIN CONTENT
            ====================================== */}

            <main className="cc-main">

                {/* =================================
                    HERO
                ================================= */}

                <section className="cc-hero">

                    <div>
                        <div className="cc-eyebrow">
                            STUDENT DASHBOARD
                        </div>

                        <h1>
                            Welcome back,{" "}
                            <span>
                                {user.name}
                            </span>{" "}
                            👋
                        </h1>

                        <p>
                            Discover opportunities,
                            track your applications,
                            manage your documents,
                            and stay ready for your
                            next career move.
                        </p>
                    </div>

                    <div className="cc-hero-decoration">
                        <div className="cc-hero-circle circle-one"></div>
                        <div className="cc-hero-circle circle-two"></div>

                        <div className="cc-hero-icon">
                            ✦
                        </div>
                    </div>

                </section>

                {/* =================================
                    STUDENT PROFILE
                ================================= */}
                {profileOpen && (
                <section
                    id="student-profile"
                    className="cc-section cc-dashboard-anchor"
                    style={{
                        background: "#ffffff",
                        border: "1px solid #e5eaf2",
                        borderRadius: "18px",
                        padding: "24px",
                        marginTop: "24px",
                        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
                        <div>
                            <div style={{ color: "#2563eb", fontSize: "12px", fontWeight: 800, letterSpacing: "1.2px", marginBottom: "7px" }}>
                                YOUR CAREER PROFILE
                            </div>
                            <h2 style={{ margin: "0 0 8px", color: "#172033", fontSize: "24px" }}>
                                Student Profile
                            </h2>
                            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                                Add your education and skills so recruiters can understand your background.
                            </p>
                        </div>
                        <span style={{ padding: "7px 12px", borderRadius: "999px", background: profileSaved ? "#dcfce7" : "#fff7ed", color: profileSaved ? "#166534" : "#9a3412", fontSize: "12px", fontWeight: 800 }}>
                            {profileSaved ? "✓ Profile saved" : "Profile incomplete"}
                        </span>
                    </div>

                    {loadingProfile ? (
                        <p style={{ color: "#64748b" }}>Loading your profile…</p>
                    ) : (
                        <form onSubmit={saveStudentProfile}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                                {[
                                    { name: "phone", label: "Phone number *", type: "tel", placeholder: "Your contact number", required: true },
                                    { name: "college", label: "College / university *", type: "text", placeholder: "College name", required: true },
                                    { name: "degree", label: "Degree *", type: "text", placeholder: "e.g. B.Tech, B.Sc, MCA", required: true },
                                    { name: "branch", label: "Branch / specialization *", type: "text", placeholder: "e.g. Computer Science", required: true },
                                    { name: "cgpa", label: "CGPA (out of 10)", type: "number", placeholder: "e.g. 8.5", required: false },
                                    { name: "graduation_year", label: "Graduation year *", type: "number", placeholder: "e.g. 2027", required: true },
                                    { name: "resume_url", label: "Resume URL", type: "url", placeholder: "https://…", required: false },
                                ].map((field) => (
                                    <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "7px", color: "#334155", fontSize: "13px", fontWeight: 700 }}>
                                        {field.label}
                                        <input
                                            name={field.name}
                                            type={field.type}
                                            value={studentProfile[field.name] || ""}
                                            onChange={handleProfileInputChange}
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            min={field.name === "cgpa" ? "0" : field.name === "graduation_year" ? "2000" : undefined}
                                            max={field.name === "cgpa" ? "10" : field.name === "graduation_year" ? "2100" : undefined}
                                            step={field.name === "cgpa" ? "0.01" : undefined}
                                            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "11px 12px", fontSize: "14px", color: "#0f172a", background: "#fff", outlineOffset: "2px" }}
                                        />
                                    </label>
                                ))}

                                <label style={{ display: "flex", flexDirection: "column", gap: "7px", color: "#334155", fontSize: "13px", fontWeight: 700, gridColumn: "1 / -1" }}>
                                    Skills *
                                    <textarea name="skills" value={studentProfile.skills || ""} onChange={handleProfileInputChange} placeholder="e.g. JavaScript, React, SQL" rows={3} required style={{ width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "11px 12px", fontSize: "14px", color: "#0f172a", background: "#fff", resize: "vertical", fontFamily: "inherit" }} />
                                </label>

                                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}>
                                    <h3 style={{ margin: "0 0 12px", color: "#172033" }}>Projects</h3>
                                    {studentProfile.projects.map((entry, index) => (
                                        <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                                            {[{ key: "name", label: "Project Name", placeholder: "e.g. CareerConnect" }, { key: "link", label: "Project Link (optional)", placeholder: "https://…" }].map((f) => <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>{f.label}<input value={entry[f.key] || ""} onChange={(e) => updateRepeatableEntry("projects", index, f.key, e.target.value)} placeholder={f.placeholder} style={profileInputStyle} /></label>)}
                                            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>Description<textarea value={entry.description || ""} onChange={(e) => updateRepeatableEntry("projects", index, "description", e.target.value)} rows={2} placeholder="What did you build or contribute?" style={profileTextareaStyle} /></label>
                                            {studentProfile.projects.length > 1 && <button type="button" onClick={() => removeRepeatableEntry("projects", index, { name: "", description: "", link: "" })} style={removeButtonStyle}>Remove project</button>}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addRepeatableEntry("projects", { name: "", description: "", link: "" })} style={addButtonStyle}>+ Add Another Project</button>
                                </div>

                                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}>
                                    <h3 style={{ margin: "0 0 12px", color: "#172033" }}>Certifications</h3>
                                    {studentProfile.certifications.map((entry, index) => (
                                        <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                                            {[{ key: "name", label: "Certificate Name", placeholder: "e.g. React Basics" }, { key: "issuer", label: "Issuing Organization", placeholder: "e.g. Coursera" }, { key: "link", label: "Certificate Link (optional)", placeholder: "https://…" }].map((f) => <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>{f.label}<input value={entry[f.key] || ""} onChange={(e) => updateRepeatableEntry("certifications", index, f.key, e.target.value)} placeholder={f.placeholder} style={profileInputStyle} /></label>)}
                                            {studentProfile.certifications.length > 1 && <button type="button" onClick={() => removeRepeatableEntry("certifications", index, { name: "", issuer: "", link: "" })} style={removeButtonStyle}>Remove certificate</button>}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addRepeatableEntry("certifications", { name: "", issuer: "", link: "" })} style={addButtonStyle}>+ Add Another Certificate</button>
                                </div>

                                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}>
                                    <h3 style={{ margin: "0 0 12px", color: "#172033" }}>Internships / Experience</h3>
                                    {studentProfile.internships.map((entry, index) => (
                                        <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                                            {[{ key: "company", label: "Company Name", placeholder: "Company name" }, { key: "role", label: "Role / Job Title", placeholder: "e.g. Web Development Intern" }, { key: "start_date", label: "Start Date", placeholder: "MM/YYYY" }, { key: "end_date", label: "End Date", placeholder: "MM/YYYY or Present" }].map((f) => <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>{f.label}<input value={entry[f.key] || ""} onChange={(e) => updateRepeatableEntry("internships", index, f.key, e.target.value)} placeholder={f.placeholder} style={profileInputStyle} /></label>)}
                                            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>Description / Work Done<textarea value={entry.description || ""} onChange={(e) => updateRepeatableEntry("internships", index, "description", e.target.value)} rows={2} placeholder="What did you work on and learn?" style={profileTextareaStyle} /></label>
                                            {studentProfile.internships.length > 1 && <button type="button" onClick={() => removeRepeatableEntry("internships", index, { company: "", role: "", start_date: "", end_date: "", description: "" })} style={removeButtonStyle}>Remove internship</button>}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addRepeatableEntry("internships", { company: "", role: "", start_date: "", end_date: "", description: "" })} style={addButtonStyle}>+ Add Another Internship</button>
                                </div>
                            </div>

                            {profileError && (
                                <div role="alert" style={{ marginTop: "16px", padding: "11px 13px", borderRadius: "10px", background: "#fef2f2", color: "#b91c1c", fontSize: "14px" }}>
                                    {profileError}
                                </div>
                            )}
                            {profileMessage && !profileError && (
                                <div role="status" style={{ marginTop: "16px", padding: "11px 13px", borderRadius: "10px", background: "#f0fdf4", color: "#166534", fontSize: "14px" }}>
                                    {profileMessage}
                                </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    style={{ border: 0, borderRadius: "10px", padding: "12px 18px", background: savingProfile ? "#94a3b8" : "#2563eb", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: savingProfile ? "wait" : "pointer" }}
                                >
                                    {savingProfile ? "Saving profile…" : "Save Student Profile"}
                                </button>
                                <span style={{ color: "#64748b", fontSize: "12px" }}>
                                    * Required fields. Save your profile before applying for jobs.
                                </span>
                            </div>
                        </form>
                    )}
                </section>
                )}

                {/* =================================
                    STATS / CLICKABLE TABS
                ================================= */}

                <section
                    className="cc-stats-grid"
                    aria-label="Dashboard navigation"
                >

                    {/* AVAILABLE JOBS */}

                    <button
                        type="button"
                        className={`cc-stat-card ${
                            activeDashboardTab ===
                            "jobs"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            openDashboardSection(
                                "available-jobs",
                                "jobs"
                            )
                        }
                        aria-label="Open available jobs"
                    >
                        <div className="cc-stat-icon blue">
                            💼
                        </div>

                        <div>
                            <span>
                                Available Jobs
                            </span>

                            <strong>
                                {jobs.length}
                            </strong>

                            <small className="cc-stat-action">
                                View jobs →
                            </small>
                        </div>
                    </button>

                    {/* APPLICATIONS */}

                    <button
                        type="button"
                        className={`cc-stat-card ${
                            activeDashboardTab ===
                            "applications"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            openDashboardSection(
                                "my-applications",
                                "applications"
                            )
                        }
                        aria-label="Open my applications"
                    >
                        <div className="cc-stat-icon purple">
                            📄
                        </div>

                        <div>
                            <span>
                                Applications
                            </span>

                            <strong>
                                {applications.length}
                            </strong>

                            <small className="cc-stat-action">
                                View applications →
                            </small>
                        </div>
                    </button>

                    {/* SHORTLISTED */}

                    <button
                        type="button"
                        className={`cc-stat-card ${
                            activeDashboardTab ===
                            "shortlisted"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            openDashboardSection(
                                "my-applications",
                                "shortlisted"
                            )
                        }
                        aria-label="Open shortlisted applications"
                    >
                        <div className="cc-stat-icon green">
                            🎯
                        </div>

                        <div>
                            <span>
                                Shortlisted
                            </span>

                            <strong>
                                {
                                    shortlistedApplications.length
                                }
                            </strong>

                            <small className="cc-stat-action">
                                View shortlisted →
                            </small>
                        </div>
                    </button>

                    {/* INTERVIEWS */}

                    <button
                        type="button"
                        className={`cc-stat-card ${
                            activeDashboardTab ===
                            "interviews"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            openDashboardSection(
                                "my-interviews",
                                "interviews"
                            )
                        }
                        aria-label="Open my interviews"
                    >
                        <div className="cc-stat-icon orange">
                            📅
                        </div>

                        <div>
                            <span>
                                Interviews
                            </span>

                            <strong>
                                {interviews.length}
                            </strong>

                            <small className="cc-stat-action">
                                View interviews →
                            </small>
                        </div>
                    </button>

                </section>

                {/* =================================
                    AVAILABLE JOBS
                ================================= */}

                <section
                    id="available-jobs"
                    className="cc-section cc-dashboard-anchor"
                >

                    <div className="cc-section-header">

                        <div>
                            <div className="cc-section-label">
                                OPPORTUNITIES
                            </div>

                            <h2>
                                Available Jobs
                            </h2>

                            <p>
                                Find roles that match
                                your skills and career
                                goals.
                            </p>
                        </div>

                        <div className="cc-section-count">
                            {jobs.length}{" "}
                            {jobs.length === 1
                                ? "Job"
                                : "Jobs"}
                        </div>

                    </div>

                    {loadingJobs && (
                        <div className="cc-state-card">
                            <div className="cc-spinner"></div>

                            <p>
                                Loading available jobs...
                            </p>
                        </div>
                    )}

                    {error &&
                        !loadingJobs && (
                            <div className="cc-state-card error">
                                <div className="cc-state-icon">
                                    !
                                </div>

                                <h3>
                                    Unable to load jobs
                                </h3>

                                <p>
                                    {error}
                                </p>
                            </div>
                        )}

                    {!loadingJobs &&
                        !error &&
                        jobs.length === 0 && (
                            <div className="cc-state-card">
                                <div className="cc-state-icon neutral">
                                    💼
                                </div>

                                <h3>
                                    No open jobs
                                </h3>

                                <p>
                                    There are no open
                                    opportunities right now.
                                </p>
                            </div>
                        )}

                    {!loadingJobs &&
                        !error &&
                        jobs.length > 0 && (
                            <div className="cc-jobs-grid">

                                {jobs.map((job) => {
                                    const applied =
                                        hasApplied(
                                            job.id
                                        );

                                    const skills =
                                        getSkills(
                                            job.required_skills
                                        );

                                    return (
                                        <article
                                            className="cc-job-card"
                                            key={job.id}
                                        >

                                            <div className="cc-job-top">

                                                <div className="cc-company-logo">
                                                    {job.recruiter_name
                                                        ? job.recruiter_name
                                                              .charAt(
                                                                  0
                                                              )
                                                              .toUpperCase()
                                                        : "C"}
                                                </div>

                                                <div className="cc-job-company">
                                                    <strong>
                                                        {
                                                            job.recruiter_name
                                                        }
                                                    </strong>

                                                    <span>
                                                        Verified Recruiter
                                                    </span>
                                                </div>

                                            </div>

                                            <div className="cc-job-title-row">

                                                <h3>
                                                    {
                                                        job.title
                                                    }
                                                </h3>

                                                <span className="cc-open-badge">
                                                    OPEN
                                                </span>

                                            </div>

                                            <p className="cc-job-description">
                                                {job.description ||
                                                    "No description provided."}
                                            </p>

                                            <div className="cc-job-meta">

                                                {job.location && (
                                                    <span>
                                                        <b>
                                                            ⌖
                                                        </b>
                                                        {
                                                            job.location
                                                        }
                                                    </span>
                                                )}

                                                {job.salary && (
                                                    <span>
                                                        <b>
                                                            ₹
                                                        </b>
                                                        {
                                                            job.salary
                                                        }
                                                    </span>
                                                )}

                                            </div>

                                            <div className="cc-requirements">

                                                {job.min_cgpa !==
                                                    null &&
                                                    job.min_cgpa !==
                                                        undefined && (
                                                        <div>
                                                            <span>
                                                                Minimum CGPA
                                                            </span>

                                                            <strong>
                                                                {Number(
                                                                    job.min_cgpa
                                                                ).toFixed(
                                                                    2
                                                                )}
                                                            </strong>
                                                        </div>
                                                    )}

                                                {job.required_branch && (
                                                    <div>
                                                        <span>
                                                            Branch
                                                        </span>

                                                        <strong>
                                                            {
                                                                job.required_branch
                                                            }
                                                        </strong>
                                                    </div>
                                                )}

                                                {job.graduation_year && (
                                                    <div>
                                                        <span>
                                                            Graduation
                                                        </span>

                                                        <strong>
                                                            {
                                                                job.graduation_year
                                                            }
                                                        </strong>
                                                    </div>
                                                )}

                                            </div>

                                            {skills.length >
                                                0 && (
                                                <div className="cc-skills">

                                                    <span className="cc-skills-label">
                                                        Required Skills
                                                    </span>

                                                    <div className="cc-skill-list">

                                                        {skills.map(
                                                            (
                                                                skill,
                                                                index
                                                            ) => (
                                                                <span
                                                                    className="cc-skill-pill"
                                                                    key={`${job.id}-${index}`}
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

                                            <div className="cc-job-footer">

                                                {applied ? (
                                                    <button
                                                        type="button"
                                                        className="cc-applied-button"
                                                        disabled
                                                    >
                                                        <span>
                                                            ✓
                                                        </span>

                                                        Application
                                                        Submitted
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="cc-apply-button"
                                                        disabled={
                                                            applyingJobId ===
                                                            job.id
                                                        }
                                                        onClick={() =>
                                                            applyForJob(
                                                                job.id
                                                            )
                                                        }
                                                    >
                                                        {applyingJobId ===
                                                        job.id
                                                            ? "Submitting..."
                                                            : "Apply Now"}

                                                        {applyingJobId !==
                                                            job.id && (
                                                            <span>
                                                                →
                                                            </span>
                                                        )}
                                                    </button>
                                                )}

                                            </div>

                                        </article>
                                    );
                                })}

                            </div>
                        )}

                </section>

                {/* =================================
                    APPLICATIONS
                ================================= */}

                <section
                    id="my-applications"
                    className="cc-section cc-dashboard-anchor"
                >

                    <div className="cc-section-header">

                        <div>
                            <div className="cc-section-label">
                                YOUR ACTIVITY
                            </div>

                            <h2>
                                {activeDashboardTab ===
                                "shortlisted"
                                    ? "Shortlisted Applications"
                                    : "My Applications"}
                            </h2>

                            <p>
                                {activeDashboardTab ===
                                "shortlisted"
                                    ? "Applications that have been shortlisted by recruiters."
                                    : "Track the progress of your submitted applications."}
                            </p>
                        </div>

                        <div className="cc-application-header-actions">

                            {activeDashboardTab ===
                                "shortlisted" && (
                                <button
                                    type="button"
                                    className="cc-show-all-button"
                                    onClick={() =>
                                        setActiveDashboardTab(
                                            "applications"
                                        )
                                    }
                                >
                                    Show All
                                </button>
                            )}

                            <div className="cc-section-count purple-count">
                                {activeDashboardTab ===
                                "shortlisted"
                                    ? shortlistedApplications.length
                                    : applications.length}{" "}
                                {(
                                    activeDashboardTab ===
                                    "shortlisted"
                                        ? shortlistedApplications.length
                                        : applications.length
                                ) === 1
                                    ? "Application"
                                    : "Applications"}
                            </div>

                        </div>

                    </div>

                    {loadingApplications && (
                        <div className="cc-state-card">
                            <div className="cc-spinner"></div>

                            <p>
                                Loading applications...
                            </p>
                        </div>
                    )}

                    {applicationError &&
                        !loadingApplications && (
                            <div className="cc-state-card error">
                                <div className="cc-state-icon">
                                    !
                                </div>

                                <h3>
                                    Unable to load applications
                                </h3>

                                <p>
                                    {applicationError}
                                </p>
                            </div>
                        )}

                    {!loadingApplications &&
                        !applicationError &&
                        visibleApplications.length === 0 && (
                            <div className="cc-state-card">

                                <div className="cc-state-icon neutral">
                                    {activeDashboardTab ===
                                    "shortlisted"
                                        ? "🎯"
                                        : "📄"}
                                </div>

                                <h3>
                                    {activeDashboardTab ===
                                    "shortlisted"
                                        ? "No shortlisted applications"
                                        : "No applications yet"}
                                </h3>

                                <p>
                                    {activeDashboardTab ===
                                    "shortlisted"
                                        ? "No application has been shortlisted yet."
                                        : "Apply to a job above and your application will appear here."}
                                </p>

                            </div>
                        )}

                    {!loadingApplications &&
                        !applicationError &&
                        visibleApplications.length > 0 && (
                            <div className="cc-applications-list">

                                {visibleApplications.map(
                                    (application) => (
                                        <article
                                            className="cc-application-card"
                                            key={
                                                application.application_id
                                            }
                                        >

                                            <div className="cc-application-main">

                                                <div className="cc-application-icon">
                                                    💼
                                                </div>

                                                <div className="cc-application-info">

                                                    <h3>
                                                        {
                                                            application.title
                                                        }
                                                    </h3>

                                                    <p className="cc-application-company">
                                                        {
                                                            application.recruiter_name
                                                        }
                                                    </p>

                                                    <div className="cc-application-meta">

                                                        {application.location && (
                                                            <span>
                                                                ⌖{" "}
                                                                {
                                                                    application.location
                                                                }
                                                            </span>
                                                        )}

                                                        {application.salary && (
                                                            <span>
                                                                ₹{" "}
                                                                {
                                                                    application.salary
                                                                }
                                                            </span>
                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                            <div className="cc-application-right">

                                                <span
                                                    className={`cc-status-badge ${getStatusClass(
                                                        application.status
                                                    )}`}
                                                >
                                                    <span className="cc-status-dot"></span>

                                                    {
                                                        application.status ||
                                                        "APPLIED"
                                                    }
                                                </span>

                                                {application.applied_at && (
                                                    <small>
                                                        Applied{" "}
                                                        {formatApplicationDate(
                                                            application.applied_at
                                                        )}
                                                    </small>
                                                )}

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>
                        )}

                </section>

                {/* =================================
                    DOCUMENTS
                ================================= */}

                <section id="student-documents" className="cc-section cc-documents-section cc-dashboard-anchor">

                    <div className="cc-section-header">

                        <div>
                            <div className="cc-section-label">
                                CAREER DOCUMENTS
                            </div>

                            <h2>
                                My Documents
                            </h2>

                            <p>
                                Upload and manage your
                                resume, certificates,
                                marksheets and other
                                placement documents.
                            </p>
                        </div>

                        <div className="cc-section-count document-count">
                            {documents.length}{" "}
                            {documents.length === 1
                                ? "Document"
                                : "Documents"}
                        </div>

                    </div>

                    {/* UPLOAD FORM */}

                    <div className="cc-document-upload-card">

                        <div className="cc-document-upload-heading">

                            <div className="cc-document-upload-icon">
                                ⬆
                            </div>

                            <div>
                                <h3>
                                    Upload a Document
                                </h3>

                                <p>
                                    Maximum 5 MB. JPG,
                                    JPEG, PNG, PDF, DOC
                                    and DOCX supported.
                                </p>
                            </div>

                        </div>

                        <form
                            className="cc-document-form"
                            onSubmit={
                                uploadDocument
                            }
                        >

                            <div className="cc-document-field">

                                <label htmlFor="document-name">
                                    Document Name
                                </label>

                                <input
                                    id="document-name"
                                    type="text"
                                    name="document_name"
                                    value={
                                        documentForm.document_name
                                    }
                                    onChange={
                                        handleDocumentInputChange
                                    }
                                    placeholder="e.g. Updated Resume"
                                    disabled={
                                        uploadingDocument
                                    }
                                />

                            </div>

                            <div className="cc-document-field">

                                <label htmlFor="document-type">
                                    Document Type
                                </label>

                                <select
                                    id="document-type"
                                    name="document_type"
                                    value={
                                        documentForm.document_type
                                    }
                                    onChange={
                                        handleDocumentInputChange
                                    }
                                    disabled={
                                        uploadingDocument
                                    }
                                >
                                    <option value="RESUME">
                                        Resume
                                    </option>

                                    <option value="CERTIFICATE">
                                        Certificate
                                    </option>

                                    <option value="MARKSHEET">
                                        Marksheet
                                    </option>

                                    <option value="ID_PROOF">
                                        ID Proof
                                    </option>

                                    <option value="OTHER">
                                        Other
                                    </option>
                                </select>

                            </div>

                            <div className="cc-document-field file-field">

                                <label htmlFor="student-document-file">
                                    Select File
                                </label>

                                <input
                                    id="student-document-file"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    onChange={
                                        handleDocumentFileChange
                                    }
                                    disabled={
                                        uploadingDocument
                                    }
                                />

                                {documentForm.file && (
                                    <small className="cc-selected-file">
                                        Selected:{" "}
                                        {
                                            documentForm
                                                .file
                                                .name
                                        }
                                    </small>
                                )}

                            </div>

                            <button
                                type="submit"
                                className="cc-upload-button"
                                disabled={
                                    uploadingDocument
                                }
                            >
                                {uploadingDocument
                                    ? "Uploading..."
                                    : "Upload Document"}

                                {!uploadingDocument && (
                                    <span>
                                        ↑
                                    </span>
                                )}
                            </button>

                        </form>

                        {documentError && (
                            <div className="cc-document-error">
                                <span>!</span>
                                {documentError}
                            </div>
                        )}

                    </div>

                    {/* DOCUMENT LIST */}

                    {loadingDocuments && (
                        <div className="cc-state-card">
                            <div className="cc-spinner"></div>

                            <p>
                                Loading documents...
                            </p>
                        </div>
                    )}

                    {!loadingDocuments &&
                        !documentError &&
                        documents.length === 0 && (
                            <div className="cc-state-card cc-document-empty">

                                <div className="cc-state-icon neutral">
                                    📄
                                </div>

                                <h3>
                                    No documents uploaded
                                </h3>

                                <p>
                                    Upload your resume or
                                    other placement documents
                                    using the form above.
                                </p>

                            </div>
                        )}

                    {!loadingDocuments &&
                        documents.length > 0 && (
                            <div className="cc-documents-list">

                                {documents.map(
                                    (document) => (
                                        <article
                                            className="cc-document-card"
                                            key={
                                                document.id
                                            }
                                        >

                                            <div className="cc-document-main">

                                                <div className="cc-document-file-icon">
                                                    📄
                                                </div>

                                                <div className="cc-document-info">

                                                    <h3>
                                                        {
                                                            document.document_name
                                                        }
                                                    </h3>

                                                    <div className="cc-document-meta">

                                                        <span className="cc-document-type">
                                                            {
                                                                getDocumentTypeLabel(
                                                                    document.document_type
                                                                )
                                                            }
                                                        </span>

                                                        <span>
                                                            {
                                                                document.file_name
                                                            }
                                                        </span>

                                                        <span>
                                                            {
                                                                formatFileSize(
                                                                    document.file_size
                                                                )
                                                            }
                                                        </span>

                                                    </div>

                                                    <small>
                                                        Uploaded{" "}
                                                        {formatDocumentDate(
                                                            document.created_at
                                                        )}
                                                    </small>

                                                </div>

                                            </div>

                                            <div className="cc-document-actions">

                                                <button
                                                    type="button"
                                                    className="cc-view-document-button"
                                                    disabled={
                                                        viewingDocumentId ===
                                                            document.id ||
                                                        downloadingDocumentId ===
                                                            document.id
                                                    }
                                                    onClick={() =>
                                                        viewDocument(
                                                            document.id
                                                        )
                                                    }
                                                >
                                                    {viewingDocumentId ===
                                                    document.id
                                                        ? "Opening..."
                                                        : "View"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cc-download-document-button"
                                                    disabled={
                                                        viewingDocumentId ===
                                                            document.id ||
                                                        downloadingDocumentId ===
                                                            document.id
                                                    }
                                                    onClick={() =>
                                                        downloadDocument(
                                                            document.id
                                                        )
                                                    }
                                                >
                                                    {downloadingDocumentId ===
                                                    document.id
                                                        ? "Downloading..."
                                                        : "Download"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="cc-delete-document-button"
                                                    disabled={
                                                        deletingDocumentId ===
                                                            document.id ||
                                                        viewingDocumentId ===
                                                            document.id ||
                                                        downloadingDocumentId ===
                                                            document.id
                                                    }
                                                    onClick={() =>
                                                        deleteDocument(
                                                            document.id
                                                        )
                                                    }
                                                >
                                                    {deletingDocumentId ===
                                                    document.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>
                        )}

                </section>

                {/* =================================
                    INTERVIEWS
                ================================= */}

                <section
                    id="my-interviews"
                    className="cc-section cc-interview-section cc-dashboard-anchor"
                >

                    <div className="cc-section-header">

                        <div>
                            <div className="cc-section-label">
                                NEXT STEPS
                            </div>

                            <h2>
                                My Interviews
                            </h2>

                            <p>
                                Keep track of your upcoming
                                interview schedule.
                            </p>
                        </div>

                        <div className="cc-section-count orange-count">
                            {interviews.length}{" "}
                            {interviews.length === 1
                                ? "Interview"
                                : "Interviews"}
                        </div>

                    </div>

                    {loadingInterviews && (
                        <div className="cc-state-card">
                            <div className="cc-spinner"></div>

                            <p>
                                Loading interviews...
                            </p>
                        </div>
                    )}

                    {interviewError &&
                        !loadingInterviews && (
                            <div className="cc-state-card error">
                                <div className="cc-state-icon">
                                    !
                                </div>

                                <h3>
                                    Unable to load interviews
                                </h3>

                                <p>
                                    {interviewError}
                                </p>
                            </div>
                        )}

                    {!loadingInterviews &&
                        !interviewError &&
                        interviews.length === 0 && (
                            <div className="cc-state-card">
                                <div className="cc-state-icon neutral">
                                    📅
                                </div>

                                <h3>
                                    No interviews scheduled
                                </h3>

                                <p>
                                    Your scheduled interviews
                                    will appear here.
                                </p>
                            </div>
                        )}

                    {!loadingInterviews &&
                        !interviewError &&
                        interviews.length > 0 && (
                            <div className="cc-interviews-list">

                                {interviews.map(
                                    (interview) => (
                                        <article
                                            className="cc-interview-card"
                                            key={
                                                interview.id
                                            }
                                        >

                                            <div className="cc-interview-date">

                                                <span>
                                                    {
                                                        formatInterviewDate(
                                                            interview.interview_date
                                                        ).split(
                                                            "/"
                                                        )[0]
                                                    }
                                                </span>

                                                <small>
                                                    {formatInterviewDate(
                                                        interview.interview_date
                                                    ).split(
                                                        "/"
                                                    )[1] ||
                                                        ""}
                                                </small>

                                            </div>

                                            <div className="cc-interview-main">

                                                <div className="cc-interview-heading">

                                                    <div>
                                                        <h3>
                                                            {
                                                                interview.job_title
                                                            }
                                                        </h3>

                                                        <p>
                                                            Recruiter:{" "}
                                                            {
                                                                interview.recruiter_name
                                                            }
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`cc-status-badge ${getInterviewStatusClass(
                                                            interview.status
                                                        )}`}
                                                    >
                                                        <span className="cc-status-dot"></span>

                                                        {
                                                            interview.status
                                                        }
                                                    </span>

                                                </div>

                                                <div className="cc-interview-info-grid">

                                                    <div>
                                                        <span>
                                                            DATE
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatInterviewDate(
                                                                    interview.interview_date
                                                                )
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            TIME
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatInterviewTime(
                                                                    interview.interview_time
                                                                )
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            MODE
                                                        </span>

                                                        <strong>
                                                            {
                                                                interview.mode
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                                {interview.mode ===
                                                    "ONLINE" && (
                                                    <div className="cc-interview-action">

                                                        {interview.meeting_link ? (
                                                            <a
                                                                href={
                                                                    interview.meeting_link
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="cc-meeting-button"
                                                            >
                                                                Join Interview
                                                                <span>
                                                                    ↗
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <span className="cc-no-link">
                                                                Meeting link not available
                                                            </span>
                                                        )}

                                                    </div>
                                                )}

                                                {interview.mode ===
                                                    "OFFLINE" && (
                                                    <div className="cc-offline-location">
                                                        <span>
                                                            📍
                                                        </span>

                                                        <div>
                                                            <small>
                                                                INTERVIEW LOCATION
                                                            </small>

                                                            <strong>
                                                                {
                                                                    interview.location ||
                                                                    "Not provided"
                                                                }
                                                            </strong>
                                                        </div>
                                                    </div>
                                                )}

                                                {interview.notes && (
                                                    <div className="cc-interview-notes">
                                                        <strong>
                                                            Interview Notes
                                                        </strong>

                                                        <p>
                                                            {
                                                                interview.notes
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>
                        )}

                </section>

                {/* =================================
                    INTERVIEW HISTORY
                ================================= */}

                <section id="interview-history" className="cc-section cc-interview-history-section cc-dashboard-anchor">

                    <div className="cc-section-header">

                        <div>
                            <div className="cc-section-label">
                                PAST ACTIVITY
                            </div>

                            <h2>
                                Interview History
                            </h2>

                            <p>
                                Review your completed and past interview records.
                            </p>
                        </div>

                        <div className="cc-section-count history-count">
                            {interviewHistory.length}{" "}
                            {interviewHistory.length === 1
                                ? "Interview"
                                : "Interviews"}
                        </div>

                    </div>

                    {loadingInterviewHistory && (
                        <div className="cc-state-card">
                            <div className="cc-spinner"></div>

                            <p>
                                Loading interview history...
                            </p>
                        </div>
                    )}

                    {interviewHistoryError &&
                        !loadingInterviewHistory && (
                            <div className="cc-state-card error">
                                <div className="cc-state-icon">
                                    !
                                </div>

                                <h3>
                                    Unable to load interview history
                                </h3>

                                <p>
                                    {interviewHistoryError}
                                </p>
                            </div>
                        )}

                    {!loadingInterviewHistory &&
                        !interviewHistoryError &&
                        interviewHistory.length === 0 && (
                            <div className="cc-state-card">

                                <div className="cc-state-icon neutral">
                                    🕘
                                </div>

                                <h3>
                                    No interview history
                                </h3>

                                <p>
                                    Past interviews will appear here after their scheduled date and time.
                                </p>

                            </div>
                        )}

                    {!loadingInterviewHistory &&
                        !interviewHistoryError &&
                        interviewHistory.length > 0 && (
                            <div className="cc-interviews-list cc-interview-history-list">

                                {interviewHistory.map(
                                    (interview) => (
                                        <article
                                            className="cc-interview-card cc-interview-history-card"
                                            key={
                                                interview.id
                                            }
                                        >

                                            <div className="cc-interview-date history-date">

                                                <span>
                                                    {
                                                        formatInterviewDate(
                                                            interview.interview_date
                                                        ).split(
                                                            "/"
                                                        )[0]
                                                    }
                                                </span>

                                                <small>
                                                    {formatInterviewDate(
                                                        interview.interview_date
                                                    ).split(
                                                        "/"
                                                    )[1] ||
                                                        ""}
                                                </small>

                                            </div>

                                            <div className="cc-interview-main">

                                                <div className="cc-interview-heading">

                                                    <div>
                                                        <h3>
                                                            {
                                                                interview.job_title
                                                            }
                                                        </h3>

                                                        <p>
                                                            Recruiter:{" "}
                                                            {
                                                                interview.recruiter_name
                                                            }
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`cc-status-badge ${getInterviewStatusClass(
                                                            interview.status
                                                        )}`}
                                                    >
                                                        <span className="cc-status-dot"></span>

                                                        {
                                                            interview.status
                                                        }
                                                    </span>

                                                </div>

                                                <div className="cc-interview-info-grid">

                                                    <div>
                                                        <span>
                                                            DATE
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatInterviewDate(
                                                                    interview.interview_date
                                                                )
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            TIME
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatInterviewTime(
                                                                    interview.interview_time
                                                                )
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            MODE
                                                        </span>

                                                        <strong>
                                                            {
                                                                interview.mode
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                                {interview.mode ===
                                                    "OFFLINE" && (
                                                    <div className="cc-offline-location">
                                                        <span>
                                                            📍
                                                        </span>

                                                        <div>
                                                            <small>
                                                                INTERVIEW LOCATION
                                                            </small>

                                                            <strong>
                                                                {
                                                                    interview.location ||
                                                                    "Not provided"
                                                                }
                                                            </strong>
                                                        </div>
                                                    </div>
                                                )}

                                                {interview.notes && (
                                                    <div className="cc-interview-notes">
                                                        <strong>
                                                            Interview Notes
                                                        </strong>

                                                        <p>
                                                            {
                                                                interview.notes
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>
                        )}

                </section>

            </main>

            {/* =====================================
                FOOTER
            ====================================== */}

            <footer className="cc-footer">

                <div>
                    <strong>
                        CareerConnect
                    </strong>

                    <span>
                        Smart Campus Placement Platform
                    </span>
                </div>

                <span>
                    © 2026 CareerConnect
                </span>

            </footer>

        </div>
    );
}

export default StudentDashboard;