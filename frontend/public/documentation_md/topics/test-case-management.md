## Test Case Management in Labnex

Quality Assurance (QA) is a vital part of the software development lifecycle. Labnex provides dedicated features for creating, organizing, executing, and tracking test cases, helping ensure your projects meet quality standards.

### Accessing Test Cases

*   Test cases are managed within a specific **project**.
*   From the Project Details page, navigate to the project's "Test Cases" list page (usually via a "Test Cases" link or button).
*   This page lists all test cases for that project, with options to search, filter (by status), and sort (by title, date, priority, status).

### Creating a New Test Case

1.  **Navigate to Project Test Cases**: Go to the Test Case list page of the relevant project.
2.  **Initiate Creation**: Click the "Add New Test Case" or similar button.
3.  **Enter Test Case Details** on the creation page:
    *   **Title** (Required): A clear, unique (within the project) title for the test case.
    *   **Description** (Optional): An overview of the test case objective.
    *   **Steps** (Required): A list of actions to perform. Each step description is required, and at least one step must be provided.
    *   **Expected Result** (Required): What the outcome should be if the test case passes.
    *   **Priority** (Required): The importance of this test case (`LOW`, `MEDIUM`, `HIGH`). Defaults to `MEDIUM`.
    *   *Note: Status is not set at creation; it defaults to `PENDING` on the backend. Test cases are not assigned to a specific tester during creation via the form.*

4.  **Save Test Case**: Click "Create Test Case".

### Viewing and Editing Test Cases

*   **Test Case List**: Displays test cases (often as cards) with key information like title, status, and priority.
*   **Test Case Details Page**: Clicking a test case from the list opens its dedicated details page. This page shows all information: title, description, steps, expected result, current status, priority, creator, and creation/update dates. If assigned, the assignee is also displayed.
*   **Editing**: From the Test Case Details page, click the "Edit" button to navigate to the Edit Test Case page. Here you can update the title, description, steps, expected result, and priority.
    *   *Note: Status is updated directly on the Test Case Details page (see "Executing Test Cases"). Assignee cannot be changed via the edit form at this time.*

### Executing Test Cases and Recording Results

1.  **Open Test Case**: Navigate to the Test Case Details page.
2.  **Perform Steps**: Manually follow the documented test steps.
3.  **Update Status**: Based on the outcome, click the appropriate button on the Test Case Details page to set the status:
    *   **Mark as PASSED**: If the actual result matches the expected result.
    *   **Mark as FAILED**: If the actual result does not match the expected result.
    *   **Mark as PENDING**: To revert or set the test case to a pending state.
    *   *There is no separate field to record detailed "Actual Results" or add execution comments/attachments directly through this interface.*

### Key Test Case Management Features

*   **Filtering and Sorting**: On the Test Case list page, filter test cases by status or search query. Sort by title, creation date, last update date, priority, or status.
*   **Traceability**: While tasks can be linked to test cases, test cases currently do not have a direct feature to link to tasks (e.g., for bug tracking originating from a failed test case). The `taskReferenceId` on a test case is an internal identifier.
*   *(Features like detailed execution history per test run or batch updates are not standard at this time.)*

Robust test case management helps identify issues early, track software quality, and ensure that your application meets user expectations and requirements. 