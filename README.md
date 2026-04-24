# CS 1530 Team15 EduExchange

## Branching Model: GitHub Flow

To maintain a stable codebase and ensure we meet our design goals, all team members must adhere to the following workflow:

### 1. The `main` Branch
* The `main` branch represents the **production-ready** state of the system.
* **Strict Rule:** Direct commits to `main` are prohibited. All changes must arrive via a Pull Request.

### 2. Feature Branches
* Create a new branch for every task assigned in the Sprint Backlog (e.g., `feature/auction-logic` or `feature/ui-navbar`).
* Branch naming convention: `feature/<task-name>` or `bugfix/<issue-name>`.

### 3. Pull Requests (PRs) & Code Review
* Once a task is complete, open a PR to merge your feature branch into `main`.
* **Review Requirement:** At least one other team member must review and approve the PR.
* **Consistency Check:** Reviewers must verify that the implementation aligns with the **Analysis Object Model** (e.g., proper class attributes for `Auction`, `Listing`, and `User`).
* **Code Check:** Code must be functional and pass all initial integration tests before merging.

### 4. Cleanup
* After a successful merge, the feature branch should be deleted to maintain a clean repository structure.

---

## Project Overview and Purpose

EduExchange is a student marketplace web application designed to allow university students to buy and sell items such as textbooks, electronics, clothing, and other essentials.

The platform allows users to:
- Create listings for items they want to sell
- Browse available listings
- Apply filters (category, price, condition)
- View listing details
- Message sellers through a chat modal
- Save listings to a personal wishlist

The goal of this project is to build a full-stack application using a REST API, a database-backed backend, and a dynamic frontend UI.

---

## Setup/Installation Instructions

### 1. Clone the repository
```bash
git clone https://github.com/<your-org>/cs1530-Team15-EduExchange.git
cd cs1530-Team15-EduExchange
```
---

## Team
### 
Britney Lu: Set up infrastructure for the GitHub repository. Implemented the filtering feature by connecting the frontend UI to the SQLite database. 

Emily Bartell: Developed the frontend UI for main pages of EduExchange, including listing interaction and messaging interface.

Thomas Jones: Configured Render deployment for web accessibility. Updated design goals traceability to align technology choices with system requirements.

Senay Yemane: Designed and implemented Google OAuth 2.0 authentication using Passport.js, including credential setup, session handling, and user creation flow.

Xiangyu Li: Implemented SQLite database schema with 8 relational tables, enforced constraints, and enabled WAL mode. Built backend listing routes with filtering (FR3), duplicate prevention (FR12), and soft-delete support. Implemented the wishlist/save listing feature (FR10) with full backend API routes and frontend Save button and wishlist modal.

Jack Drabenstadt: Developed Express.js backend structure, created API route scaffolding for listings and messaging, integrated SQLite connection layer, and added Swagger UI documentation.
