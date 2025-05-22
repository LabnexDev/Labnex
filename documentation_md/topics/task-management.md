## Task Management in Labnex

Effective task management is crucial for project success. Labnex provides a comprehensive suite of tools to create, assign, track, and manage tasks throughout their lifecycle. Tasks are typically managed within the context of a specific project.

### Accessing Tasks

*   **Project-Specific Tasks**: Navigate to a project's details page. You'll usually find a "Tasks" tab or section listing all tasks associated with that project. This is often displayed as a board (Kanban-style) or a list view.
*   **My Tasks Page**: Accessible from the main sidebar, the "My Tasks" page consolidates all tasks assigned to you across all your projects, providing a personal to-do list with filtering and sorting options.

### Creating a New Task

1.  **From a Project's Task Page**:
    *   Navigate to the desired project's tasks section.
    *   Look for a "Create Task", "New Task", or "+" button.
    *   A modal or form will appear to enter task details.
2.  **Task Details**: 
    *   **Title**: A concise and clear summary of the task (e.g., "Implement user login API", "Design homepage mockups"). (Required)
    *   **Description**: (Optional but highly recommended) Detailed information about the task, including requirements, acceptance criteria, relevant links, or steps to reproduce if it's a bug.
    *   **Project**: Usually pre-selected if creating from a project page. If creating from a global "New Task" option, you'll need to select the project.
    *   **Status**: The current state of the task. Common statuses include:
        *   `To Do` (or `Open`, `Pending`)
        *   `In Progress`
        *   `Blocked` (if impediments exist)
        *   `In Review` (or `QA`, `Testing`)
        *   `Done` (or `Completed`, `Closed`)
        *   `Cancelled`
        *(Labnex allows specific statuses, usually defaulting to "To Do".)*
    *   **Priority**: The urgency or importance of the task. Common priorities:
        *   `LOW`
        *   `MEDIUM` (often the default)
        *   `HIGH`
    *   **Assigned To**: (Optional) Select a project member to assign the task to. Unassigned tasks are often visible to the team for pickup or later assignment.
    *   **Due Date**: (Optional) A target completion date for the task.
    *   **Linked Test Cases**: (Optional) Associate existing test cases from the project with this task, useful for QA and bug tracking.
3.  **Save Task**: Click "Create" or "Save".

### Viewing and Editing Tasks

*   **Task Cards/Rows**: Tasks are typically displayed as cards (on a board) or rows (in a list). These summaries usually show the title, status, priority, and assignee.
*   **Task Details View**: Clicking on a task card/row opens a detailed view (often a modal or a separate page) where you can see all its information, including the full description, comments, activity history, and linked items.
*   **Editing**: From the task details view, you can usually edit all fields (title, description, status, priority, assignee, due date, linked test cases) provided you have the necessary permissions.
    *   Changing the **status** is a common action and reflects the task's progress (e.g., moving from "To Do" to "In Progress").

### Key Task Management Features

*   **Filtering**: On task list views (both project-specific and "My Tasks"), you can typically filter tasks by:
    *   Status
    *   Priority
    *   Assigned User
    *   Due Date ranges
    *   (On "My Tasks") Project
*   **Sorting**: Sort tasks by creation date, due date, priority, or title to organize your view.
*   **Task Board (Kanban View)**: If available, this view allows you to drag and drop tasks between columns representing different statuses, providing a visual way to manage workflow.
*   **Linking to Test Cases**: Essential for quality assurance. Tasks (especially bugs or features requiring testing) can be directly linked to test cases. Updating a test case status might even reflect on the linked task.

### "My Tasks" Page

This dedicated page is your personal productivity hub:

*   Lists all tasks assigned to **you** across all projects you're a member of.
*   Offers powerful filtering (by project, status, priority) and sorting options so you can focus on what's most important.
*   Task cards typically provide quick links to the task details or the parent project.

By effectively using Labnex's task management features, you can ensure clarity, accountability, and smooth progress for all your project deliverables. 