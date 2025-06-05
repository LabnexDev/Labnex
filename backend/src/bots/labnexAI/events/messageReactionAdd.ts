import { MessageReaction, User } from 'discord.js';

const RULES_MESSAGE_ID = process.env.RULES_MESSAGE_ID;

export async function handleMessageReactionAddEvent(reaction: MessageReaction, user: User) {
  if (user.bot) return;
  if (!reaction.message.guild) return;
  if (!RULES_MESSAGE_ID) {
    console.warn('[messageReactionAdd] RULES_MESSAGE_ID not set.');
    return;
  }
  if (reaction.message.id !== RULES_MESSAGE_ID) return;
  if (reaction.emoji.name !== '✅') return;

  try {
    const member = await reaction.message.guild.members.fetch(user.id);
    const memberRole = reaction.message.guild.roles.cache.find(r => r.name === 'Member');
    const waitlistRole = reaction.message.guild.roles.cache.find(r => r.name === 'Waitlist');

    if (memberRole) await member.roles.add(memberRole);
    if (waitlistRole) await member.roles.remove(waitlistRole);

    console.log(`🎉 ${user.tag} accepted rules and became a Member.`);
  } catch (err) {
    console.error(`❌ Role update failed for ${user.tag}:`, err);
  }
}

