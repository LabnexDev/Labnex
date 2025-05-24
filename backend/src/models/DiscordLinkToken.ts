import mongoose, { Document, Schema } from 'mongoose';
// import crypto from 'crypto'; // We'll use crypto in the controller/service for token generation

export interface IDiscordLinkToken extends Document {
    token: string;
    discordUserId: string;
    discordUsername: string;
    expiresAt: Date;
}

const DiscordLinkTokenSchema: Schema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    discordUserId: { // The Discord user ID this token is for
        type: String,
        required: true,
    },
    discordUsername: { // The Discord username#tag this token is for
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        // TTL index can be set here if desired for automatic MongoDB cleanup
        // index: { expires: '15m' } // Example: expire after 15 minutes
    }
}, { timestamps: true }); // Adds createdAt and updatedAt

export const DiscordLinkToken = mongoose.model<IDiscordLinkToken>('DiscordLinkToken', DiscordLinkTokenSchema); 