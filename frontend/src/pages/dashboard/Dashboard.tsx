import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDashboardData } from '../../api/projects';
import type { DashboardData, Project } from '../../api/projects';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import OrbBackground from '../../components/visual/OrbBackground';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, colorClass = 'text-blue-400' }) => (
  <div className="card flex flex-col justify-between hover:shadow-glow-blue transition-all duration-300 ease-in-out transform hover:-translate-y-1">
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-lg font-medium ${colorClass}`}>{title}</h3>
        {icon && <span className={`p-2 rounded-lg bg-opacity-20 ${colorClass} bg-current`}>{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
    {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
  </div>
);

export function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative space-y-8 py-4 overflow-hidden">
      <OrbBackground />
      <div className="space-y-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <Button variant="primary" size="md" className="w-full sm:w-auto" >
            <Link to="/projects/new" className="flex items-center">
              Create New Project
            </Link>
          </Button>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to Labnex!</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your streamlined platform for efficient project and test case management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Projects" 
            value={dashboardData?.totalProjects || 0} 
            description={`${dashboardData?.activeProjects || 0} active`}
            colorClass="text-blue-400 dark:text-blue-300"
          />
          <StatCard 
            title="Test Cases" 
            value={dashboardData?.totalTestCases || 0} 
            description="Across all projects"
            colorClass="text-green-400 dark:text-green-300"
          />
          <StatCard 
            title="Team Members" 
            value={dashboardData?.totalTeamMembers || 0} 
            description="Collaborating on Labnex"
            colorClass="text-purple-400 dark:text-purple-300"
          />
          <StatCard 
            title="Active Rate" 
            value={`${((dashboardData?.activeProjects || 0) / (dashboardData?.totalProjects || 1) * 100).toFixed(0)}%`}
            description="Of total projects"
            colorClass="text-teal-400 dark:text-teal-300"
          />
        </div>

        <div className="card p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recently Updated</h2>
            <Link 
              to="/projects" 
              className="group inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-150"
            >
              View All Projects <ArrowRightIcon className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform"/>
            </Link>
          </div>
          <div className="space-y-4">
            {(dashboardData?.recentlyUpdatedProjects && dashboardData.recentlyUpdatedProjects.length > 0) ? (
              dashboardData.recentlyUpdatedProjects.slice(0, 5).map((project: Project) => (
                <div 
                  key={project._id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-gray-800/60 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors duration-150_"
                >
                  <div className="mb-3 sm:mb-0">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                      {project.name}
                      {project.projectCode && <span className="ml-2 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{project.projectCode}</span>}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {project.testCaseCount || 0} test cases
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {project.memberCount || 0} members
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="tertiary" size="sm">
                      <Link to={`/projects/${project._id}`} className="flex items-center">
                          View Details
                      </Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No projects updated recently.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                  <Link to="/projects" className="w-full text-center">View All Projects</Link>
              </Button>
              <Button variant="secondary" className="w-full">
                   <Link to="/projects/new" className="w-full text-center">Create New Project</Link>
              </Button>
            </div>
          </div>
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">API Status:</span>
                <span className="text-sm font-medium text-green-500 dark:text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Database:</span>
                <span className="text-sm font-medium text-green-500 dark:text-green-400">Connected</span>
              </div>
               <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Last Backup:</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Today, 2:00 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 