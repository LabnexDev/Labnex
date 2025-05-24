import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, FolderIcon, Cog6ToothIcon, QuestionMarkCircleIcon, ShareIcon, BookOpenIcon, CodeBracketSquareIcon, ListBulletIcon, CommandLineIcon } from '@heroicons/react/24/outline';
// import { useTheme } from '../../contexts/ThemeContext'; // theme and useTheme are unused

// Labnex Logo (simple SVG example, replace with actual logo if available)
const LabnexLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
    <text x="5" y="22" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="currentColor">
      Labnex
    </text>
  </svg>
);

export function Sidebar() {
  // const { theme } = useTheme(); // theme is unused
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
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
  );
} 