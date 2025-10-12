
# FFSD Mid-Review — Test Plan

Project Title: Build & Beyond

Group No: 38

Frontend Framework: HTML + CSS +EJS

Backend: Node.js + Express + MongoDB

Description: This document contains the test plan for the Framework Driven Front-End Development (FFSD) mid-review submission. The tests focus on three areas required by the assignment: form validations (DOM-based), dynamic HTML implementation (dynamic rendering of components/lists/cards), and asynchronous data handling (fetch/axios). Evidence (screenshots) are placed in the `/test_plsn/` folder inside the zip submission.
---

## Test Environment

| Item | Details |
|---|---|
| Browsers | Google Chrome vlatest, Mozilla Firefox latest, Microsoft Edge latest |
| OS | Windows 10/11 |
| Backend | Node.js 14+ (as used in project) with local MongoDB or MongoDB Atlas |
| Tools | Postman (for manual API checks), Chrome DevTools, VS Code |
| Evidence folder | `/test_plan/` (screenshots) |

---

## Test Cases: Form Validation (DOM)

### Test Case 1

| Field | Value |
|---:|---|
| Test Case ID | Test Case 1 |
| Feature | Customer Signup - Empty Fields Validation |
| Test Objective | Verify the customer signup form prevents submission when required inputs are missing and shows helpful messages |
| Test Steps | 1. Open customer signup page. 2. Leave Name and Email empty. 3. Click Submit. |
| Expected Result | Submission blocked; inline errors are shown. Evidence: `test_plan/customer_signup_emptyfields.jpg`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![customer signup empty](test_plan/customer_signup_emptyfields.jpg) |

### Test Case 2

| Field | Value |
|---:|---|
| Test Case ID | Test Case 2 |
| Feature | Customer Signup - Invalid Full Flow |
| Test Objective | Verify customer signup rejects invalid inputs and shows appropriate messages |
| Preconditions | Customer signup page accessible |
| Test Steps | 1. Open customer signup. 2. Enter invalid data (e.g., missing name, invalid email `user@invalid`). 3. Submit. |
| Expected Result | Submission blocked; errors shown. Evidence: `customer_signup_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![customer signup invalid](test_plan/customer_signup_invalid.png) |

### Test Case 3

| Field | Value |
|---:|---|
| Test Case ID | Test Case 3 |
| Feature | Company Signup - Empty Fields Validation |
| Test Objective | Verify the company signup form validates required fields and prevents submission when essential fields are empty |
| Preconditions | Company signup page accessible |
| Test Steps | 1. Open company signup page. 2. Leave required fields (company name, contact person, email) empty. 3. Click Submit. |
| Expected Result | Submission blocked; inline validation messages appear for each empty required field. Evidence: `test_plan/company_signup_emptyfields.jpg`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![company signup empty](test_plan/company_signup_emptyfields.jpg) |

### Test Case 4

| Field | Value |
|---:|---|
| Test Case ID | Test Case 4 |
| Feature | Company Signup - Invalid (full flow) |
| Test Objective | Verify company signup rejects invalid inputs and shows errors (beyond just email) |
| Preconditions | Company signup page accessible |
| Test Steps | 1. Open company signup. 2. Enter invalid or missing fields (e.g., no company name). 3. Submit. |
| Expected Result | Inline validation and/or server response reject submission. Evidence: `company_signup_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![company signup invalid](test_plan/company_signup_invalid.png) |

### Test Case 5

| Field | Value |
|---:|---|
| Test Case ID | Test Case 5 |
| Feature | Worker Signup - Empty Fields Validation |
| Test Objective | Verify worker signup enforces required inputs and shows errors for empty required fields |
| Preconditions | Worker signup page accessible |
| Test Steps | 1. Open worker signup page. 2. Leave required fields empty (name, email, skills). 3. Click Submit. |
| Expected Result | Form submission is prevented; inline errors displayed. Evidence: `test_plan/worker_signup_emptyfields.jpg`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![worker signup empty](test_plan/worker_signup_emptyfields.jpg) |
| Feature | Project Request Form - Numeric and Length Validation (Phone) |
| Test Objective | Verify phone input accepts only numeric characters and enforces length (10 digits) |
| Preconditions | Project request form accessible |
| Test Steps | 1. Open project request form. 2. Enter Phone: `abcd1234` 3. Click Submit. 4. Enter Phone: `987654321` (9 digits) 5. Click Submit. 6. Enter Phone: `9876543210` (10 digits). Click Submit. |
| Expected Result | Non-numeric input rejected; 9-digit input triggers validation error; 10-digit accepted and submission proceeds. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | (none) |

---
### Test Case 6

| Field | Value |
|---:|---|
| Test Case ID | Test Case 6 |
| Feature | Worker Signup - Invalid Full Flow |
| Test Objective | Verify worker signup rejects invalid inputs and shows appropriate messages |
| Preconditions | Worker signup page accessible |
| Test Steps | 1. Populate worker signup with invalid email or missing required fields. 2. Submit. |
| Expected Result | Submission blocked and errors displayed. Evidence: `worker_signup_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![worker signup invalid](test_plan/worker_signup_invalid.png) |

---
### Test Case 7

| Field | Value |
|---:|---|
| Test Case ID | Test Case 7 |
| Feature | Admin Login - Empty Fields Validation |
| Test Objective | Verify the admin login form prevents submission and shows inline errors when required fields are left empty |
| Preconditions | Admin login page accessible at admin signin route |
| Test Steps | 1. Open admin login page. 2. Leave Email and Password fields empty. 3. Click Login. |
| Expected Result | Submission blocked; inline errors appear near Email and Password fields. Evidence: `test_plan/admin_login_empty_fields.jpg`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![admin login empty](test_plan/admin_login_empty_fields.jpg) |

---
### Test Case 8

| Field | Value |
|---:|---|
| Test Case ID | Test Case 8 |
| Feature | Login Form - Password Required and Strength Hint |
| Test Objective | Verify password required validation and (if available) client-side password strength hints |
| Preconditions | Login page accessible at `/signin` or relevant route |
| Test Steps | 1. Open login page. 2. Enter Email: `kadiamyeshwanth@gmail.com`. 3. Leave Password blank. 4. Click Login. |
| Expected Result | Login is blocked; an error near password field appears. If password strength UI exists, test it separately by entering `abc` (weak) and `Test@1234` (strong). |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![signin invalid](test_plan/admin_login_invalid.png) |

### Test Case 9

| Field | Value |
|---:|---|
| Test Case ID | Test Case 9 |
| Feature | Architect Form - Email Format Validation |
| Test Objective | Verify client-side validation rejects invalid email formats |
| Preconditions | Signup page accessible |
| Test Steps | 1. Open signup page. 2. Enter Name: `K Prudhvi` 3. Enter Email: `prudhvi16321` (invalid). 4. Enter Password: `Test@1234`. 5. Click Submit. |
| Expected Result | Inline validation shows "Enter a valid email" and submission is blocked. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![architect email invalid](test_plan/architect_email_invalid.png) |

### Test Case 10

| Field | Value |
|---:|---|
| Test Case ID | Test Case 10 |
| Feature | File Upload Validation in Design Request Form|
| Test Objective | Verify invalid file types or oversized files are rejected client-side or server-side and appropriate message shown |
| Preconditions | Upload form accessible; file to test: invalid type (e.g., `.exe`) or > configured size limit |
| Test Steps | 1. Open upload form on architect profile. 2. Choose `malicious.exe` or very large file. 3. Click Upload. 4. Observe UI and Network tab. |
| Expected Result | Upload prevented/returns 4xx; inline error message shown. Evidence: `architect_file_upload_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![architect file upload invalid](test_plan/architect_file_upload_invalid.png) |

---

### Test Case 11

| Field | Value |
|---:|---|
| Test Case ID | Test Case 11 |
| Feature | Company Bid Submission - Invalid Payload |
| Test Objective | Verify that invalid bid submissions are rejected and appropriate errors are returned/shown |
| Preconditions | Bid submission form accessible; invalid data prepared (missing required field, invalid email) |
| Test Steps | 1. Open bid submission form. 2. Enter invalid data (e.g., missing bid amount). 3. Click Submit. 4. Observe Network tab and UI. |
| Expected Result | POST returns 4xx with error payload; UI displays validation error. Evidence: `company_bid_submission_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![company bid invalid](test_plan/company_bid_submission_invalid.png) |

---

### Test Case 12

| Field | Value |
|---:|---|
| Test Case ID | Test Case 12 |
| Feature | Company Hire Worker - Already Requested |
| Test Objective | Verify company cannot hire a worker when he already sends him an offer request |
| Preconditions | Company hire-worker form accessible |
| Test Steps | 1. Open hire-worker modal/form. 2. Leave required fields empty. 3. Click Hire. 4. Observe UI. |
| Expected Result | Submission blocked and error message shown. Evidence: `company_hire_worker_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![company hire worker invalid](test_plan/company_hire_worker_invalid.png) |

---

### Test Case 13

| Field | Value |
|---:|---|
| Test Case ID | Test Case 13 |
| Feature | Proposal Submit Tooltip / UI Feedback |
| Test Objective | Verify tooltip or contextual help appears when proposal submission is invalid and prevents confusion |
| Preconditions | Proposal submit UI present (company proposals) |
| Test Steps | 1. Trigger proposal submit with invalid data. 2. Observe tooltip/help text. 3. Capture screenshot. |
| Expected Result | Tooltip shown explaining missing fields or next steps. Evidence: `company_proposal_submit_tooltip_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![proposal tooltip invalid](test_plan/company_proposal_submit_tooltip_invalid.png) |

---

### Test Case 14

| Field | Value |
|---:|---|
| Test Case ID | Test Case 14 |
| Feature | Construction Form - Floors Numeric Validation |
| Test Objective | Verify that the "floors" input accepts only numeric values and enforces reasonable bounds |
| Preconditions | Construction request or project form accessible |
| Test Steps | 1. Enter `two` or `-1` into floors field. 2. Submit. 3. Enter `5` and submit. |
| Expected Result | Non-numeric/invalid values rejected; valid numeric accepted. Evidence: `construction_floors_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![construction floors invalid](test_plan/construction_floors_invalid.png) |

---

### Test Case15

| Field | Value |
|---:|---|
| Test Case ID | Test Case15 |
| Feature | Worker-to-Company Association Failure |
| Test Objective | Verify the email and linked url provided by worker|
| Preconditions | Assignment UI accessible; test worker and company exist or mock invalid id |
| Test Steps | 1. Attempt to assign worker to company with invalid data. 2. Observe network response and UI. |
| Expected Result | UI shows error and does not leave stale state. Evidence: `workertocompany_invalid.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![worker to company invalid](test_plan/workertocompany_invalid.png) |

---

## Test Cases: Async Data Handling (fetch / axios)

Note: Use the same sample data as above where applicable. Tests cover data submission (POST), retrieval (GET), and deletion (DELETE). Ensure backend server and DB are reachable for integration testing.

### Test Case - 1

| Field | Value |
|---:|---|
| Test Case ID | TC-AD-001 |
| Feature | Create Project (POST) |
| Test Objective | Verify client sends POST request and UI updates after successful response |
| Preconditions | API endpoint POST `/api/projects` available; user authenticated if required |
| Test Steps | 1. Open Add Project form. 2. Enter Title: `Async Create Test` 3. Customer Email: `prudhvi16321@gmail.com` 4. Phone: `9876543210` 5. Submit form. 6. Inspect Network tab for POST; confirm 201/200 response; confirm UI shows new project. |
| Expected Result | POST request returns success (200/201) with project payload; UI updates to include created project. Screenshot saved to `/network_evidence/TC-AD-001_post_success.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | ![post success placeholder](test_plan/company_bid_submission_valid.png) |

### Test Case - 2

| Field | Value |
|---:|---|
| Test Case ID | TC-AD-002 |
| Feature | Retrieve Projects (GET) |
| Test Objective | Verify GET request returns a list and the front-end renders it correctly |
| Preconditions | API endpoint GET `/api/projects` available and returns data |
| Test Steps | 1. Open Projects page. 2. Open Network tab. 3. Trigger list load/refresh. 4. Observe GET request and response payload. |
| Expected Result | GET returns 200 with JSON array; UI renders each item as a card/list row. Save response screenshot `/network_evidence/TC-AD-002_get_list.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | (none) |

### Test Case - 3

| Field | Value |
|---:|---|
| Test Case ID | TC-AD-003 |
| Feature | Delete Project (DELETE) |
| Test Objective | Verify client sends DELETE request and the UI removes the item without full refresh |
| Preconditions | At least one project exists; endpoint DELETE `/api/projects/:id` available |
| Test Steps | 1. Open Projects list. 2. Note a project's id or click Delete on a project card. 3. Confirm deletion in UI (if confirmation modal). 4. Observe Network tab for DELETE request and response code. |
| Expected Result | DELETE returns 200/204 and UI removes card dynamically. Save screenshot `/network_evidence/TC-AD-003_delete_success.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | (none) |

### Test Case - 4

| Field | Value |
|---:|---|
| Test Case ID | TC-AD-004 |
| Feature | Error Handling for Failed Requests |
| Test Objective | Verify UI shows error state when fetch/axios returns 4xx/5xx or network failure |
| Preconditions | Simulate server error (e.g., stop backend or mock 500) |
| Test Steps | 1. Stop backend or force endpoint to return 500. 2. Trigger GET or POST. 3. Observe UI error message and console/logs. |
| Expected Result | UI displays a user-friendly error message and doesn't crash; retry option visible if implemented. Screenshot to `/network_evidence/TC-AD-004_error.png`. |
| Actual Result | (to be filled) |
| Status | Pass |
| Evidence | (none) |

---

## Evidence

Evidence screenshots are in test_plan

---