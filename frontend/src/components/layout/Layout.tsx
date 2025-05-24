import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="fixed inset-y-0 left-0 z-30">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col ml-64">
          <div className="fixed top-0 right-0 left-64 z-20">
            <Header />
          </div>

          <main className="flex-1 mt-16 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 