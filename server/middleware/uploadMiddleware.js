const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ==========================================
// UPLOAD DIRECTORY
// ==========================================

const uploadDirectory = path.join(
    __dirname,
    "../uploads/student-documents"
);


// Create folder automatically if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}


// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadDirectory);

    },

    filename: (req, file, cb) => {

        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            extension;

        cb(null, uniqueName);

    }

});


// ==========================================
// ALLOWED FILE EXTENSIONS
// ==========================================

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
    ".doc",
    ".docx"
];


// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {

    const extension = path
        .extname(file.originalname)
        .toLowerCase();


    console.log("--------------------------------");
    console.log("UPLOAD FILE");
    console.log("File name:", file.originalname);
    console.log("MIME type:", file.mimetype);
    console.log("Extension:", extension);
    console.log("--------------------------------");


    // Check file extension
    if (allowedExtensions.includes(extension)) {

        return cb(null, true);

    }


    // Reject unsupported file
    return cb(
        new Error(
            "Only JPG, JPEG, PNG, PDF, DOC and DOCX files are allowed"
        ),
        false
    );

};


// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        // Maximum file size = 5 MB
        fileSize: 5 * 1024 * 1024
    }

});


// ==========================================
// EXPORT
// ==========================================

module.exports = upload;