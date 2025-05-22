## Test Case Management in Labnex

Quality Assurance (QA) is a vital part of the software development lifecycle. Labnex provides dedicated features for creating, organizing, executing, and tracking test cases, helping ensure your projects meet quality standards.

### Accessing Test Cases

*   Test cases are managed within a specific **project**.
*   Navigate to the Project Details page, and you will find a "Test Cases" tab or section.
*   This section typically lists all test cases for that project, often with options to filter by status, priority, or other criteria.

### Creating a New Test Case

1.  **Navigate to Project Test Cases**: Go to the test case section of the relevant project.
2.  **Initiate Creation**: Look for a "Create Test Case", "New Test Case", or "+" button.
3.  **Enter Test Case Details**:
    *   **Title**: A clear, unique (within the project) title for the test case (e.g., "Verify user login with valid credentials", "Test password recovery flow"). (Required)
    *   **Description**: (Optional but recommended) An overview of the test case objective or the feature it covers.
    *   **Preconditions**: (Optional) Any conditions that must be met before this test case can be executed (e.g., "User account exists", "System is in X state").
    *   **Steps**: A numbered or bulleted list of actions to perform to execute the test. Each step should be clear and concise. (Required, and must contain at least one step)
    *   **Expected Result**: What the outcome should be if the test case passes. (Required)
    *   **Priority**: (Optional) The importance of this test case (e.g., `LOW`, `MEDIUM`, `HIGH`). Defaults usually to `MEDIUM`.
    *   **Status**: (Optional, for initial creation) The initial status of the test case (e.g., `Pending`, `To Be Executed`). Often defaults to `Pending`.
    *   **Assigned To Tester**: (Optional) You might be able to assign the test case to a specific project member for execution.
    *   **Linked Tasks**: (Optional) Link this test case to relevant tasks (e.g., a bug task that this test case verifies, or a feature task that this test case tests).
4.  **Save Test Case**: Click "Create" or "Save".

### Viewing and Editing Test Cases

*   **Test Case List**: Displays test cases with key information like title, status, priority, and last updated date.
*   **Test Case Details View**: Clicking a test case opens its full details, including all fields, steps, expected results, actual results (once executed), comments, and history.
*   **Editing**: You can typically edit all aspects of a test case from its details view, provided you have the permissions.

### Executing Test Cases and Recording Results

1.  **Open Test Case**: Navigate to the details view of the test case you want to execute.
2.  **Perform Steps**: Follow the documented steps carefully.
3.  **Record Actual Result**: In the test case details, there will be a section to record the actual outcome of your test execution.
4.  **Update Status**: Based on the outcome, update the test case status:
    *   **Pass**: If the actual result matches the expected result.
    *   **Fail**: If the actual result does not match the expected result.
    *   **Blocked**: If the test cannot be completed due to an external issue.
    *   *(Other statuses like `In Progress` or `Skipped` might be available.)*
5.  **Add Comments/Attachments**: (Optional) Provide additional notes, screenshots, or log files to support the result, especially for failed tests.
6.  **Save Execution**: Save the updated status and results.

### Key Test Case Management Features

*   **Filtering and Sorting**: Filter test cases by status, priority, assignee, etc. Sort by title, creation date, or last update.
*   **Test Execution History**: View a log of when a test case was executed, by whom, and its result over time.
*   **Linking to Tasks**: Crucial for traceability. If a test case fails, it can be easily linked to a new or existing bug task. When a feature task is completed, linked test cases can be run to verify it.
*   **Batch Updates**: Some systems might allow updating the status of multiple test cases at once.

Robust test case management helps identify issues early, track software quality, and ensure that your application meets user expectations and requirements. 