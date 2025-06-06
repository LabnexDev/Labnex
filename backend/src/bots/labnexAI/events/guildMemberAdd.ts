import { EmbedBuilder, GuildMember } from 'discord.js';

// Named export for the handler function
export async function handleGuildMemberAddEvent(member: GuildMember) {
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
