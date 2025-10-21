'use client';

import { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';

interface TagInputProps {
  tags: string[];
  suggestions?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  tags,
  suggestions = [],
  onAddTag,
  onRemoveTag,
  placeholder = 'Add tags...',
  className = '',
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const trimmedTag = input.trim();

      // Avoid duplicate tags
      if (!tags.includes(trimmedTag)) {
        onAddTag(trimmedTag);
      }

      setInput('');
      setShowSuggestions(false);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowSuggestions(value.trim().length > 0 && suggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      onAddTag(suggestion);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(suggestion)
  );

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="hover:text-blue-900 dark:hover:text-blue-100"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(input.trim().length > 0 && suggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
