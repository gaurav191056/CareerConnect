const pool = require("../config/db");
const fs = require("fs");
const path = require("path");


// ===============================
// Upload Document
// ===============================
const uploadDocument = async (req, res) => {
    try {
        const studentId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file"
            });
        }

        const {
            document_name,
            document_type
        } = req.body;

        if (!document_name || !document_type) {
            // Delete uploaded file if form data is missing
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                message: "Document name and document type are required"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO student_documents
            (
                student_id,
                document_name,
                document_type,
                file_name,
                file_path,
                mime_type,
                file_size
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId,
                document_name,
                document_type,
                req.file.originalname,
                req.file.filename,
                req.file.mimetype,
                req.file.size
            ]
        );

        res.status(201).json({
            message: "Document uploaded successfully",
            documentId: result.insertId,
            fileName: req.file.originalname
        });

    } catch (error) {
        console.error("UPLOAD DOCUMENT ERROR:", error);

        // Delete file if database operation failed
        if (
            req.file &&
            fs.existsSync(req.file.path)
        ) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// Get My Documents
// ===============================
const getMyDocuments = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [documents] = await pool.execute(
            `SELECT
                id,
                document_name,
                document_type,
                file_name,
                mime_type,
                file_size,
                created_at
             FROM student_documents
             WHERE student_id = ?
             ORDER BY created_at DESC`,
            [studentId]
        );

        res.json({
            totalDocuments: documents.length,
            documents
        });

    } catch (error) {
        console.error("GET DOCUMENTS ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// View Document
// ===============================
const viewDocument = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { documentId } = req.params;

        const [documents] = await pool.execute(
            `SELECT
                file_path,
                file_name,
                mime_type
             FROM student_documents
             WHERE id = ? AND student_id = ?`,
            [
                documentId,
                studentId
            ]
        );

        if (documents.length === 0) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        const document = documents[0];

        // Use only the stored filename.
        // This prevents unexpected path traversal.
        const safeFileName = path.basename(
            document.file_path
        );

        const filePath = path.join(
            __dirname,
            "../uploads/student-documents",
            safeFileName
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "Document file not found"
            });
        }

        // Allow browser to display supported files
        res.setHeader(
            "Content-Type",
            document.mime_type ||
            "application/octet-stream"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${document.file_name}"`
        );

        res.sendFile(
            filePath,
            (error) => {
                if (error) {
                    console.error(
                        "SEND DOCUMENT FILE ERROR:",
                        error
                    );

                    if (!res.headersSent) {
                        res.status(500).json({
                            message:
                                "Failed to open document"
                        });
                    }
                }
            }
        );

    } catch (error) {
        console.error(
            "VIEW DOCUMENT ERROR:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// Download Document
// ===============================
const downloadDocument = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { documentId } = req.params;

        const [documents] = await pool.execute(
            `SELECT
                file_path,
                file_name
             FROM student_documents
             WHERE id = ? AND student_id = ?`,
            [
                documentId,
                studentId
            ]
        );

        if (documents.length === 0) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        const document = documents[0];

        const safeFileName = path.basename(
            document.file_path
        );

        const filePath = path.join(
            __dirname,
            "../uploads/student-documents",
            safeFileName
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "Document file not found"
            });
        }

        res.download(
            filePath,
            document.file_name,
            (error) => {
                if (error) {
                    console.error(
                        "DOWNLOAD DOCUMENT ERROR:",
                        error
                    );

                    if (!res.headersSent) {
                        res.status(500).json({
                            message:
                                "Failed to download document"
                        });
                    }
                }
            }
        );

    } catch (error) {
        console.error(
            "DOWNLOAD DOCUMENT ERROR:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// Delete Document
// ===============================
const deleteDocument = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { documentId } = req.params;

        const [documents] = await pool.execute(
            `SELECT file_path
             FROM student_documents
             WHERE id = ? AND student_id = ?`,
            [
                documentId,
                studentId
            ]
        );

        if (documents.length === 0) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        const safeFileName = path.basename(
            documents[0].file_path
        );

        const filePath = path.join(
            __dirname,
            "../uploads/student-documents",
            safeFileName
        );

        // Delete physical file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete database record
        await pool.execute(
            `DELETE FROM student_documents
             WHERE id = ? AND student_id = ?`,
            [
                documentId,
                studentId
            ]
        );

        res.json({
            message: "Document deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE DOCUMENT ERROR:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    uploadDocument,
    getMyDocuments,
    viewDocument,
    downloadDocument,
    deleteDocument
};