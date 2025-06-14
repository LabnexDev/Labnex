import { REST, Routes, SlashCommandBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file at the root of the backend project
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID; // Ensure this is in your .env file

if (!DISCORD_BOT_TOKEN) {
    console.error('Error: DISCORD_BOT_TOKEN is not set. Cannot deploy commands.');
    process.exit(1);
}
if (!CLIENT_ID) {
    console.error('Error: DISCORD_CLIENT_ID is not set. Cannot deploy commands.');
    process.exit(1);
}

const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Displays the list of available commands.'),
    new SlashCommandBuilder().setName('linkaccount').setDescription('Link your Discord account with your Labnex account.'),
    new SlashCommandBuilder().setName('projects').setDescription('Lists Labnex projects you have access to.'),
    new SlashCommandBuilder().setName('ticket')
        .setDescription('Commands for the ticket system.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new support ticket.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close an active ticket thread.')
                .addStringOption(option => option.setName('reason').setDescription('Reason for closing').setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reply')
                .setDescription('Send a reply in a ticket thread.')
                .addStringOption(option => option.setName('message').setDescription('Your reply message').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('escalate')
                .setDescription('Escalate a ticket to higher-level staff.')
                .addStringOption(option => option.setName('reason').setDescription('Reason for escalating the ticket').setRequired(true))),
    // Basic structure for tasks - can be expanded
    new SlashCommandBuilder().setName('tasks')
        .setDescription('Lists tasks for a specified project.')
        .addStringOption(option =>
            option.setName('project')
                .setDescription('The name or ID of the project')
                .setRequired(false)), // Making it optional to list all tasks or tasks from a default project
    // Add more commands here based on bot-commands.md
    // Example for createtask (can be fleshed out more)
    new SlashCommandBuilder().setName('createtask')
        .setDescription('Creates a new task in the specified project.')
        .addStringOption(option => 
            option.setName('project')
                .setDescription('Project name or ID')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('title')
                .setDescription('Title of the task')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('Detailed description of the task')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('priority')
                .setDescription('Priority of the task')
                .setRequired(false)
                .addChoices(
                    { name: 'Low', value: 'Low' },
                    { name: 'Medium', value: 'Medium' },
                    { name: 'High', value: 'High' }
                ))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Status of the task')
                .setRequired(false)
                .addChoices(
                    { name: 'To Do', value: 'To Do' },
                    { name: 'In Progress', value: 'In Progress' },
                    { name: 'Blocked', value: 'Blocked' },
                    { name: 'In Review', value: 'In Review' },
                    { name: 'Done', value: 'Done' },
                    { name: 'Cancelled', value: 'Cancelled' }
                ))
        .addStringOption(option =>
            option.setName('due_date')
                .setDescription('Due date of the task (YYYY-MM-DD format)')
                .setRequired(false)),
    new SlashCommandBuilder().setName('taskinfo')
        .setDescription('Displays detailed information about a specific task.')
        .addStringOption(option => option.setName('task_identifier').setDescription('The ID or title of the task').setRequired(true)),
    new SlashCommandBuilder().setName('updatetask')
        .setDescription("Updates a task's properties.")
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription("Updates the status of a task.")
                .addStringOption(option => 
                    option.setName('task_identifier')
                        .setDescription('The ID or title of the task to update.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('new_status')
                        .setDescription('The new status for the task.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'To Do', value: 'To Do' },
                            { name: 'In Progress', value: 'In Progress' },
                            { name: 'Blocked', value: 'Blocked' },
                            { name: 'In Review', value: 'In Review' },
                            { name: 'Done', value: 'Done' },
                            { name: 'Cancelled', value: 'Cancelled' }
                        )))
        // Future subcommands like 'assignee', 'priority', etc., can be added here
        // .addSubcommand(subcommand =>
        //     subcommand
        //         .setName('priority')
        //         .setDescription("Updates the priority of a task.")
        //         .addStringOption(option => option.setName('task_identifier').setDescription('The ID or title of the task.').setRequired(true))
        //         .addStringOption(option => option.setName('new_priority').setDescription('The new priority.').setRequired(true).addChoices(...)))
    ,
    new SlashCommandBuilder().setName('addnote')
        .setDescription('Creates a new note.')
        .addStringOption(option => option.setName('title').setDescription('Title of the note').setRequired(true))
        .addStringOption(option => option.setName('body').setDescription('Content of the note').setRequired(true)),
    new SlashCommandBuilder().setName('addsnippet')
        .setDescription('Creates a new code snippet.')
        .addStringOption(option => option.setName('language').setDescription('Programming language of the snippet').setRequired(true))
        .addStringOption(option => option.setName('title').setDescription('Title of the snippet').setRequired(true))
        .addStringOption(option => option.setName('code').setDescription('The code for the snippet').setRequired(true)),
    new SlashCommandBuilder().setName('notes').setDescription('Lists your recent notes.'),
    new SlashCommandBuilder().setName('snippets').setDescription('Lists your recent snippets.'),
    // New Send Embed Command
    new SlashCommandBuilder().setName('sendembed')
        .setDescription('Sends an embedded message to a specified channel. (Admin Only)')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed message.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The main content (description) of the embed message.')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the embed to. Defaults to current channel.')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement) // Allow only text-based channels
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color code for the embed (e.g., #0099ff).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('Footer text for the embed.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Restrict to server administrators at API level
        .setDMPermission(false), // Disable in DMs

    // New Pre-formatted Embed Commands
    new SlashCommandBuilder().setName('sendrules')
        .setDescription('Sends the Labnex server rules embed.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),
    new SlashCommandBuilder().setName('sendinfo')
        .setDescription('Sends the Labnex server information embed.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),
    new SlashCommandBuilder().setName('sendwelcome')
        .setDescription('Sends the Labnex welcome embed for new members.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),
    new SlashCommandBuilder().setName('sendroleselect')
        .setDescription('Posts the role selection embed (Developer / Tester) with emoji reactions.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set.
        // For global commands, use Routes.applicationCommands(CLIENT_ID)
        // For guild-specific commands (good for testing), use Routes.applicationGuildCommands(CLIENT_ID, YOUR_GUILD_ID)
        // Ensure YOUR_GUILD_ID is defined if you use guild-specific commands.
        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID), // Deploy globally
            { body: commands },
        );

        console.log(`Successfully reloaded ${Array.isArray(data) ? data.length : 'unknown number of'} application (/) commands.`);
    } catch (error) {
        console.error('Failed to deploy slash commands:', error);
    }
})(); 