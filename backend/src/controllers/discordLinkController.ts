import { Request, Response } from 'express';
import crypto from 'crypto';
import { DiscordLinkToken } from '../models/DiscordLinkToken';
import { UserDiscordLink } from '../models/UserDiscordLink';

const BOT_API_SECRET = process.env.LABNEX_API_BOT_SECRET;
const LINK_TOKEN_EXPIRY_MINUTES = 15;

/**
 * @route   POST /api/integrations/discord/generate-link-token
 * @desc    Called by the Discord bot to generate a one-time token for account linking.
 * @access  Private (Bot authenticated by secret key)
 */
export const generateLinkToken = async (req: Request, res: Response) => {
    const { discordUserId, discordUsername } = req.body;
    const providedSecret = req.headers['x-bot-secret'] as string;

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }

    if (!discordUserId || !discordUsername) {
        return res.status(400).json({ message: 'Missing discordUserId or discordUsername in request body.' });
    }

    try {
        // Generate a secure, unique token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + LINK_TOKEN_EXPIRY_MINUTES * 60 * 1000);

        const newLinkToken = new DiscordLinkToken({
            token,
            discordUserId,
            discordUsername,
            expiresAt,
        });

        await newLinkToken.save();

        res.status(201).json({ linkToken: token });

    } catch (error: any) {
        if (error.code === 11000) { // Duplicate key error for token (highly unlikely but possible)
             console.error('Error generating link token (duplicate): ', error.message);
             // Optionally, retry token generation, or just send a generic error
             return res.status(500).json({ message: 'Failed to generate unique link token, please try again.' });
        }
        console.error('Error generating link token:', error);
        res.status(500).json({ message: 'Server error while generating link token.' });
    }
};

export const linkDiscordAccount = async (req: Request, res: Response) => {
    const { token } = req.body;
    const labnexUserId = (req as any).user?._id;

    if (!token) {
        return res.status(400).json({ message: 'Missing token in request body.' });
    }

    if (!labnexUserId) {
        console.error('Error: labnexUserId is missing in an authenticated route.');
        return res.status(401).json({ message: 'Authentication error.' });
    }

    try {
        // 1. Find and validate the token
        const linkToken = await DiscordLinkToken.findOne({ token });

        if (!linkToken) {
            return res.status(404).json({ message: 'Invalid or expired token.' });
        }

        if (linkToken.expiresAt < new Date()) {
            return res.status(401).json({ message: 'Token has expired.' });
        }

        // (UserDiscordLink model has a unique index on discordUserId)
        const existingLinkForDiscordUser = await UserDiscordLink.findOne({ discordUserId: linkToken.discordUserId });
        if (existingLinkForDiscordUser && existingLinkForDiscordUser.userId.toString() !== labnexUserId.toString()) { // Ensure comparison is consistent
             return res.status(409).json({ message: 'This Discord account is already linked to a different Labnex account.' });
        }

        // Ensure labnexUserId is treated as a string for comparison if it comes from different sources
        const currentLabnexUserIdString = labnexUserId.toString();

        // 3. Create the link
        const newLink = await UserDiscordLink.findOneAndUpdate(
            { userId: currentLabnexUserIdString, discordUserId: linkToken.discordUserId },
            { discordUsername: linkToken.discordUsername, linkedAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 4. Delete the one-time use token
        await DiscordLinkToken.findByIdAndDelete(linkToken._id);

        res.status(200).json({ message: 'Discord account linked successfully.' });

    } catch (error) {
        console.error('Error linking Discord account:', error);
        res.status(500).json({ message: 'Server error while linking Discord account.' });
    }
};

/**
 * @route   GET /api/integrations/discord/linked-accounts
 * @desc    Retrieves all Discord accounts linked to the authenticated Labnex user.
 * @access  Private (Labnex user authenticated by JWT)
 */
export const getLinkedDiscordAccounts = async (req: Request, res: Response) => {
    const labnexUserId = (req as any).user?._id;

    if (!labnexUserId) {
        // This should not happen if auth middleware is working
        return res.status(401).json({ message: 'Authentication error.' });
    }

    try {
        const linkedAccounts = await UserDiscordLink.find({ userId: labnexUserId })
            .select('discordUserId discordUsername linkedAt'); // Select specific fields
        
        res.status(200).json(linkedAccounts);
    } catch (error) {
        console.error('Error fetching linked Discord accounts:', error);
        res.status(500).json({ message: 'Server error while fetching linked accounts.' });
    }
};

/**
 * @route   DELETE /api/integrations/discord/unlink-account/:discordUserIdToDelete
 * @desc    Unlinks a specific Discord account from the authenticated Labnex user.
 * @access  Private (Labnex user authenticated by JWT)
 */
export const unlinkDiscordAccount = async (req: Request, res: Response) => {
    const labnexUserId = (req as any).user?._id;
    const { discordUserIdToDelete } = req.params; // Get Discord User ID from URL parameter

    if (!labnexUserId) {
        return res.status(401).json({ message: 'Authentication error.' });
    }

    if (!discordUserIdToDelete) {
        return res.status(400).json({ message: 'Discord User ID to delete is missing.' });
    }

    try {
        const result = await UserDiscordLink.deleteOne({
            userId: labnexUserId,
            discordUserId: discordUserIdToDelete
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No linked account found for this Discord ID, or it does not belong to you.' });
        }

        res.status(200).json({ message: 'Discord account unlinked successfully.' });
    } catch (error) {
        console.error('Error unlinking Discord account:', error);
        res.status(500).json({ message: 'Server error while unlinking account.' });
    }
}; 