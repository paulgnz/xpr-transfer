import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const apiKey = process.env.VITE_METALPAY_API_KEY || '';
const secretKey = process.env.VITE_METALPAY_SECRET_KEY || '';

function generateNonce(): string {
  return Date.now().toString();
}

function generateHMAC(nonce: string): string {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(nonce + apiKey);
  return hmac.digest('hex');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if credentials are configured
  if (!apiKey || !secretKey) {
    return res.status(500).json({ error: 'Metal Pay credentials not configured' });
  }

  try {
    const nonce = generateNonce();
    const signature = generateHMAC(nonce);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    return res.status(200).json({
      apiKey,
      signature,
      nonce,
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    return res.status(500).json({ error: 'Failed to generate signature' });
  }
}
