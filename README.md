# CS 1530 Team15 EduExchange

## Project Overview
EduExchange is a student-to-student marketplace web application for university communities. The platform helps students buy and sell items such as textbooks, electronics, clothing, and dorm essentials in one place.

### Core Features
- Create and manage item listings
- Browse active listings with category, price, and condition filtering
- View detailed listing pages
- Message sellers through an in-app messaging modal
- Save listings to a personal wishlist
- Report suspicious listings
- Authenticate users with Google OAuth 2.0

## How to Install and Run the Application

Choose one of the following paths depending on whether you want to run locally or use the hosted version.

### Option A — Run locally
1. **Get the project files** (choose one):
   - **Clone with Git**
     ```bash
     git clone https://github.com/<your-org>/cs1530-Team15-EduExchange.git
     cd cs1530-Team15-EduExchange
     ```
   - **Download ZIP from GitHub**
     - On the repository page, click **Code → Download ZIP**.
     - Extract the ZIP, then open a terminal in the extracted `cs1530-Team15-EduExchange` folder.

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open the local site**
   ```text
   http://localhost:3000
   ```

### Option B — Use the deployed Render app (no local install needed)
Open the hosted app directly:
```text
https://eduexchange-t548.onrender.com/
```

## Tech Stack Summary
- **Frontend:** HTML, CSS, JavaScript (dynamic UI interactions)
- **Backend:** Node.js with Express.js REST API
- **Authentication:** Google OAuth 2.0 with Passport.js
- **Database:** SQLite (with relational schema and WAL mode)
- **Documentation/Collaboration:** Swagger UI, GitHub, GitHub Pull Requests
- **Deployment:** Render

## Team Members and Contributions
- **Britney Lu** — Set up repository infrastructure and implemented frontend-to-database filtering integration. Documented the final README.
- **Emily Bartell** — Developed major frontend pages and listing/messaging UI interactions.
- **Thomas Jones** — Configured Render deployment and aligned design-goal traceability with implementation choices. Implemented the report listing feature.
- **Senay Yemane** — Designed and implemented Google OAuth 2.0 with Passport.js, including credentials, sessions, and user creation flow.
- **Xiangyu Li** — Built SQLite schema (8 relational tables), implemented listing/filtering backend logic, duplicate prevention, soft-delete support, and wishlist backend/frontend integration.
- **Jack Drabenstadt** — Developed Express backend structure, created API route scaffolding for listings and messaging, integrated SQLite connection layer, and added Swagger UI documentation.

---

## Archive: GitHub Flow (Branching Model)
To maintain a stable codebase and ensure we meet project design goals, all team members follow this workflow:

### 1. The `main` Branch
- The `main` branch represents the **production-ready** state of the system.
- **Strict Rule:** Direct commits to `main` are prohibited. All changes must arrive via a Pull Request.
### 2. Feature Branches
- Create a new branch for every sprint task (for example, `feature/messaging-logic` or `feature/ui-setup`).
- Branch naming convention: `feature/<task-name>` or `bugfix/<issue-name>`.

### 3. Pull Requests (PRs) and Code Review
- Once a task is complete, open a PR to merge your feature branch into `main`.
- **Review Requirement:** At least one other team member must review and approve the PR.
- **Consistency Check:** Reviewers verify that the implementation aligns with the Analysis Object Model (for example, expected class attributes for `Auction`, `Listing`, and `User`).
- **Code Check:** Code must be functional and pass initial integration checks before merging.

### 4. Cleanup
- After a successful merge, delete the merged feature branch to keep the repository clean.