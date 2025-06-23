import { EmbedBuilder, GuildMember } from 'discord.js';
import { connectDB } from '../../../config/database';
import WelcomedMember from '../../../models/WelcomedMember';

// Ensure DB connection (no-op if already connected)
connectDB().catch(err => console.error('[guildMemberAdd.ts] Mongo connection failed', err));

// Simple in-memory cache to avoid duplicate welcome messages within the same bot process
const welcomedMembers = new Set<string>();

// Named export for the handler function
export async function handleGuildMemberAddEvent(member: GuildMember) {
  // Guard against duplicate sends in the same runtime
  if (welcomedMembers.has(member.id)) {
    console.log(`[guildMemberAdd.ts] Member ${member.user.tag} already welcomed in this session. Skipping.`);
    return;
  }

  // Use a DB insert as an atomic lock to ensure only one process sends the welcome message
  try {
    // Attempt to create a DB record as an atomic "lock". If this succeeds, we are the first
    // process to welcome the user. If it fails with duplicate-key, someone else already did it.
    await WelcomedMember.create({ memberId: member.id });
    // Record inserted – we're the first process to greet this member
  } catch (insertErr: any) {
    if (insertErr.code === 11000) {
      console.log(`[guildMemberAdd.ts] Member ${member.user.tag} already welcomed per DB record (duplicate key). Skipping.`);
      return;
    }
    console.error(`[guildMemberAdd.ts] Failed to create DB welcome record for ${member.user.tag}:`, insertErr);
    // If DB is down, fall back to in-memory dedup to avoid spamming
    if (welcomedMembers.has(member.id)) return;
    // still attempt – better to risk a duplicate than miss welcoming entirely
  }

  // Add to in-memory cache to prevent duplicates in this runtime
  welcomedMembers.add(member.id);

  try {
    const waitlistRole = member.guild.roles.cache.find(role => role.name === 'Waitlist');
    if (waitlistRole) {
      await member.roles.add(waitlistRole);
    }

    const welcomeChannel = member.guild.channels.cache.find(
      ch => ch.name === 'welcome' && ch.isTextBased()
    );
    if (!welcomeChannel) {
      console.log(`[guildMemberAdd.ts] 'welcome' channel not found in guild ${member.guild.name}. Cannot send welcome message.`);
      return;
    }

    // Prevent duplicate welcome messages by checking if we've already greeted this member
    try {
      const recentMessages = await (welcomeChannel as any).messages.fetch({ limit: 100 });
      const alreadyWelcomed = recentMessages.some((msg: any) => {
        if (msg.author.id !== member.client.user?.id) return false; // Only consider bot messages
        return msg.content.includes(`<@${member.id}>`);
      });

      if (alreadyWelcomed) {
        console.log(`[guildMemberAdd.ts] Welcome message for ${member.user.tag} already sent. Skipping duplicate.`);
        return;
      }
    } catch (fetchErr) {
      console.warn(`[guildMemberAdd.ts] Failed to fetch recent messages for duplicate check:`, fetchErr);
    }

    const embed = new EmbedBuilder()
      .setTitle('👋 Welcome to Labnex (Closed Beta)')
      .setColor(0x66CCFF)
      .setDescription(
        `Hey <@${member.id}>, welcome aboard! 🎉\n\n` +
        "You're in our **Closed Beta**. Here's what to do next:"
      )
      .addFields(
        { name: '📜 Step 1: Read the Rules', value: 'Head to `#rules` and read through our community guidelines.' },
        { name: '✅ Step 2: Accept Rules', value: 'React to the pinned rules message with ✅ to unlock full access.' },
        { name: '🎭 Step 3: Choose Your Role', value: 'React in `#get-started` with 🔽 for Developer or 🧪 for Tester.' },
        { name: '📝 Step 4: Join the Waitlist', value: '[Click here](https://labnexdev.github.io/Labnex) to request access to Labnex features.' }
      )
      .setFooter({ text: "You're early. You're important. Thanks for joining Labnex." });

    await (welcomeChannel as any).send({ content: `<@${member.id}>`, embeds: [embed] });
    console.log(`✅ Onboarded ${member.user.tag} with Waitlist role.`);
  } catch (error) {
    console.error(`❌ Onboarding failed for ${member.user.tag}:`, error);
  }
}
