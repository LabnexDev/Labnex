import {
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser
} from 'discord.js';

export async function handleMessageReactionAddEvent(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  if (user.bot) return;

  const roleMessageId = process.env.ROLE_ASSIGN_MESSAGE_ID;
  const rulesMessageId = process.env.RULES_MESSAGE_ID;

  if (!roleMessageId && !rulesMessageId) {
    console.warn('[handleMessageReactionAddEvent] ROLE_ASSIGN_MESSAGE_ID or RULES_MESSAGE_ID not set.');
    return;
  }

  try {
    if (reaction.partial) await reaction.fetch();
    const { message } = reaction;
    const guild = message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id);
    const emoji = reaction.emoji.name;

    // ✅ Rules Acceptance → Promote to Member
    if (rulesMessageId && message.id === rulesMessageId && emoji === '✅') {
      const memberRole = guild.roles.cache.find(r => r.name === 'Member');
      const waitlistRole = guild.roles.cache.find(r => r.name === 'Waitlist');

      if (memberRole) await member.roles.add(memberRole);
      if (waitlistRole) await member.roles.remove(waitlistRole);

      console.log(`🎉 ${user.tag} accepted the rules and became a Member.`);
    }

    // 🔽 Developer or 🧪 Tester Self-Assignment
    if (roleMessageId && message.id === roleMessageId) {
      if (emoji === '🔽') {
        const devRole = guild.roles.cache.find(r => r.name === 'Developer');
        if (devRole) await member.roles.add(devRole);
      } else if (emoji === '🧪') {
        const testerRole = guild.roles.cache.find(r => r.name === 'Tester');
        if (testerRole) await member.roles.add(testerRole);
      }
    }
  } catch (err) {
    console.error(`❌ Reaction role assignment failed for ${user.tag}:`, err);
  }
}
