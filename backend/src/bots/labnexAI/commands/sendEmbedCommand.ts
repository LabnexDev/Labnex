import {
    SlashCommandBuilder,
    EmbedBuilder,
    CommandInteraction,
    TextChannel,
    NewsChannel,
    ChannelType,
    PermissionsBitField,
    GuildMember,
    ApplicationCommandOptionType
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('sendembed')
    .setDescription('Sends an embedded message to a specified channel. (Admin Only)')
    .addStringOption(option =>
        option.setName('title')
            .setDescription('The title of the embed message.')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('description')
            .setDescription('The main content (description) of the embed message.')
            .setRequired(true))
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('The channel to send the embed to. Defaults to current channel.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false))
    .addStringOption(option =>
        option.setName('color')
            .setDescription('Hex color code for the embed (e.g., #0099ff).')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('footer')
            .setDescription('Footer text for the embed.')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false);

export async function execute(interaction: CommandInteraction<'cached'>) {
    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && !member.roles.cache.some(role => role.name === 'Admin')) {
        await interaction.reply({ content: 'You do not have permission to use this command. Requires "Admin" role or Administrator permissions.', ephemeral: true });
        return;
    }

    const titleOption = interaction.options.get('title', true);
    const descriptionOption = interaction.options.get('description', true);
    const channelOption = interaction.options.get('channel', false);
    const colorOption = interaction.options.get('color', false);
    const footerOption = interaction.options.get('footer', false);

    const title = titleOption.value as string;
    const description = descriptionOption.value as string;
    
    let targetChannel: TextChannel | NewsChannel | null = null;
    if (channelOption && channelOption.channel && 
        (channelOption.channel.type === ChannelType.GuildText || channelOption.channel.type === ChannelType.GuildAnnouncement)) {
        targetChannel = channelOption.channel as TextChannel | NewsChannel;
    }

    const color = colorOption?.value as string | undefined;
    const footer = footerOption?.value as string | undefined;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description);

    if (color) {
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            embed.setColor(color as `#${string}`);
        } else {
            await interaction.reply({ content: 'Invalid color format. Please use a 6-digit hex code (e.g., #FF0000).', ephemeral: true });
            return;
        }
    }

    if (footer) {
        embed.setFooter({ text: footer });
    }

    let channelToSend: TextChannel | NewsChannel;

    if (targetChannel) {
        channelToSend = targetChannel;
    } else if (interaction.channel && (interaction.channel.type === ChannelType.GuildText || interaction.channel.type === ChannelType.GuildAnnouncement)) {
        channelToSend = interaction.channel as TextChannel | NewsChannel;
    } else {
        await interaction.reply({ content: 'Could not determine a valid text channel. Please specify a channel or run this command in a text or announcement channel.', ephemeral: true });
        return;
    }

    try {
        await channelToSend.send({ embeds: [embed] });
        await interaction.reply({ content: `Embed sent to ${channelToSend.name}!`, ephemeral: true });
    } catch (error) {
        console.error('Error sending embed:', error);
        await interaction.reply({ content: 'Failed to send the embed message. Check my permissions in that channel.', ephemeral: true });
    }
} 