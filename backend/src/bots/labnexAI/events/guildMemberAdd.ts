import {
  Events,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  GuildMember,
  TextChannel,
  ChannelType
} from 'discord.js';

// Named export for the handler function
export async function handleGuildMemberAddEvent(member: GuildMember) {
  // Try to find the welcome channel by name
  const welcomeChannel = member.guild.channels.cache.find(
    (ch) => ch.name === 'welcome' && ch.type === ChannelType.GuildText
  ) as TextChannel | undefined; // Ensure it's a TextChannel

  if (!welcomeChannel) {
    console.log(`[guildMemberAdd.ts] 'welcome' channel not found in guild ${member.guild.name}. Cannot send welcome message.`);
    return;
  }

  const welcomeEmbed = new EmbedBuilder()
    .setTitle(`👋 Welcome to Labnex, ${member.user.username}!`)
    .setDescription(
      "We're excited to have you here.\n\nLabnex connects **developers** and **testers** to collaborate on real-world projects.\n\nPlease choose your role to get started:"
    )
    .setColor(0x66CCFF) // Soft blue, as per your example
    .setThumbnail(member.user.displayAvatarURL()) // Add user's avatar for a personal touch
    .setFooter({ text: "You can change your role later by messaging Labnex AI" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('assign_tester')
      .setLabel("🧪 I'm a Tester")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('assign_developer')
      .setLabel("💻 I'm a Developer")
      .setStyle(ButtonStyle.Success)
  );

  try {
    await welcomeChannel.send({
      content: `Hey <@${member.id}>, great to have you with us!`, // Personalized ping
      embeds: [welcomeEmbed],
      components: [row]
    });
    console.log(`[guildMemberAdd.ts] Sent welcome message to ${member.user.tag} in #${welcomeChannel.name} on guild ${member.guild.name}.`);
  } catch (error) {
    console.error(`[guildMemberAdd.ts] Failed to send welcome message to ${member.user.tag} in guild ${member.guild.name}:`, error);
  }
} 