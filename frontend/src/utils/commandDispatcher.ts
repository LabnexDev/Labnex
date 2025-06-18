import type { ParsedCommand } from './commandParser';
import { createProject } from '../api/projects';
import { createNote } from '../api/notes';
import { createTask } from '../api/tasks';
import { toast } from 'react-hot-toast';
import { parseCommand } from './commandParser';

export async function dispatchCommand(parsed: ParsedCommand, currentContext: Record<string, any>): Promise<string> {
  const { command, args, flags } = parsed;
  try {
    switch (command) {
      case 'create-project': {
        if (args.length < 1) throw new Error('Project name required');
        const name = args[0];
        const description = (flags['--desc'] as string) || '';
        let projectCode = flags['--code'] as string | undefined;
        if (!projectCode) {
          projectCode = name.slice(0, 10).replace(/\s+/g, '').toUpperCase();
        }
        const project = await createProject({ name, description, projectCode });
        toast.success(`Project created: ${project.name}`);
        return `✔️ Project created: ${project.name}`;
      }
      case 'note': {
        if (args.length < 1) throw new Error('Note content required');
        const content = args.join(' ');
        const projectIdFlag = flags['--project'] as string | undefined;
        const projectId = projectIdFlag || currentContext.projectId;
        const note = await createNote({ content, projectId });
        toast.success('Note saved');
        return `📝 Note saved (id: ${note._id})`;
      }
      case 'new-task': {
        if (args.length < 2) throw new Error('Usage: /new-task <projectId|current> "title"');
        const projectIdArg = args[0];
        const projectId = projectIdArg === 'current' ? currentContext.projectId : projectIdArg;
        if (!projectId) throw new Error('Project context not found.');
        const title = args[1];
        const dueDate = flags['--due'] as string | undefined;
        const assignee = flags['--assignee'] as string | undefined;
        const priority = (flags['--priority'] as string | undefined) || undefined;
        const task = await createTask(projectId, { title, dueDate, assignedTo: assignee, priority: priority as any });
        toast.success('Task created');
        return `✔️ Task created: ${task.title}`;
      }
      case 'summarize': {
        // For now, just return stub; actual AI call will handle soon
        return '🔍 Summary feature coming soon.';
      }
      default:
        return `Unknown command: ${command}`;
    }
  } catch (err: any) {
    toast.error(err.message || 'Command failed');
    return `❌ ${err.message || 'Command failed'}`;
  }
}

export async function dispatchAction(action: { name: string; params: any }, currentContext: Record<string, any>): Promise<string> {
  const { name, params } = action;
  switch (name) {
    case 'createProject': {
      const cmd = `/create-project ${params.name || ''} ${params.description ? '--desc "' + params.description + '"' : ''} ${params.projectCode ? '--code ' + params.projectCode : ''}`;
      const parsed = parseCommand(cmd)!;
      return dispatchCommand(parsed, currentContext);
    }
    case 'createTask': {
      const pid = params.projectId || currentContext.projectId;
      const title = params.title ? `"${params.title}"` : '';
      let cmd = `/new-task ${pid} ${title}`;
      if (params.dueDate) cmd += ` --due ${params.dueDate}`;
      if (params.assignee) cmd += ` --assignee ${params.assignee}`;
      const parsed = parseCommand(cmd)!;
      return dispatchCommand(parsed, currentContext);
    }
    case 'createNote': {
      const content = params.content ? `"${params.content}"` : '""';
      const cmd = `/note ${content}`;
      const parsed = parseCommand(cmd)!;
      return dispatchCommand(parsed, currentContext);
    }
    default:
      return `⚠️ Unrecognized action: ${name}`;
  }
} 