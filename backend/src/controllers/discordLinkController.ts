import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { DiscordLinkToken } from '../models/DiscordLinkToken';
import { UserDiscordLink } from '../models/UserDiscordLink';
import { IUser } from '../models/User';

const BOT_API_SECRET = process.env.LABNEX_API_BOT_SECRET;
const LINK_TOKEN_EXPIRY_MINUTES = 15;

// Environment variables for Discord OAuth2 (ensure these are in your .env file)
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
// This should be the full URL to your backend callback endpoint
// e.g., https://your-backend-api.com/api/integrations/discord/oauth-callback
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; 
const FRONTEND_DISCORD_LINK_CALLBACK_URL = process.env.FRONTEND_URL + '/users/discord/link'; // e.g., https://labnexdev.github.io/users/discord/link

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
    const labnexUserId = (req as any).user?.id;

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
    const labnexUserId = (req as any).user?.id;

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
    const labnexUserId = (req as any).user?.id;
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

// New function to initiate Discord link from the Labnex web application
export const initiateDiscordLinkFromWebApp = async (req: Request, res: Response) => {
    const labnexUserId = (req as any).user?.id as string;

    if (!labnexUserId) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
        console.error('Discord OAuth2 client ID or redirect URI is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error for Discord integration.' });
    }

    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + LINK_TOKEN_EXPIRY_MINUTES * 60 * 1000);

        // Store the token with labnexUserId, so we know who initiated this
        const newLinkToken = new DiscordLinkToken({
            token,
            labnexUserId,
            expiresAt,
        });
        await newLinkToken.save();

        // Construct Discord OAuth2 URL
        const params = new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            redirect_uri: DISCORD_REDIRECT_URI,
            response_type: 'code',
            scope: 'identify email', // Request basic user info. 'email' is optional but often useful.
            state: token, // Use the generated token as state to prevent CSRF and to retrieve it later
        });

        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
        
        // Redirect user to Discord authorization page
        res.redirect(discordAuthUrl);

    } catch (error) {
        console.error('Error initiating Discord link from web app:', error);
        res.status(500).json({ message: 'Server error while initiating Discord link.' });
    }
};

// New function to handle OAuth2 callback from Discord
export const handleDiscordOAuthCallback = async (req: Request, res: Response) => {
    const { code, state } = req.query; // Code and state are sent by Discord as query parameters

    // TEMPORARY DEBUG LOGGING:
    console.log('[DEBUG] Inside handleDiscordOAuthCallback. Checking ENV VARS:');
    console.log(`[DEBUG] DISCORD_CLIENT_ID: ${process.env.DISCORD_CLIENT_ID}`);
    console.log(`[DEBUG] DISCORD_CLIENT_SECRET: ${process.env.DISCORD_CLIENT_SECRET ? 'SET' : 'NOT SET'}`); // Avoid logging the actual secret
    console.log(`[DEBUG] DISCORD_REDIRECT_URI: ${process.env.DISCORD_REDIRECT_URI}`);
    console.log(`[DEBUG] FRONTEND_URL for callback construction: ${process.env.FRONTEND_URL}`);
    const calculatedFrontendDiscordLinkCallbackUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL + '/users/discord/link' : 'FRONTEND_URL IS NOT SET';
    console.log(`[DEBUG] FRONTEND_DISCORD_LINK_CALLBACK_URL (calculated): ${calculatedFrontendDiscordLinkCallbackUrl}`);
    // END TEMPORARY DEBUG LOGGING

    if (!code || !state) {
        return res.status(400).json({ message: 'Missing authorization code or state from Discord.' });
    }

    const tokenFromState = state as string;

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI || (process.env.FRONTEND_URL && !FRONTEND_DISCORD_LINK_CALLBACK_URL.startsWith('http'))) { // Check if FRONTEND_URL is set before using it to construct FRONTEND_DISCORD_LINK_CALLBACK_URL
        console.error('Discord OAuth2 credentials or frontend redirect URI are not configured.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    try {
        // 1. Validate the state (token)
        const linkTokenRecord = await DiscordLinkToken.findOne({ token: tokenFromState });
        if (!linkTokenRecord) {
            return res.status(400).json({ message: 'Invalid or expired state token.' });
        }
        if (linkTokenRecord.expiresAt < new Date()) {
            // Optionally delete the expired token
            await DiscordLinkToken.findByIdAndDelete(linkTokenRecord._id);
            return res.status(400).json({ message: 'Link request has expired. Please try again.' });
        }
        if (!linkTokenRecord.labnexUserId) {
            // This token was not initiated by the web app flow
            return res.status(400).json({ message: 'Invalid token type for this operation.' });
        }

        // 2. Exchange authorization code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: DISCORD_REDIRECT_URI,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // 3. Fetch Discord user information
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const discordUser = userResponse.data;
        const discordUserId = discordUser.id;
        const discordUsername = `${discordUser.username}#${discordUser.discriminator}`; 

        // 4. Update the linkTokenRecord with Discord user info
        linkTokenRecord.discordUserId = discordUserId;
        linkTokenRecord.discordUsername = discordUsername;
        await linkTokenRecord.save();

        // 5. Redirect the user to the frontend page to complete the linking
        const frontendRedirectParams = new URLSearchParams({
            token: linkTokenRecord.token, // The original token
            discord_id: discordUserId,
            discord_username: encodeURIComponent(discordUsername)
        });
        res.redirect(`${FRONTEND_DISCORD_LINK_CALLBACK_URL}?${frontendRedirectParams.toString()}`);

    } catch (error: any) {
        console.error('Error handling Discord OAuth callback:', error.response ? error.response.data : error.message);
        // Redirect to an error page or the main page on the frontend?
        // For now, sending a JSON error, but a redirect might be better UX
        res.status(500).json({ message: 'Server error during Discord OAuth callback.' });
    }
}; 