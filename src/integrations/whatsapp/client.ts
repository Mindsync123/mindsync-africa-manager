export const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || '';
export const WHATSAPP_API_TOKEN = import.meta.env.VITE_WHATSAPP_API_TOKEN || '';

export const sendWhatsAppMessage = async (to: string, message: string) => {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN) {
    console.warn('WhatsApp API credentials missing');
    return { error: 'WhatsApp API credentials missing' };
  }

  try {
    const res = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`
      },
      body: JSON.stringify({ to, message })
    });

    if (!res.ok) {
      throw new Error('Failed to send WhatsApp message');
    }

    return { data: await res.json() };
  } catch (err: any) {
    console.error(err);
    return { error: err.message };
  }
};
