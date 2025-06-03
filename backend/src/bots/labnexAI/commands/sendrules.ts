import { SlashCommandBuilder, PermissionsBitField, CommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sendrules')
  .setDescription('Sends the Labnex server rules embed.')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Correct permission flag
  .setDMPermission(false); // Disable in DMs by default, can be changed if needed

export async function execute(interaction: CommandInteraction<'cached'>) {
    // Optional: Double check administrator permission or specific role, like in sendEmbedCommand.ts
    // const member = interaction.member as GuildMember;
    // if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && !member.roles.cache.some(role => role.name === 'Admin')) {
    //     await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    //     return;
    // }

    const rulesEmbed = new EmbedBuilder()
        .setTitle("📜 Labnex Server Rules")
        .setColor(0x007FFF) // Blue color
        .addFields(
            { name: "1. Be Respectful", value: "No harassment, hate speech, or personal attacks." },
            { name: "2. Stay on Topic", value: "Use the correct channels for your discussions." },
            { name: "3. No Spam or Self-Promo", value: "No flooding or advertising without approval." },
            { name: "4. Constructive Feedback", value: "Be helpful and professional." },
            { name: "5. Respect Privacy", value: "No personal info or unsolicited DMs." },
            { name: "6. Use Threads", value: "Keep discussions clean and organized." },
            { name: "7. Follow Discord's Terms", value: "Violations will result in moderation actions." }
        )
        .setFooter({ text: "Labnex Staff • Stay sharp, stay respectful." });

    try {
        await interaction.reply({ embeds: [rulesEmbed] });
    } catch (error) {
        console.error(`Error executing /sendrules command for ${interaction.user.tag}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error trying to send the rules.', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'There was an error trying to send the rules.', ephemeral: true });
        }
    }
} 