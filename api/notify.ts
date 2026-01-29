import type { VercelRequest, VercelResponse } from '@vercel/node'

// Récupérer la localisation approximative via l'IP
async function getLocationFromIP(ip: string): Promise<string> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName`)
    const data = await response.json()
    if (data.status === 'success') {
      return `${data.city || 'Ville inconnue'}, ${data.regionName || ''}, ${data.country || ''}`
    }
  } catch {
    // Silently fail
  }
  return 'Localisation inconnue'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing Telegram environment variables')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // Get visitor info from request
    const { userAgent, referrer, timestamp, screenSize, language } = req.body

    // Get visitor IP from Vercel headers
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.headers['x-real-ip'] as string
      || 'IP inconnue'

    // Get location from IP
    const location = ip !== 'IP inconnue' ? await getLocationFromIP(ip) : 'Localisation inconnue'

    // Format the notification message
    const message = `🌐 *Nouvelle visite sur Maison Mayssa*

📅 Date: ${new Date(timestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
📍 Localisation: ${location}
🔢 IP: \`${ip}\`
🖥️ Écran: ${screenSize || 'Inconnu'}
🌍 Langue: ${language || 'Inconnue'}
🔗 Provenance: ${referrer || 'Directe'}
📱 Appareil: ${userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}

_Navigateur: ${userAgent?.slice(0, 100) || 'Inconnu'}_`

    // Send to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    )

    if (!telegramResponse.ok) {
      const error = await telegramResponse.text()
      console.error('Telegram API error:', error)
      return res.status(500).json({ error: 'Failed to send notification' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Notification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
