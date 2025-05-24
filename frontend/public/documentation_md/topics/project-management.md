## Project Management in Labnex

Labnex provides robust tools for managing your software development projects from inception to completion. This guide covers key aspects of project management within the platform.

### Creating a New Project

1.  **Navigate to Project Creation**:
    *   You can typically find a "Create New Project" button on your Dashboard or on the main "Projects" list page.
    *   Alternatively, the direct path is usually `/projects/new`.

2.  **Enter Project Details**:
    *   **Project Name** (Required): A clear, descriptive name for your project (e.g., "E-commerce Platform Revamp", "Mobile App v2.0").
    *   **Project Code** (Required): A unique code (3-5 alphanumeric characters, e.g., "ECOMR", "APPV2"). This code will be converted to uppercase and **cannot be changed later**.
    *   **Description** (Optional but recommended): A brief overview of the project's goals, scope, or purpose.
    *   *Note: Project Status defaults to "Active" upon creation and is not set at this stage.*

3.  **Confirm Creation**: Click the "Create Project" button.

Your new project will then appear in your project list.

### Viewing Project Details

*   From the Project List page (accessible via "Projects" in the sidebar), click on any project name or its "View Details" button to navigate to its **Project Details** page.
*   This page shows:
    *   **Header**: Project Name and Description. Buttons for "Edit Project" (for Project Owners), "Add Test Case", and "View Tasks".
    *   **Project Overview Card**:
        *   Created Date
        *   Last Updated Date
        *   Project ID (system-generated)
        *   Project Code
        *   Project Owner (Name and Email)
        *   Active Status (displaying "Active" or "Inactive")
    *   **Team Management Section**: Lists current team members and their roles. Project Owners can manage the team from here. (See "Managing Team Members and Assigning Roles" below).
    *   *(Other sections for Tasks, Test Cases, Notes, and Snippets specific to the project may also be present or linked from this page).*

### Editing a Project

1.  Navigate to the **Project Details** page of the project you wish to edit.
2.  If you are the **Project Owner**, click the "Edit Project" button.
3.  On the "Edit Project" page, you can update:
    *   Project Name
    *   Description
4.  The **Project Code** cannot be changed after creation.
5.  The **Project Status** (Active/Inactive) is changed directly on the Project Details page by the Project Owner using a toggle switch, not on the "Edit Project" page.
6.  Save your changes on the "Edit Project" page by clicking "Save Changes".

### Managing TeamMembers and Assigning Roles

Effective collaboration relies on managing team members and their assigned roles within a project. Only **Project Owners** can manage team members and their roles.

1.  **Accessing Team Management**:
    *   On the **Project Details** page, there is a dedicated "Team Members" section.

2.  **Adding Members to the Project**:
    *   The Project Owner can click the "Invite Member" (or similar "Add Member") button.
    *   This opens a modal where you can search for existing Labnex users by their name or email.
    *   Select the user from the search results and choose a role to assign them for this specific project. The default role for new members is typically `TESTER`.
    *   Upon confirmation, the user is added to the project with the assigned role.

3.  **Project Roles and Permissions**:
    Labnex uses a role-based access control (RBAC) system. The available roles and their general permissions are:
    *   **`PROJECT_OWNER`**:
        *   Full control over the project.
        *   Permissions: `MANAGE_PROJECT` (edit details, status), `MANAGE_TEST_CASES`, `EXECUTE_TEST_CASES`, `VIEW_TEST_CASES`, `MANAGE_TEAM` (add/remove members, change roles).
    *   **`TEST_MANAGER`**:
        *   Manages testing efforts.
        *   Permissions: `MANAGE_TEST_CASES`, `EXECUTE_TEST_CASES`, `VIEW_TEST_CASES`, `MANAGE_TEAM`.
    *   **`TESTER`**:
        *   Executes tests and views test information.
        *   Permissions: `EXECUTE_TEST_CASES`, `VIEW_TEST_CASES`.
    *   **`VIEWER`**:
        *   Read-only access to test case information.
        *   Permissions: `VIEW_TEST_CASES`.
    *   *Note: The ability to create/manage tasks, notes, or snippets may be available to members based on their project involvement (e.g., being a `TESTER` or `TEST_MANAGER`) and is subject to backend permission enforcement. Refer to specific sections on Tasks, Notes, and Snippets for more details on their management.*

4.  **Changing Roles / Removing Members**:
    *   In the "Team Members" section, the Project Owner can:
        *   Change an existing member's role (except for another Project Owner, if multiple are allowed by system design).
        *   Remove a member from the project (except for themselves).
    *   These actions usually involve clicking an edit or remove icon next to the team member's name.

### Project Status (Active/Inactive)

*   Projects can be marked as "Active" or "Inactive".
*   **Project Owners** can change the status directly on the **Project Details** page using a toggle switch.
*   Inactive projects might be filtered from default views or have certain actions restricted, helping to keep your workspace focused on current work.

By utilizing these project management features, you can keep your projects organized, your team aligned, and your development process transparent. 