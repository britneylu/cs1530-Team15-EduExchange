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
