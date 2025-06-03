import { SlashCommandBuilder, PermissionsBitField, CommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sendwelcome')
  .setDescription('Sends the Labnex welcome embed for new members.')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
  .setDMPermission(false);

export async function execute(interaction: CommandInteraction<'cached'>) {
    const welcomeEmbed = new EmbedBuilder()
        .setTitle("👋 Welcome to Labnex!")
        .setColor(0x66CCFF) // Soft blue
        .setDescription("We\'re excited to have you here. Labnex is a space where developers and testers come together to build, test, and improve real-world projects.\n\nHere\'s how to get started:")
        .addFields(
            {
                name: "📜 Read the Rules",
                value: "Please check out `#rules` to understand our community guidelines and expectations."
            },
            {
                name: "🧪 Start Testing or Sharing",
                value: "Head to `#test-requests` to try out apps, or post your own project if you\'re a developer."
            },
            {
                name: "💬 Join the Conversation",
                value: "Say hi in `#general-chat` or share your dev thoughts in `#dev-talk`. We'd love to hear from you!"
            },
            {
                name: "🤖 Need Help?",
                value: "You can ask questions in `#feedback`, or use `/help` to interact with the Labnex AI bot."
            }
        )
        .setFooter({ text: "Welcome to the Labnex community • Let's build something great together" });

    try {
        await interaction.reply({ embeds: [welcomeEmbed] });
    } catch (error) {
        console.error(`Error executing /sendwelcome command for ${interaction.user.tag}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error trying to send the welcome message.', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'There was an error trying to send the welcome message.', ephemeral: true });
        }
    }
} 