export interface LabnexProject {
    id: string;
    name: string;
    description?: string;
}

export interface LabnexProjectDetails extends LabnexProject {
    owner: string;
    isActive: boolean;
    memberCount: number;
    testCaseCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LabnexTaskItem {
    id: string;
    title: string;
    status: string;
    priority: string;
    // createdAt: string;
    // updatedAt: string;
}

export interface LabnexUserTask {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    project: string;
    createdBy: string;
}

export interface LabnexTaskDetails {
    id: string;
    taskReferenceId?: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    project: { 
        id: string; 
        name: string;
        projectCode?: string;
    };
    assignee?: { id: string, name: string };
    reporter?: { id: string, name: string };
}

export interface LabnexNote {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    project?: {
        id: string;
        name: string;
    };
}

export interface LabnexSnippet {
    id: string;
    title: string;
    language: string;
    description?: string;
    code: string;
    createdAt: string;
    project?: {
        id: string;
        name: string;
    };
}

export type TestCaseField = 'project_name' | 'test_case_title' | 'test_case_description' | 'test_case_steps' | 'expected_result' | 'priority' | 'done';

export interface TestCaseInProgress {
    discordUserId: string;
    currentQuestionField: TestCaseField;
    project_name?: string;
    projectName?: string;
    projectId?: string;
    test_case_title?: string;
    test_case_description?: string;
    test_case_steps?: string;
    expected_result?: string;
    priority?: string;
    originalMessage: any; 
    lastBotMessage?: any;
}

export interface LabnexTestCase {
    discordUserId: string;
    projectIdentifier: string;
    title: string;
    description: string;
    steps: string;
    expectedResult: string;
    priority?: string;
}

// Interface for CreateTaskCommand options (already in use, good to have it here)
export interface CreateTaskOptions {
    discordUserId: string;
    projectIdentifier: string;
    title: string;
    description?: string | null;
    priority?: string | null;
    status?: string | null;
    dueDate?: string | null;
}

export type ProjectCreationField = 'projectName' | 'projectCode' | 'projectDescription' | 'done';

export interface ProjectCreationInProgress {
    discordUserId: string;
    currentQuestionField: ProjectCreationField;
    projectName?: string;
    projectCode?: string;
    projectDescription?: string;
    originalMessage: any; // Consider using a more specific Discord.js Message type if possible
    lastBotMessage?: any;  // Consider using a more specific Discord.js Message type if possible
} 