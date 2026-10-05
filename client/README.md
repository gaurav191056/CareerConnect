CareerConnect

CareerConnect is a full-stack campus placement management platform that connects students with recruiters and provides a centralized system for job opportunities, applications, candidate evaluation, shortlisting, interviews, and student document management.


1. Project Overview

CareerConnect is designed to simplify the campus recruitment process by providing separate workflows for:

- Students
- Recruiters

Students can discover suitable job opportunities, apply for jobs, manage their documents, track applications, view shortlisted status, and access scheduled interviews.

Recruiters can create and manage job openings, review applicants, evaluate candidates, shortlist candidates, and schedule interviews.


2. Main Objectives

The main objectives of CareerConnect are:

 Provide a centralized campus placement platform.
 Allow students to discover and apply for job opportunities.
 Allow recruiters to create and manage job openings.
 Provide candidate evaluation and shortlisting functionality.
 Provide interview scheduling and tracking.
 Allow students to upload and manage important documents.
 Protect role-specific functionality using authentication and authorization.
 Prevent users from accessing resources belonging to other users.



3. Technology Stack

 Frontend

 React
 Vite
 JavaScript
 HTML
 CSS

 Backend

 Node.js
 Express.js
 JavaScript

 Database

 MySQL

 Authentication

 JWT-based authentication
 Role-based authorization

 Development Tools

 Visual Studio Code
 Postman
 Git
 npm


4. Project Structure

    CareerConnect/
    │
    ├── client/
    │   ├── src/
    │   ├── public/
    │   ├── package.json
    │   └── vite.config.js
    │
    ├── server/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── routes/
    │   ├── uploads/
    │   ├── app.js
    │   ├── server.js
    │   └── package.json
    │
    ├── database/
    │
    ├── docs/
    │
    └── README.md


5. User Roles

CareerConnect currently supports two primary roles.

 Student

Students can:

 Login
 View available jobs
 Apply for jobs
 View their applications
 View shortlisted applications
 Upload documents
 View documents
 Download documents
 Delete documents
 View scheduled interviews
 Join online interviews

 Recruiter

Recruiters can:

 Login
 Create jobs
 View their jobs
 Edit jobs
 Delete jobs
 View applicants
 Evaluate applicants
 Automatically shortlist candidates
 View shortlisted candidates
 Schedule interviews



6. Student Workflow

The student workflow is:

    Student Login
         ↓
    Student Dashboard
         ↓
    View Available Jobs
         ↓
    Apply for Job
         ↓
    Track Application
         ↓
    Candidate Evaluation
         ↓
    Shortlisted
         ↓
    Interview Scheduled
         ↓
    View Interview
         ↓
    Join Interview

Students can also manage their placement-related documents through the Documents section.



7. Recruiter Workflow

The recruiter workflow is:

    Recruiter Login
         ↓
    Recruiter Dashboard
         ↓
    Create Job
         ↓
    Manage Job
         ↓
    View Applicants
         ↓
    Evaluate Applicants
         ↓
    Auto Shortlist
         ↓
    View Shortlisted Candidates
         ↓
    Schedule Interview



8. Job Management

Recruiters can create job openings with information such as:

 Job title
 Description
 Location
 Salary
 Minimum CGPA
 Required branch
 Required skills
 Graduation year

Recruiters can also:

 View their jobs
 Edit existing jobs
 Delete jobs

Students can view open job opportunities and apply for suitable positions.


9. Application Management

Students can apply for available jobs.

The application system maintains the relationship between:

 Student
 Job
 Recruiter

Students can view their submitted applications and application status.

Recruiters can view applicants for their job openings.


10. Candidate Evaluation

Recruiters can evaluate candidates based on job requirements.

The evaluation system considers candidate eligibility and matching information such as:

 CGPA
 Branch
 Graduation year
 Skills

The system provides an evaluation score and matched skills information.

Recruiters can also use automatic shortlisting functionality with a configurable candidate limit.


11. Shortlisting

Recruiters can view candidates who have been shortlisted for their job openings.

Students can view their application status from the Student Dashboard.

Example application statuses include:

    APPLIED
    SHORTLISTED


12. Interview Management

Recruiters can schedule interviews for candidates.

Interview information can include:

 Interview date
 Interview time
 Interview mode
 Meeting link
 Location
 Notes

Supported interview modes include:

    ONLINE
    OFFLINE

Students can view their scheduled interviews from the Student Dashboard.

For online interviews, students can use the provided meeting link.


13. Document Management

Students can manage placement-related documents.

Supported operations include:

 Upload document
 View document
 Download document
 Delete document

Documents are associated with the authenticated student.

The backend verifies document ownership before allowing access.


14. Authentication and Authorization

CareerConnect uses JWT-based authentication.

After login, the authenticated user receives a token that is used for protected API requests.

Protected functionality uses role-based authorization.

Example:

    STUDENT
        ↓
    Student-only APIs

    RECRUITER
        ↓
    Recruiter-only APIs

A user cannot access APIs that belong to another role.


15. Security

The application includes role-based access control and resource ownership checks.

Security testing performed during development included:

 Role Protection

A student attempting to access recruiter-only job APIs was denied.

A recruiter attempting to access the student application API was denied.

 Document Ownership

A student attempting to access another student's document was denied for:

 View
 Download
 Delete

Expected response:

    {
      "message": "Document not found"
    }

This prevents unauthorized access to another student's documents.

16. Important API Endpoints

 Authentication

    POST /api/auth/login
    POST /api/auth/register

 Jobs

    POST   /api/jobs
    GET    /api/jobs
    GET    /api/jobs/recruiter
    PUT    /api/jobs/:jobId
    DELETE /api/jobs/:jobId

 Applications

    POST /api/applications
    GET  /api/applications/my
    GET  /api/applications/job/:jobId/applicants
    GET  /api/applications/job/:jobId/evaluate
    POST /api/applications/job/:jobId/auto-shortlist
    GET  /api/applications/job/:jobId/shortlisted

 Interviews

    POST /api/interviews
    GET  /api/interviews/job/:jobId
    GET  /api/interviews/my

 Documents

    POST   /api/documents
    GET    /api/documents/my
    GET    /api/documents/view/:documentId
    GET    /api/documents/download/:documentId
    DELETE /api/documents/:documentId



17. Backend API Health Check

The backend provides a basic health endpoint:

    GET /

Expected response:

    {
      "message": "CareerConnect API is running 🚀"
    }

This endpoint was tested successfully.



18. Running the Project

 Step 1 — Open the project

    cd /Users/gaurav/Desktop/CareerConnect

 Step 2 — Install frontend dependencies

    cd client
    npm install

 Step 3 — Install backend dependencies

Open another terminal:

    cd /Users/gaurav/Desktop/CareerConnect/server
    npm install

 Step 4 — Start the backend

    cd /Users/gaurav/Desktop/CareerConnect/server
    npm run dev

The backend runs on:

    http://localhost:5001

 Step 5 — Start the frontend

Open another terminal:

    cd /Users/gaurav/Desktop/CareerConnect/client
    npm run dev

The frontend normally runs on:

    http://localhost:5173



 19. Testing

Testing was performed using:

 Browser-based frontend testing
 Postman API testing
 Student account testing
 Recruiter account testing
 Role-based authorization testing
 Cross-user document access testing

 Tested Student Features

 Login
 Dashboard
 Job listing
 Applications
 Shortlisted applications
 Document upload
 Document view
 Document download
 Document delete
 Interview listing
 Online interview access

 Tested Recruiter Features

 Login
 Dashboard
 Job creation
 Job editing
 Job deletion
 Applicant listing
 Candidate evaluation
 Automatic shortlisting
Shortlisted candidates
 Interview scheduling

 Security Tests

 Student accessing recruiter-only endpoint → Blocked
Recruiter accessing student-only endpoint → Blocked
 Cross-user document view → Blocked
 Cross-user document download → Blocked
 Cross-user document delete → Blocked

 API Health

    GET /

Result:

    PASS



 20. Current Testing Status

| Module | Status |
| Authentication | PASS |
| Student Dashboard | PASS |
| Recruiter Dashboard | PASS |
| Job Management | PASS |
| Applications | PASS |
| Candidate Evaluation | PASS |
| Auto Shortlisting | PASS |
| Shortlisted Candidates | PASS |
| Interview Management | PASS |
| Document Management | PASS |
| Role-based Authorization | PASS |
| Document Ownership Protection | PASS |
| API Health Check | PASS |



21. Future Enhancements

Possible future improvements include:

 Placement administrator role
 Admin dashboard
 Advanced recruitment analytics
 Email notifications
 In-app notifications
 Password reset
 Profile completion improvements
 Resume parsing
 Advanced candidate ranking
 Audit logging
 Production-grade cloud file storage
 Production deployment
 Automated test suites
 Improved responsive design
 Accessibility improvements


22. Project Status

The current CareerConnect implementation has completed its core functional development and manual end-to-end testing.

 Current Status

    Core Functionality     → COMPLETE
    Student Module         → TESTED
    Recruiter Module       → TESTED
    Application Workflow   → TESTED
    Interview Workflow     → TESTED
    Document Management    → TESTED
    Security Checks        → PASSED
    API Health Check       → PASSED

The next development phase is focused on final UI/UX polish, documentation refinement, and production-readiness improvements.



23. Conclusion

CareerConnect provides a centralized platform for managing campus recruitment activities.

The implemented system supports the complete core workflow from job creation and student applications to candidate evaluation, shortlisting, interview scheduling, and document management.

Role-based authorization and document ownership checks provide protection for restricted functionality and student resources.

The core application has been manually tested across both Student and Recruiter workflows and the tested functionality is currently working as expected.

---

 Author

CareerConnect — Smart Campus Placement Management System

© 2026 CareerConnect