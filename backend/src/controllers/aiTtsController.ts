import { Request, Response } from 'express';
import axios from 'axios';

export const proxyOpenAITTS = async (req: Request, res: Response) => {
  try {
    const { input, voice = 'shimmer' } = req.body as { input?: string; voice?: string };
    if (!input || input.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'input is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'OPENAI_API_KEY not configured' });
    }

    const resp = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      { model: 'tts-1', input, voice },
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    res.set('Content-Type', 'audio/mpeg');
    return res.send(resp.data);
  } catch (e: any) {
    console.error('TTS proxy error:', e.response?.data || e.message);
    return res.status(500).json({ success: false, error: 'Text-to-speech failed' });
  }
}; 