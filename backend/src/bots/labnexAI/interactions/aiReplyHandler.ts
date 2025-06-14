import { ButtonInteraction, GuildMember, TextChannel, ThreadChannel, EmbedBuilder, ChannelType } from 'discord.js';

export async function handleAiReplyButtons(interaction: ButtonInteraction): Promise<void> {
    const { customId } = interaction;
    const member = interaction.member as GuildMember;
    const client = interaction.client;

    const staffRoleId = process.env.STAFF_ROLE_ID;
    if (!staffRoleId || !member.roles.cache.has(staffRoleId)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', flags: 1 << 6 });
        return;
    }

    const [action, , entityId] = customId.split('_'); // entityId can be a userId or channelId
    const suggestionMessage = interaction.message;
    const suggestedText = suggestionMessage.embeds[0]?.description;

    if (!suggestedText) {
        await interaction.reply({ content: 'Could not find the suggestion text.', flags: 1 << 6 });
        return;
    }

    switch (action) {
        case 'send': { // This now sends a DM directly to the user
            await interaction.deferUpdate(); // Acknowledge the button click
            try {
                const userToNotify = await client.users.fetch(entityId); // entityId is the UserID
                const replyEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setAuthor({ name: `Response from ${member.user.tag} (Staff)`, iconURL: member.user.displayAvatarURL() })
                    .setDescription(suggestedText)
                    .setFooter({ text: "You can reply in this DM to send further messages."});
                
                await userToNotify.send({ embeds: [replyEmbed] });

                // Add a note in the ticket channel that a DM was sent
                const noteEmbed = new EmbedBuilder()
                    .setColor(0x74e2d7)
                    .setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(suggestedText)
                    .setTimestamp()
                    .setFooter({text: "This AI-suggested reply was sent to the user via DM."});
                
                if (interaction.inGuild()) {
                    const channel = interaction.channel;
                    if (channel?.isTextBased()) {
                        await channel.send({embeds: [noteEmbed]});
                    }
                }
                await suggestionMessage.delete();

            } catch (e) {
                console.error('[handleAiReplyButtons] Failed to send AI suggestion DM:', e);
                await interaction.followUp({ content: "Failed to send DM. The user may have DMs disabled.", flags: 1 << 6 });
            }
            break;
        }
        case 'copy': {
            await interaction.reply({ content: suggestedText, flags: 1 << 6 });
            break;
        }
        case 'ignore': {
            await suggestionMessage.delete();
            await interaction.reply({ content: 'Suggestion ignored.', flags: 1 << 6 });
            break;
        }
    }
} 