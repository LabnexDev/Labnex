import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = false,
  animate = true,
}) => {
  const baseClasses = `bg-slate-700/50 ${animate ? 'animate-pulse' : ''}`;
  const shapeClasses = rounded ? 'rounded-full' : 'rounded';
  
  return (
    <div
      className={`${baseClasses} ${shapeClasses} ${height} ${width} ${className}`}
      role="status"
      aria-label="Loading content"
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`} role="status" aria-label="Loading text">
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        height="h-4"
        width={i === lines - 1 ? 'w-3/4' : 'w-full'}
        className="last:w-3/4"
      />
    ))}
  </div>
);

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showAvatar = false,
  showTitle = true,
  showDescription = true,
  showActions = false,
}) => (
  <div 
    className={`p-4 border border-slate-700/50 rounded-lg bg-slate-800/30 ${className}`}
    role="status"
    aria-label="Loading card"
  >
    {showAvatar && (
      <div className="flex items-center mb-4">
        <Skeleton height="h-10" width="w-10" rounded className="mr-3" />
        <div className="flex-1">
          <Skeleton height="h-4" width="w-24" className="mb-1" />
          <Skeleton height="h-3" width="w-16" />
        </div>
      </div>
    )}
    
    {showTitle && (
      <Skeleton height="h-6" width="w-3/4" className="mb-3" />
    )}
    
    {showDescription && (
      <SkeletonText lines={2} className="mb-4" />
    )}
    
    {showActions && (
      <div className="flex gap-2">
        <Skeleton height="h-8" width="w-20" />
        <Skeleton height="h-8" width="w-16" />
      </div>
    )}
  </div>
);

interface SkeletonListProps {
  items?: number;
  className?: string;
  itemClassName?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  className = '',
  itemClassName = '',
}) => (
  <div className={`space-y-4 ${className}`} role="status" aria-label="Loading list">
    {Array.from({ length: items }, (_, i) => (
      <SkeletonCard
        key={i}
        className={itemClassName}
        showAvatar={i % 2 === 0}
        showActions={i % 3 === 0}
      />
    ))}
  </div>
);

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => (
  <div className={`space-y-4 ${className}`} role="status" aria-label="Loading table">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={`header-${i}`} height="h-6" width="w-full" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div 
        key={`row-${rowIndex}`} 
        className="grid gap-4" 
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            height="h-4" 
            width={colIndex === 0 ? 'w-3/4' : 'w-full'} 
          />
        ))}
      </div>
    ))}
  </div>
);

// Preset skeleton layouts for common use cases
export const ProjectCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonCard
    className={`h-48 ${className}`}
    showTitle
    showDescription
    showActions
  />
);

export const TaskListSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonList
    items={6}
    className={className}
    itemClassName="h-24"
  />
);

export const UserProfileSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 ${className}`} role="status" aria-label="Loading profile">
    <div className="flex items-center mb-6">
      <Skeleton height="h-16" width="w-16" rounded className="mr-4" />
      <div className="flex-1">
        <Skeleton height="h-6" width="w-48" className="mb-2" />
        <Skeleton height="h-4" width="w-32" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

// Default export
export default Skeleton; 