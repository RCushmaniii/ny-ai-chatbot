export const widgetMessages = {
  en: {
    title: "NY English Teacher",
    welcome: "Welcome! 👋",
    subtitle: "How can I help you today?",
    quickQuestions: "Quick questions:",
    placeholder: "Type your message...",
    error: "Sorry, I encountered an error. Please try again.",
    close: "Close chat",
    loading: "Loading...",
    suggestedQuestions: [
      "What are the prices for classes?",
      "What services do you offer?",
      "How do I book a session?",
    ],
  },
  es: {
    title: "NY English Teacher",
    welcome: "¡Bienvenido! 👋",
    subtitle: "¿Cómo puedo ayudarte hoy?",
    quickQuestions: "Preguntas rápidas:",
    placeholder: "Escribe tu mensaje...",
    error: "Lo siento, ocurrió un error. Por favor, inténtalo de nuevo.",
    close: "Cerrar chat",
    loading: "Cargando...",
    suggestedQuestions: [
      "¿Cuáles son los precios de las clases?",
      "¿Qué servicios ofreces?",
      "¿Cómo reservo una sesión?",
    ],
  },
} as const;

export type WidgetLocale = keyof typeof widgetMessages;

type LocaleInput = string | null | undefined;

export function normalizeWidgetLocale(input: LocaleInput): WidgetLocale | null {
  if (!input) return null;

  const lower = input.trim().toLowerCase();
  if (lower === "en" || lower.startsWith("en-")) return "en";
  if (lower === "es" || lower.startsWith("es-")) return "es";

  return null;
}

export function detectWidgetLocaleFromUrl(
  url: LocaleInput,
): WidgetLocale | null {
  if (!url) return null;
  const lower = url.toLowerCase();

  if (lower.includes("/es/")) return "es";
  if (lower.includes("/en/")) return "en";

  return null;
}

export function detectWidgetLocaleFromNavigatorLanguage(
  language: LocaleInput,
): WidgetLocale | null {
  return normalizeWidgetLocale(language);
}
