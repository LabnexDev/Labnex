import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserDiscordLink extends Document {
    userId: Types.ObjectId;          // Refers to the Labnex User
    discordUserId: string;           // Discord User ID (snowflake)
    discordUsername: string;         // Discord username#discriminator (e.g., User#1234)
    linkedAt: Date;
}

const UserDiscordLinkSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    discordUserId: {
        type: String,
        required: true,
        unique: true, // A Discord ID can only be linked to one Labnex account
    },
    discordUsername: { // For informational purposes, not for auth
        type: String,
        required: true,
    },
    linkedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Ensure a Labnex user can only link one Discord account
UserDiscordLinkSchema.index({ userId: 1 }, { unique: true });

export const UserDiscordLink = mongoose.model<IUserDiscordLink>('UserDiscordLink', UserDiscordLinkSchema); 