export interface PendingFlow {
  intent: string;
  entities: Record<string, any>;
  askedField?: string;
}

// In-memory map userId -> PendingFlow
const flows = new Map<string, PendingFlow>();

// Required entities for each supported intent.  Keep snake_case keys to
// match what the NLU returns.
const REQUIRED: Record<string, string[]> = {
  MARK_TEST_CASE_STATUS: ['project_id', 'test_case_id', 'new_status'],
  UPDATE_TEST_CASE_PRIORITY: ['project_id', 'test_case_id', 'priority'],
  CREATE_TASK: ['project_id', 'task_title'],
  CREATE_TEST_CASE: ['project_id', 'test_case_title'],
  CREATE_PROJECT: ['project_name', 'project_code'],
};

export function getFlow(userId: string): PendingFlow | undefined {
  return flows.get(userId);
}

export function clearFlow(userId: string): void {
  flows.delete(userId);
}

export function startFlow(userId: string, intent: string, entities: Record<string, any>): PendingFlow {
  const flow: PendingFlow = { intent, entities };
  flows.set(userId, flow);
  return flow;
}

export function updateFlowAnswer(userId: string, field: string, value: any): void {
  const flow = flows.get(userId);
  if (!flow) return;
  flow.entities[field] = value;
  flow.askedField = undefined;
}

export function nextMissingField(flow: PendingFlow): string | undefined {
  const needs = REQUIRED[flow.intent] || [];
  return needs.find((k) => !flow.entities[k]);
} 