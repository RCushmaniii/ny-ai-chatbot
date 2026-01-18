/**
 * Rate Limiting Configuration
 *
 * Controls message limits to prevent abuse and manage costs
 */

export const RATE_LIMITS = {
  // Session-based limits (anonymous users)
  messagesPerSession: 20, // ~10 back-and-forth exchanges

  // IP-based limits (future implementation)
  sessionsPerIpPerDay: 5,
  messagesPerIpPerHour: 50,
  messagesPerIpPerDay: 100,

  // Cost protection
  maxDailyCost: 10, // $10/day budget
  alertThreshold: 7, // Alert at $7
} as const;

export const RATE_LIMIT_MESSAGES = {
  en: {
    sessionLimit: `You've reached the message limit for this session (${RATE_LIMITS.messagesPerSession} messages). This helps us provide quality service to all users.

To continue:
• Start a new conversation
• Or contact us to discuss coaching options: https://www.nyenglishteacher.com/en/book/

Thank you for your understanding!`,

    ipLimit: `You've reached the daily usage limit. Please try again tomorrow, or contact us for unlimited access through our coaching program: https://www.nyenglishteacher.com/en/book/`,
  },

  es: {
    sessionLimit: `Has alcanzado el límite de mensajes para esta sesión (${RATE_LIMITS.messagesPerSession} mensajes). Esto nos ayuda a brindar un servicio de calidad a todos los usuarios.

Para continuar:
• Inicia una nueva conversación
• O contáctanos para discutir opciones de coaching: https://www.nyenglishteacher.com/es/reservar/

¡Gracias por tu comprensión!`,

    ipLimit: `Has alcanzado el límite de uso diario. Por favor, inténtalo de nuevo mañana, o contáctanos para acceso ilimitado a través de nuestro programa de coaching: https://www.nyenglishteacher.com/es/reservar/`,
  },
} as const;
