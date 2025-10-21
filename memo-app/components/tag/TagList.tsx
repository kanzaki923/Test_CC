'use client';

import { Tag } from '@/lib/types';

interface TagListProps {
  tags: Tag[];
  selectedTagNames?: string[];
  onTagClick?: (tagName: string) => void;
  showCount?: boolean;
  getTagCount?: (tagName: string) => number;
  className?: string;
}

export function TagList({
  tags,
  selectedTagNames = [],
  onTagClick,
  showCount = true,
  getTagCount,
  className = '',
}: TagListProps) {
  if (tags.length === 0) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        No tags yet
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => {
        const isSelected = selectedTagNames.includes(tag.name);
        const count = showCount && getTagCount ? getTagCount(tag.name) : null;

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onTagClick?.(tag.name)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200
              ${
                isSelected
                  ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900'
                  : 'hover:scale-105'
              }
              ${onTagClick ? 'cursor-pointer' : 'cursor-default'}
            `}
            style={{
              backgroundColor: tag.color + '20',
              color: tag.color,
              borderColor: tag.color,
              borderWidth: '1px',
              ...(isSelected && { ringColor: tag.color }),
            }}
            disabled={!onTagClick}
          >
            <span>{tag.name}</span>
            {count !== null && count > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: tag.color,
                  color: '#fff',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
