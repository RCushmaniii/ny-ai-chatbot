import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get("id") || "default";

  const embedScript = `
(function() {
  'use strict';
  
  const CHAT_APP_URL = '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}';
  const BOT_ID = '${botId}';
  
  const scriptTag = document.currentScript;
  const getAttr = (name) => scriptTag?.getAttribute(name) || scriptTag?.getAttribute('data-' + name) || scriptTag?.getAttribute(name.toLowerCase()) || scriptTag?.getAttribute('data-' + name.toLowerCase());

  const normalizeLocale = (value) => {
    if (!value) return null;
    const lower = String(value).trim().toLowerCase();
    if (lower === 'en' || lower.startsWith('en-')) return 'en';
    if (lower === 'es' || lower.startsWith('es-')) return 'es';
    return null;
  };

  const detectLocale = () => {
    const explicit = normalizeLocale(getAttr('language'));
    if (explicit) return explicit;

    try {
      const path = String(window.location.pathname || '').toLowerCase();
      if (path.includes('/es/')) return 'es';
      if (path.includes('/en/')) return 'en';
    } catch (e) {
      // ignore
    }

    try {
      const fromBrowser = normalizeLocale(navigator.language);
      if (fromBrowser) return fromBrowser;
    } catch (e) {
      // ignore
    }

    return 'es';
  };

  const language = detectLocale();

  const defaultWelcomeMessage = language === 'es'
    ? '👋 ¡Hola! Haz tus preguntas aquí!'
    : '👋 Hey... ask questions here!';

  const defaultPlaceholder = language === 'es'
    ? 'Escribe tu mensaje...'
    : 'Type your message...';

  // Build config with script attributes and defaults (settings will be fetched async)
  const buildConfig = (serverSettings = {}) => ({
    welcomeMessage: getAttr('welcome-message') || getAttr('welcomeMessage') || serverSettings.welcomeMessage || defaultWelcomeMessage,
    welcomeGif: getAttr('welcome-gif') || getAttr('welcomeGif') || serverSettings.welcomeGif || '',
    showWelcomeMessage: (getAttr('show-welcome-message') || getAttr('showWelcomeMessage') || 'true') !== 'false',
    buttonColor: getAttr('button-color') || getAttr('buttonColor') || serverSettings.buttonColor || '#4f46e5',
    buttonSize: parseFloat(getAttr('button-size') || getAttr('buttonSize') || serverSettings.buttonSize || '1'),
    position: getAttr('position') || serverSettings.position || 'bottom-right',
    openDelay: parseInt(getAttr('open-delay') || getAttr('openDelay') || '5000'),
    autoOpen: (getAttr('open') || 'false') === 'true',
    language,
    placeholder: getAttr('placeholder') || serverSettings.placeholder || defaultPlaceholder,
    botIcon: getAttr('botIcon') || getAttr('bot-icon') || serverSettings.botIcon || '💬',
  });

  // Start with config from attributes and defaults
  let config = buildConfig();
  let widgetInitialized = false;

  // Fetch custom settings asynchronously (non-blocking)
  fetch(CHAT_APP_URL + '/api/embed/settings')
    .then(response => response.ok ? response.json() : {})
    .then(serverSettings => {
      // Only update config if widget hasn't been initialized yet
      if (!widgetInitialized) {
        config = buildConfig(serverSettings);
      }
    })
    .catch(e => {
      console.warn('Failed to load custom embed settings, using attributes and defaults');
    });

  const iframeId = 'nyenglish-chat-iframe';
  const buttonId = 'nyenglish-chat-button';
  const welcomeId = 'nyenglish-chat-welcome';
  const badgeId = 'nyenglish-chat-badge';
  let isOpen = false;
  let isMinimized = false;
  let hasNewMessage = false;
  
  // Cache DOM elements
  let cachedIframe = null;
  let cachedButton = null;
  let cachedWelcome = null;
  let cachedBadge = null;
  
  const getElement = (id, cache) => {
    if (cache) return cache;
    return document.getElementById(id);
  };

  const fadeIn = (el, delay = 0) => {
    if (!el) return;
    const displayType = el.id === buttonId ? 'flex' : 'block';
    el.style.display = displayType;
    requestAnimationFrame(() => {
      setTimeout(() => { 
        el.style.opacity = '1'; 
        el.style.transform = 'translateY(0) scale(1)'; 
      }, delay);
    });
  };

  const fadeOut = (el) => {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => { el.style.display = 'none'; }, 300);
  };
  
  // Modern slide-in animation
  const slideIn = (el, delay = 0) => {
    if (!el) return;
    el.style.display = 'block';
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateX(0) translateY(0)';
      }, delay);
    });
  };

  // Enhanced message handling with new features
  window.addEventListener('message', (event) => {
    if (event.origin !== CHAT_APP_URL) return;
    
    const iframe = cachedIframe || document.getElementById(iframeId);
    const button = cachedButton || document.getElementById(buttonId);
    const badge = cachedBadge || document.getElementById(badgeId);
    
    if (event.data === 'close-chat') {
      if (iframe) { fadeOut(iframe); isOpen = false; }
      if (button) fadeIn(button);
    } else if (event.data === 'minimize-chat') {
      if (iframe) { fadeOut(iframe); isOpen = false; isMinimized = true; }
      if (button) fadeIn(button);
    } else if (event.data?.type === 'new-message') {
      if (!isOpen && button && badge) {
        hasNewMessage = true;
        badge.style.display = 'flex';
        badge.style.animation = 'pulse 2s infinite';
      }
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      toggleChat();
    }
  });

  const openChat = () => {
    const iframe = cachedIframe || document.getElementById(iframeId);
    const button = cachedButton || document.getElementById(buttonId);
    const welcome = cachedWelcome || document.getElementById(welcomeId);
    const badge = cachedBadge || document.getElementById(badgeId);
    
    if (iframe) { 
      slideIn(iframe); 
      isOpen = true;
      iframe.focus();
    }
    if (welcome) fadeOut(welcome);
    if (badge) {
      badge.style.display = 'none';
      hasNewMessage = false;
    }
    const mq = window.matchMedia('(max-width: 475px)');
    if (mq.matches && button) fadeOut(button);
  };

  const toggleChat = () => {
    if (isOpen) {
      const iframe = cachedIframe || document.getElementById(iframeId);
      const button = cachedButton || document.getElementById(buttonId);
      if (iframe) { fadeOut(iframe); isOpen = false; }
      if (button) fadeIn(button);
    } else {
      openChat();
    }
  };

  const init = () => {
    widgetInitialized = true;
    
    // Inject modern CSS animations
    const style = document.createElement('style');
    style.textContent = \`
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      @keyframes slideInRight {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
    \`;
    document.head.appendChild(style);
    
    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.title = language === 'es' ? 'Chat de ayuda' : 'Help chat';
    iframe.setAttribute('aria-label', language === 'es' ? 'Ventana de chat' : 'Chat window');
    iframe.src = CHAT_APP_URL + '/embed/chat?lang=' + encodeURIComponent(config.language) + '&placeholder=' + encodeURIComponent(config.placeholder);
    iframe.style.cssText = 'display:none;opacity:0;position:fixed;border:none;z-index:2147483647;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);transition:opacity 300ms cubic-bezier(0.4,0,0.2,1),transform 300ms cubic-bezier(0.4,0,0.2,1);transform:translateX(20px) translateY(10px) scale(0.95);will-change:transform,opacity;';
    cachedIframe = iframe;
    
    const mq = window.matchMedia('(max-width: 475px)');
    if (mq.matches) {
      iframe.style.cssText += 'width:100vw;height:100vh;bottom:0;right:0;left:0;border-radius:0;';
    } else {
      iframe.style.cssText += 'width:420px;max-width:calc(100vw - 40px);height:650px;max-height:calc(100vh - 100px);border-radius:16px;bottom:90px;';
      iframe.style[config.position === 'bottom-right' ? 'right' : 'left'] = '20px';
    }
    document.body.appendChild(iframe);

    if (config.showWelcomeMessage) {
      const welcome = document.createElement('div');
      welcome.id = welcomeId;
      welcome.setAttribute('role', 'button');
      welcome.setAttribute('aria-label', language === 'es' ? 'Abrir chat' : 'Open chat');
      welcome.style.cssText = 'display:none;opacity:0;position:fixed;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;width:300px;max-width:calc(100vw - 100px);border-radius:16px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);padding:1.25rem 2.5rem 1.25rem 1.25rem;font-size:0.95rem;line-height:1.6;background:linear-gradient(135deg,#ffffff 0%,#f9fafb 100%);color:#1f2937;z-index:2147483647;cursor:pointer;transition:all 300ms cubic-bezier(0.4,0,0.2,1);transform:translateY(10px) scale(0.95);bottom:90px;border:1px solid rgba(0,0,0,0.05);backdrop-filter:blur(10px);';
      welcome.style[config.position === 'bottom-right' ? 'right' : 'left'] = '100px';
      welcome.onclick = openChat;
      welcome.onmouseenter = () => {
        welcome.style.transform = 'translateY(-2px) scale(1)';
        welcome.style.boxShadow = '0 25px 30px -5px rgba(0,0,0,0.15),0 15px 15px -5px rgba(0,0,0,0.06)';
      };
      welcome.onmouseleave = () => {
        welcome.style.transform = 'translateY(0) scale(1)';
        welcome.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)';
      };
      cachedWelcome = welcome;

      if (config.welcomeGif) {
        const gif = document.createElement('img');
        gif.src = config.welcomeGif;
        gif.style.cssText = 'width:100%;max-width:150px;height:auto;margin-bottom:0.5rem;border-radius:8px;';
        welcome.appendChild(gif);
      }

      const text = document.createElement('div');
      text.textContent = config.welcomeMessage;
      welcome.appendChild(text);

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', language === 'es' ? 'Cerrar mensaje' : 'Close message');
      closeBtn.style.cssText = 'position:absolute;top:0.75rem;right:0.75rem;background:rgba(107,114,128,0.1);border:none;font-size:1.5rem;cursor:pointer;color:#6B7280;padding:0;width:28px;height:28px;border-radius:50%;transition:all 200ms;display:flex;align-items:center;justify-content:center;';
      closeBtn.onmouseenter = () => {
        closeBtn.style.background = 'rgba(107,114,128,0.2)';
        closeBtn.style.transform = 'rotate(90deg)';
      };
      closeBtn.onmouseleave = () => {
        closeBtn.style.background = 'rgba(107,114,128,0.1)';
        closeBtn.style.transform = 'rotate(0deg)';
      };
      closeBtn.onclick = (e) => { e.stopPropagation(); fadeOut(welcome); };
      welcome.appendChild(closeBtn);
      document.body.appendChild(welcome);
      setTimeout(() => slideIn(welcome), 1500);
    }

    const button = document.createElement('button');
    button.id = buttonId;
    button.setAttribute('aria-label', language === 'es' ? 'Abrir chat de ayuda' : 'Open help chat');
    button.setAttribute('role', 'button');
    button.setAttribute('aria-expanded', 'false');
    
    // Use custom icon (emoji or text) if provided, otherwise use default chat SVG
    if (config.botIcon) {
      button.innerHTML = '<span style="font-size:32px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));">' + config.botIcon + '</span>';
    } else {
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    }
    
    button.style.cssText = 'display:flex;align-items:center;justify-content:center;opacity:0;position:fixed;z-index:2147483647;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,' + config.buttonColor + ' 0%,' + config.buttonColor + 'dd 100%);color:white;border:none;cursor:pointer;box-shadow:0 8px 16px rgba(0,0,0,0.15),0 0 0 0 ' + config.buttonColor + '40;transition:all 300ms cubic-bezier(0.4,0,0.2,1);transform:scale(' + config.buttonSize + ') translateY(20px);transform-origin:bottom ' + (config.position === 'bottom-right' ? 'right' : 'left') + ';bottom:20px;padding:0;animation:slideInRight 500ms ease-out forwards;will-change:transform;';
    button.style[config.position === 'bottom-right' ? 'right' : 'left'] = '20px';
    
    button.onmouseenter = () => { 
      button.style.transform = 'scale(' + (config.buttonSize * 1.15) + ') translateY(-2px)'; 
      button.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2),0 0 0 8px ' + config.buttonColor + '20';
    };
    button.onmouseleave = () => { 
      button.style.transform = 'scale(' + config.buttonSize + ') translateY(0)'; 
      button.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15),0 0 0 0 ' + config.buttonColor + '40';
    };
    button.onclick = () => {
      toggleChat();
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };
    
    cachedButton = button;
    document.body.appendChild(button);
    
    // Add notification badge
    const badge = document.createElement('div');
    badge.id = badgeId;
    badge.style.cssText = 'display:none;position:fixed;z-index:2147483648;width:20px;height:20px;border-radius:50%;background:#ef4444;color:white;font-size:11px;font-weight:bold;align-items:center;justify-content:center;bottom:54px;border:2px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4);';
    badge.style[config.position === 'bottom-right' ? 'right' : 'left'] = '54px';
    cachedBadge = badge;
    document.body.appendChild(badge);

    if (config.autoOpen) setTimeout(openChat, config.openDelay);
  };

  // Wait for page to be fully loaded to prevent layout shifts
  if (document.readyState === 'complete') {
    // Page already loaded, init immediately
    init();
  } else if (document.readyState === 'interactive') {
    // DOM ready but resources still loading, wait for full load
    window.addEventListener('load', init);
  } else {
    // Still loading, wait for full load
    window.addEventListener('load', init);
  }
})();
`;

  return new NextResponse(embedScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
