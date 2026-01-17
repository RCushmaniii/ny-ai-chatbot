"use client";

import { nanoid } from "nanoid";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  detectWidgetLocaleFromNavigatorLanguage,
  detectWidgetLocaleFromUrl,
  normalizeWidgetLocale,
  type WidgetLocale,
  widgetMessages,
} from "@/lib/i18n/widget-messages";

// Translations
function resolveWidgetLocale(searchParams: URLSearchParams): WidgetLocale {
  const explicit = normalizeWidgetLocale(
    searchParams.get("lang") ?? searchParams.get("locale"),
  );
  if (explicit) return explicit;

  try {
    const parentUrl = document.referrer || window.location.href;
    const fromUrl = detectWidgetLocaleFromUrl(parentUrl);
    if (fromUrl) return fromUrl;
  } catch {
    // ignore
  }

  try {
    const fromNavigator = detectWidgetLocaleFromNavigatorLanguage(
      navigator.language,
    );
    if (fromNavigator) return fromNavigator;
  } catch {
    // ignore
  }

  return "es";
}

function EmbedChatContent() {
  const searchParams = useSearchParams();
  const [_embedSettings, setEmbedSettings] = useState<any>(null);
  const [_isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Detect language from parent page URL or query param
  const [language, setLanguage] = useState<WidgetLocale>("es");

  // Detect if we're embedded in an iframe
  const isEmbedded =
    typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    setLanguage(resolveWidgetLocale(searchParams));
  }, [searchParams]);

  // Prevent autofocus behavior when embedded
  useEffect(() => {
    if (!isEmbedded) return;

    // Remove any autofocus attributes
    const removeAutofocus = () => {
      document.querySelectorAll("[autofocus]").forEach((el) => {
        el.removeAttribute("autofocus");
      });
    };

    // Blur any focused element on load
    const preventInitialFocus = () => {
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
    };

    // Override scrollIntoView to prevent iframe from scrolling parent
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (
      arg?: boolean | ScrollIntoViewOptions,
    ) {
      // Only allow scrolling within the iframe, not the parent
      if (typeof arg === "object") {
        arg = { ...arg, block: "nearest", inline: "nearest" };
      }
      return originalScrollIntoView.call(this, arg);
    };

    // Prevent focus events from triggering scroll
    const preventFocusScroll = (e: FocusEvent) => {
      e.preventDefault();
      // Allow focus but prevent scroll
      if (e.target instanceof HTMLElement) {
        e.target.focus({ preventScroll: true });
      }
    };

    document.addEventListener("focus", preventFocusScroll, true);

    removeAutofocus();
    preventInitialFocus();

    // Also prevent focus after a short delay (in case of async rendering)
    const timeoutId = setTimeout(() => {
      removeAutofocus();
      preventInitialFocus();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      Element.prototype.scrollIntoView = originalScrollIntoView;
      document.removeEventListener("focus", preventFocusScroll, true);
    };
  }, [isEmbedded]);

  // Fetch embed settings from admin
  useEffect(() => {
    fetch("/api/embed/settings")
      .then((res) => res.json())
      .then((data) => {
        setEmbedSettings(data);
        setIsLoadingSettings(false);
      })
      .catch((err) => {
        console.error("Failed to load embed settings:", err);
        setIsLoadingSettings(false);
      });
  }, []);

  // Get translations for current language
  const t = widgetMessages[language];

  // Use language-specific defaults, don't let embedSettings override language
  const placeholder = t.placeholder;
  // Load icon from chatbot server
  const botIconUrl = "https://ny-ai-chatbot.vercel.app/images/chatbot-icon.jpg";
  const suggestedQuestions = t.suggestedQuestions;

  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatId = useRef(nanoid());

  const scrollToBottom = useCallback(() => {
    // Only scroll within iframe, don't affect parent page
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, []);

  // Track if we should scroll (only after user sends a message)
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    // Only scroll when user sends a message, not when AI responds
    // This lets users read AI responses from the beginning
    if (shouldScrollRef.current) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }
  }, [messages, scrollToBottom]);

  const handleClose = () => {
    window.parent.postMessage("close-chat", "*");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    // Scroll to show user's message, but not when AI responds
    shouldScrollRef.current = true;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/embed/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId.current,
          message: userMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t.error,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Unified Header - NY Navy with professional styling */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#0F172A] text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
            {/* biome-ignore lint/performance/noImgElement: External URL in embed iframe, Next Image not suitable */}
            <img
              src={botIconUrl}
              alt="NY English Teacher"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              NY English AI Coach
            </h1>
            <p className="text-[13px] opacity-80 leading-tight mt-0.5">
              {language === "es"
                ? "Tu asistente académico 24/7"
                : "Your 24/7 academic assistant"}
            </p>
          </div>
        </div>
        {/* Hide close button when embedded on a page, show only in popup widget */}
        {!isEmbedded && (
          <button
            type="button"
            onClick={handleClose}
            className="p-1 opacity-70 hover:opacity-100 transition-opacity"
            aria-label={t.close}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages - Professional light background */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 px-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#334155] mb-2">
                {language === "es"
                  ? "Hola. ¿Cómo puedo ayudarte hoy?"
                  : "Hello. How can I assist you today?"}
              </h2>
            </div>
            <div className="w-full max-w-md space-y-2.5">
              <p className="text-sm font-medium text-[#64748B] mb-3">
                {language === "es" ? "Temas sugeridos:" : "Suggested topics:"}
              </p>
              {suggestedQuestions.map((question: string, idx: number) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setInput(question)}
                  className="w-full text-left px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#C2A45F] hover:bg-[#FFFDF5] transition-all text-sm text-[#0F172A] font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm wrap-break-word ${
                msg.role === "user"
                  ? "bg-blue-600"
                  : "bg-white border border-gray-200"
              }`}
              style={
                msg.role === "user"
                  ? {
                      color: "#ffffff",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }
                  : { wordBreak: "break-word", overflowWrap: "break-word" }
              }
            >
              <div className="text-sm leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p
                        className="mb-2 last:mb-0 wrap-break-word"
                        style={msg.role === "user" ? { color: "#ffffff" } : {}}
                      >
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong
                        className="font-semibold wrap-break-word"
                        style={msg.role === "user" ? { color: "#ffffff" } : {}}
                      >
                        {children}
                      </strong>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={
                          msg.role === "user"
                            ? "underline hover:opacity-80 break-all"
                            : "text-blue-600 hover:underline break-all"
                        }
                        style={msg.role === "user" ? { color: "#ffffff" } : {}}
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => (
                      <ul
                        className="list-disc pl-4 mb-2"
                        style={msg.role === "user" ? { color: "#ffffff" } : {}}
                      >
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol
                        className="list-decimal pl-4 mb-2"
                        style={msg.role === "user" ? { color: "#ffffff" } : {}}
                      >
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li
                        className="mb-1"
                        style={msg.role === "user" ? { color: "#ffffff" } : {}}
                      >
                        {children}
                      </li>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Modern pill-shaped design with gold accent */}
      <form
        onSubmit={handleSubmit}
        className="px-5 py-4 bg-white border-t border-[#E2E8F0]"
      >
        <div className="flex gap-2.5 items-center bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0] focus-within:border-[#C2A45F] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#334155] placeholder-[#A0AEC0]"
            disabled={isLoading}
            onFocus={(e) => {
              e.preventDefault();
              if (isEmbedded && inputRef.current) {
                inputRef.current.focus({ preventScroll: true });
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 bg-[#C2A45F] hover:bg-[#B09351] text-[#0F172A] rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
            aria-label={language === "es" ? "Enviar mensaje" : "Send message"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[18px] h-[18px] ml-0.5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EmbedChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <EmbedChatContent />
    </Suspense>
  );
}
