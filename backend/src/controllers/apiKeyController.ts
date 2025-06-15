import { Request, Response } from 'express';
import crypto from 'crypto';
import ApiKey from '../models/apiKey';
import { IRequest } from '../middleware/auth'; // Assuming IRequest extends express.Request and has a user property

const KEY_PREFIX = 'lab_rk_';
const KEY_BYTE_LENGTH = 32;

/**
 * Hashes an API key using SHA256.
 * @param key The plaintext API key.
 * @returns The hex-encoded SHA256 hash.
 */
const hashApiKey = (key: string) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Generate a new API key for the authenticated user.
 * The plaintext key is only returned once in this response.
 */
export const createApiKey = async (req: IRequest, res: Response) => {
  try {
    const { label } = req.body;
    const userId = req.user?._id;

    if (!label) {
      return res.status(400).json({ message: 'A label is required for the API key.' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const rawKey = crypto.randomBytes(KEY_BYTE_LENGTH).toString('hex');
    const fullKey = `${KEY_PREFIX}${rawKey}`;
    const hashedKey = hashApiKey(fullKey);

    const newApiKey = new ApiKey({
      user: userId,
      label,
      hashedKey,
      prefix: `${KEY_PREFIX}${rawKey.substring(0, 8)}...`, // Store a non-sensitive prefix for display
    });

    await newApiKey.save();

    res.status(201).json({ 
      message: 'API Key created successfully. Store this key securely, it will not be shown again.',
      token: fullKey,
      apiKey: { // Return the new key metadata for immediate display
        _id: newApiKey._id,
        label: newApiKey.label,
        prefix: newApiKey.prefix,
        createdAt: newApiKey.createdAt,
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ message: 'An error occurred while creating the API key.' });
  }
};

/**
 * List all API keys for the authenticated user.
 */
export const listApiKeys = async (req: IRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const keys = await ApiKey.find({ user: userId }).select('-hashedKey');
    res.status(200).json(keys);
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({ message: 'An error occurred while fetching API keys.' });
  }
};

/**
 * Revoke (delete) an API key by its ID.
 */
export const revokeApiKey = async (req: IRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const key = await ApiKey.findOne({ _id: id, user: userId });

    if (!key) {
      return res.status(404).json({ message: 'API key not found or you do not have permission to revoke it.' });
    }

    await key.deleteOne();

    res.status(200).json({ message: 'API key successfully revoked.' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ message: 'An error occurred while revoking the API key.' });
  }
}; 