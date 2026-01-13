import Script from "next/script";

export default function TestWidgetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Widget Test Page</h1>
        <p className="text-slate-300 mb-8">
          This page tests the embedded chat widget. You should see the floating
          button in the bottom-right corner with the Statue of Liberty icon.
        </p>

        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Checklist:</h2>
          <ul className="space-y-2 text-slate-300">
            <li>✓ Floating button should show custom icon (Statue of Liberty)</li>
            <li>✓ Click button to open chat</li>
            <li>✓ Chat header should show custom icon</li>
            <li>✓ No welcome popup should appear by default</li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Direct Links:</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="/embed/chat"
                target="_blank"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                /embed/chat - Chat iframe directly
              </a>
            </li>
            <li>
              <a
                href="/images/chatbot-icon.jpg"
                target="_blank"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                /images/chatbot-icon.jpg - Icon image
              </a>
            </li>
            <li>
              <a
                href="/api/embed/settings"
                target="_blank"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                /api/embed/settings - Settings API
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Load the embed widget */}
      <Script
        src="/api/embed"
        strategy="lazyOnload"
      />
    </div>
  );
}
