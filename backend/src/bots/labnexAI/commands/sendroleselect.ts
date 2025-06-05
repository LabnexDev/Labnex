import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  PermissionsBitField
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('sendroleselect')
  .setDescription('Posts the role selection embed (Developer / Tester) with emoji reactions.')
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
  .setDMPermission(false);

export async function execute(interaction: CommandInteraction<'cached'>) {
  const roleEmbed = new EmbedBuilder()
    .setTitle("🎭 Choose Your Role")
    .setColor(0x00BFFF)
    .setDescription(
      "Welcome to the Labnex closed beta!\n\n" +
      "React to this message to choose your role:\n\n" +
      "🔽 **Developer** — building and submitting projects\n" +
      "🧪 **Tester** — helping test and report bugs\n\n" +
      "👉 You may choose one or both!"
    )
    .setFooter({ text: "Your role helps us match you with the right tools and channels." });

  try {
    const sentMessage = await interaction.channel?.send({ embeds: [roleEmbed] });

    if (!sentMessage) {
      await interaction.reply({ content: "❌ Failed to send role selector message.", ephemeral: true });
      return;
    }

    await sentMessage.react('🔽');
    await sentMessage.react('🧪');

    console.log(`🆔 Role Selection Message ID: ${sentMessage.id}`);
    await interaction.reply({
      content: `✅ Role selector posted successfully in <#${sentMessage.channel.id}>.\nMessage ID: \`${sentMessage.id}\`\n\nAdd this to your .env as \`ROLE_ASSIGN_MESSAGE_ID\`.`,
      ephemeral: true
    });
  } catch (error) {
    console.error(`❌ Error executing /sendroleselect:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error posting the role selector.', ephemeral: true });
    } else {
      await interaction.followUp({ content: 'There was an error posting the role selector.', ephemeral: true });
    }
  }
}
