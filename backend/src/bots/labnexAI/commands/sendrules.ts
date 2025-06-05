import { SlashCommandBuilder, PermissionsBitField, CommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sendrules')
  .setDescription('Sends the Labnex server rules embed with ✅ reaction.')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
  .setDMPermission(false);

export async function execute(interaction: CommandInteraction<'cached'>) {
  const rulesEmbed = new EmbedBuilder()
    .setTitle("📜 Labnex Server Rules")
    .setColor(0x007FFF)
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
    const sentMessage = await interaction.channel?.send({ embeds: [rulesEmbed] });

    if (!sentMessage) {
      await interaction.reply({ content: '❌ Failed to send the rules embed.', ephemeral: true });
      return;
    }

    await sentMessage.react('✅');

    console.log(`📜 Rules Message ID: ${sentMessage.id}`);
    await interaction.reply({
      content: `✅ Rules posted successfully.\nMessage ID: \`${sentMessage.id}\`\nCopy this into your .env as \`RULES_MESSAGE_ID\`.`,
      ephemeral: true
    });
  } catch (error) {
    console.error(`Error executing /sendrules command for ${interaction.user.tag}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error sending the rules.', ephemeral: true });
    } else {
      await interaction.followUp({ content: 'There was an error sending the rules.', ephemeral: true });
    }
  }
}
