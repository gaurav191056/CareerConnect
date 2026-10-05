const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
    uploadDocument,
    getMyDocuments,
    viewDocument,
    downloadDocument,
    deleteDocument
} = require("../controllers/documentController");

const router = express.Router();


// ===============================
// Upload Document
// ===============================
router.post(
    "/",
    authMiddleware,
    roleMiddleware("STUDENT"),
    upload.single("document"),
    uploadDocument
);


// ===============================
// Get Logged-in Student Documents
// ===============================
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("STUDENT"),
    getMyDocuments
);


// ===============================
// View Own Document
// ===============================
router.get(
    "/view/:documentId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    viewDocument
);


// ===============================
// Download Own Document
// ===============================
router.get(
    "/download/:documentId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    downloadDocument
);


// ===============================
// Delete Own Document
// ===============================
router.delete(
    "/:documentId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    deleteDocument
);


module.exports = router;