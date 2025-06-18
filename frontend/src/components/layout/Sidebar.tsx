import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, FolderIcon, Cog6ToothIcon, QuestionMarkCircleIcon, ShareIcon, BookOpenIcon, CodeBracketSquareIcon, ListBulletIcon, CommandLineIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
// import { useTheme } from '../../contexts/ThemeContext'; // theme and useTheme are unused

// Labnex Logo (simple SVG example, replace with actual logo if available)
const LabnexLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
    <text x="5" y="22" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="currentColor">
      Labnex
    </text>
  </svg>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // const { theme } = useTheme(); // theme is unused
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Labnex AI', href: '/ai', icon: ChatBubbleLeftRightIcon },
    { name: 'CLI Terminal', href: '/cli', icon: CommandLineIcon },
    { name: 'My Tasks', href: '/my-tasks', icon: ListBulletIcon },
    { name: 'Notes', href: '/notes', icon: BookOpenIcon },
    { name: 'Snippets', href: '/snippets', icon: CodeBracketSquareIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    { name: 'Discord Bot', href: '/integrations/discord', icon: ShareIcon },
    { name: 'Documentation', href: '/documentation', icon: QuestionMarkCircleIcon },
    // Example of another item
    // { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon }, 
  ];

  return (
    <>
      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${isOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gradient-to-b dark:from-gray-800 dark:to-gray-900">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:bg-gray-600"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b dark:border-gray-700/50">
            <LabnexLogo className="h-8 w-auto text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
                              hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white
                              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                              ${
                                isActive
                                  ? 'bg-gray-200 dark:bg-blue-600/30 text-gray-900 dark:text-blue-300 shadow-inner dark:shadow-glow-blue-xs'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ease-in-out
                                ${isActive ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div
          className={`flex-1 flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700/50
                    bg-white dark:bg-gradient-to-b dark:from-gray-800 dark:to-gray-900
                    transition-colors duration-300`}
        >
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b dark:border-gray-700/50">
            <LabnexLogo className="h-8 w-auto text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
                              hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white
                              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                              ${
                                isActive
                                  ? 'bg-gray-200 dark:bg-blue-600/30 text-gray-900 dark:text-blue-300 shadow-inner dark:shadow-glow-blue-xs'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ease-in-out
                                ${isActive ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
