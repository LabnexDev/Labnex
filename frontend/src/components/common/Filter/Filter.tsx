// import { FunnelIcon } from '@heroicons/react/24/outline'; // Unused

interface FilterOption {
  value: string;
  label: string;
}

interface FilterProps {
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  selectClassName?: string;
}

export function Filter({ label, options, value, onChange, className = '', selectClassName = '' }: FilterProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg 
                   bg-white dark:bg-gray-800 
                   border border-gray-300 dark:border-gray-600 
                   text-gray-900 dark:text-gray-100 
                   focus:outline-none focus:ring-2 focus:border-transparent 
                   focus:ring-blue-500 dark:focus:ring-blue-500 
                   transition-colors duration-200 ease-in-out 
                   appearance-none pr-8 ${selectClassName}`
                  }
      >
        <option value="" className="text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
} 