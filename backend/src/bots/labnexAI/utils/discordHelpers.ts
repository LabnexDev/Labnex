import { CommandInteraction, CacheType } from 'discord.js';

export function getInteractionStringOption(
    interaction: CommandInteraction<CacheType>,
    name: string,
    required: boolean
): string | null {
    const option = interaction.options.get(name, required);
    if (option && typeof option.value === 'string') {
        return option.value;
    }
    if (option && typeof option.value === 'number') {
        return option.value.toString();
    }
    if (option && typeof option.value === 'boolean') {
        return option.value.toString();
    }
    return null;
} 