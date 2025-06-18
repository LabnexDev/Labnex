import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';
import OrbBackground from '../visual/OrbBackground';
import { AIChatProvider } from '../../contexts/AIChatContext';
import { VoiceSettingsProvider } from '../../contexts/VoiceSettingsContext';
import AIChatBubble from '../ai-chat/AIChatBubble';
import AIChatModal from '../ai-chat/AIChatModal';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <VoiceSettingsProvider>
    <AIChatProvider>
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="flex h-screen bg-[var(--lnx-bg)] dark:bg-gray-900">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col md:ml-64">
            <Header onMenuToggle={() => setSidebarOpen(true)} />

            <main className="relative flex-1 mt-16 overflow-x-hidden overflow-y-auto bg-[var(--lnx-bg)] dark:bg-transparent">
              <OrbBackground />
              {location.pathname === '/ai' ? (
                <div className="flex flex-col h-full w-full px-4 py-2">
                  {children}
                </div>
              ) : (
                <div className="relative container mx-auto px-4 sm:px-6 py-8">
                  {children}
                </div>
              )}
            </main>
          </div>

          {/* Show floating chat only if not on full AI page */}
          {location.pathname !== '/ai' && (
            <>
              <AIChatBubble />
              <AIChatModal />
            </>
          )}
        </div>
      </div>
    </AIChatProvider>
    </VoiceSettingsProvider>
  );
}
