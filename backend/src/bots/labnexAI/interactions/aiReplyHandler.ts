import { ButtonInteraction, GuildMember, TextChannel, ThreadChannel, EmbedBuilder } from 'discord.js';

export async function handleAiReplyButtons(interaction: ButtonInteraction): Promise<void> {
    const { customId } = interaction;
    const member = interaction.member as GuildMember;
    const client = interaction.client;

    const isStaff = () => member.roles.cache.some(role => role.name === 'Staff' || role.name === 'Admin');
    if (!isStaff()) {
        await interaction.reply({ content: 'You do not have permission to use this command.', flags: 1 << 6 /* Ephemeral */ });
        return;
    }

    const [action, , threadId] = customId.split('_');
    const suggestionMessage = interaction.message;
    const suggestedText = suggestionMessage.embeds[0]?.description;

    if (!suggestedText) {
        await interaction.reply({ content: 'Could not find the suggestion text.', flags: 1 << 6 /* Ephemeral */ });
        return;
    }

    switch (action) {
        case 'send': {
            await interaction.deferUpdate();
            let userIdToNotify: string | undefined;
            try {
                const thread = await client.channels.fetch(threadId) as ThreadChannel;
                if (thread && thread.parentId) {
                    const modmailChannel = await client.channels.fetch(thread.parentId) as TextChannel;
                    
                    // The thread ID is the same as the original message ID that started the thread
                    const originalMessage = await modmailChannel.messages.fetch(thread.id);
                    
                    const userField = originalMessage.embeds[0]?.fields.find(f => f.name === 'User');
                    userIdToNotify = userField?.value.match(/<@(\d+)>/)?.[1];
                }

                if (userIdToNotify) {
                    const user = await client.users.fetch(userIdToNotify);
                    const replyEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setAuthor({ name: `Response from ${member.user.tag} (Staff)`, iconURL: member.user.displayAvatarURL() })
                        .setDescription(suggestedText);
                    await user.send({ embeds: [replyEmbed] });

                    // Add a note to the thread that a reply was sent
                    const noteEmbed = new EmbedBuilder()
                        .setColor(0x74e2d7)
                        .setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(suggestedText)
                        .setTimestamp()
                        .setFooter({text: "AI-suggested reply sent to user."});
                    
                    const channel = interaction.channel;
                    if (channel && (channel.isTextBased() && !channel.isDMBased())) {
                        await channel.send({embeds: [noteEmbed]});
                    }

                    await suggestionMessage.delete();
                }
            } catch (e) {
                console.error('[handleAiReplyButtons] Failed to send AI suggestion:', e);
            }
            break;
        }
        case 'copy': {
            await interaction.reply({ content: suggestedText, flags: 1 << 6 /* Ephemeral */ });
            break;
        }
        case 'ignore': {
            await suggestionMessage.delete();
            // also acknowledge the interaction
            await interaction.reply({ content: 'Suggestion ignored.', flags: 1 << 6 /* Ephemeral */ });
            break;
        }
    }
} 