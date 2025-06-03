import { SlashCommandBuilder, PermissionsBitField, CommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sendinfo')
  .setDescription('Sends the Labnex server information embed.')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
  .setDMPermission(false);

export async function execute(interaction: CommandInteraction<'cached'>) {
    const infoEmbed = new EmbedBuilder()
        .setTitle("ℹ️ Welcome to Labnex")
        .setColor(0x007FFF) // Blue color
        .setDescription("Labnex is a collaborative platform where developers can share their apps, and testers can provide valuable feedback to improve them.\n\nHere's how to get started:")
        .addFields(
            {
                name: "🧪 For Testers",
                value: "• Check `#test-requests` for apps needing feedback\n• Post issues or suggestions in `#test-reports`\n• Be constructive and clear in your reports"
            },
            {
                name: "💻 For Developers",
                value: "• Share your projects in `#test-requests`\n• Review feedback from testers in `#test-reports`\n• Collaborate in `#dev-talk`"
            },
            {
                name: "🎯 Server Navigation",
                value: "• `#announcements` – Stay updated\n• `#rules` – Know what's expected\n• `#general-chat` – Meet the community"
            },
            {
                name: "🤖 About Labnex AI",
                value: "Labnex AI is your assistant for test automation, command handling, and server intelligence. Use `/help` or mention the bot to get started."
            }
        )
        .setFooter({ text: "Labnex – Powered by Collaboration • Built by Developers, for Developers" });

    try {
        await interaction.reply({ embeds: [infoEmbed] });
    } catch (error) {
        console.error(`Error executing /sendinfo command for ${interaction.user.tag}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error trying to send the server info.', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'There was an error trying to send the server info.', ephemeral: true });
        }
    }
} 