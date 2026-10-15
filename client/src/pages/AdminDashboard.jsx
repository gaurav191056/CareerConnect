import { useEffect, useState } from "react";

const API_BASE_URL = "https://careerconnect-api-nxj8.onrender.com/api";

function AdminDashboard() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLoginHistory = async () => {
            try {
                const token = sessionStorage.getItem("token");

                const response = await fetch(
                    `${API_BASE_URL}/admin/login-history`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to fetch login history"
                    );
                }

                setHistory(data.history || []);
            } catch (err) {
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchLoginHistory();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.replace("/login");
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>CareerConnect Admin</h1>
                    <p style={styles.subtitle}>
                        Admin Dashboard
                    </p>
                </div>

                <button onClick={handleLogout} style={styles.button}>
                    Logout
                </button>
            </header>

            <section style={styles.card}>
                <h2>Admin Login History</h2>
                <p style={styles.subtitle}>
                    Recent admin login activity
                </p>

                {loading && <p>Loading login history...</p>}

                {!loading && error && (
                    <p style={styles.error}>{error}</p>
                )}

                {!loading && !error && history.length === 0 && (
                    <p>No login history found.</p>
                )}

                {!loading && !error && history.length > 0 && (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.cell}>Email</th>
                                    <th style={styles.cell}>Login Method</th>
                                    <th style={styles.cell}>Logged In At</th>
                                </tr>
                            </thead>

                            <tbody>
                                {history.map((item, index) => (
                                    <tr key={`${item.email}-${item.logged_in_at}-${index}`}>
                                        <td style={styles.cell}>{item.email}</td>
                                        <td style={styles.cell}>{item.login_method}</td>
                                        <td style={styles.cell}>
                                            {item.logged_in_at
                                                ? new Date(
                                                      item.logged_in_at
                                                  ).toLocaleString()
                                                : "N/A"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "28px",
    },
    title: {
        margin: 0,
        color: "#172554",
    },
    subtitle: {
        color: "#64748b",
    },
    card: {
        background: "#ffffff",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        overflow: "hidden",
    },
    button: {
        background: "#1d4ed8",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 18px",
        cursor: "pointer",
    },
    tableWrapper: {
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left",
    },
    cell: {
        padding: "12px",
        borderBottom: "1px solid #e2e8f0",
        whiteSpace: "nowrap",
    },
    error: {
        color: "#b91c1c",
    },
};

export default AdminDashboard;
