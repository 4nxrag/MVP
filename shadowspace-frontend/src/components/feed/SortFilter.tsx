import React from 'react';
import { usePostStore } from '../../store/usePostStore';

const SortFilter: React.FC = () => {
  const { currentSort, setSortOption } = usePostStore();

  const sortOptions = [
    { value: 'recent', label: '🕐 Newest', description: 'Most recent posts first' },
    { value: 'top', label: '⬆️ Top Voted', description: 'Most upvoted posts first' },
    { value: 'viewed', label: '👁 Most Viewed', description: 'Most seen posts first' },
    { value: 'trending', label: '🔥 Trending', description: 'Hot posts with recent engagement' }
  ];

  return (
    <div className="glass-card p-4 mb-6">
      <h3 className="text-white text-sm font-medium mb-3">Sort Posts</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSortOption(option.value)}
            className={`glass-button p-3 text-sm transition-all duration-300 ${
              currentSort === option.value
                ? 'bg-green-500 bg-opacity-20 border-green-400 border-opacity-50 text-green-300'
                : 'text-gray-300 hover:text-white'
            }`}
            title={option.description}
          >
            <div className="font-medium">{option.label}</div>
          </button>
        ))}
      </div>
      
      {/* Show current sort description */}
      <div className="mt-3 text-xs text-gray-400 text-center">
        {sortOptions.find(opt => opt.value === currentSort)?.description}
      </div>
    </div>
  );
};

export default SortFilter;
