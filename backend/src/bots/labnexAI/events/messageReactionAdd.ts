import { MessageReaction, PartialMessageReaction, User, PartialUser } from 'discord.js';

export async function handleMessageReactionAddEvent(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  if (user.bot) return;

  const roleMessageId = process.env.ROLE_ASSIGN_MESSAGE_ID;
  if (!roleMessageId) {
    console.warn('[messageReactionAdd.ts] ROLE_ASSIGN_MESSAGE_ID not set');
    return;
  }

  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.id !== roleMessageId) return;
    const guild = reaction.message.guild;
    if (!guild) return;
    const member = await guild.members.fetch(user.id);
    const emoji = reaction.emoji.name;

    if (emoji === '🔽') {
      const devRole = guild.roles.cache.find(r => r.name === 'Developer');
      if (devRole) await member.roles.add(devRole);
    } else if (emoji === '🧪') {
      const testerRole = guild.roles.cache.find(r => r.name === 'Tester');
      if (testerRole) await member.roles.add(testerRole);
    }
  } catch (err) {
    console.error(`\u274C Failed to assign Developer/Tester role to ${user.tag}:`, err);
  }
}
