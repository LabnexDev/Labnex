import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { commandRegistry } from '../../commands/registry';
import { CommandLineIcon } from '@heroicons/react/24/outline';

interface Props {
  query: string;
  onSelect: (command: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export interface AutocompleteRef {
  handleExternalKeyDown: (e: React.KeyboardEvent) => boolean;
}

const SlashCommandAutocomplete = forwardRef<AutocompleteRef, Props>(({ query, onSelect, onKeyDown }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  if (!query.startsWith('/')) return null;
  
  const term = query.slice(1).toLowerCase();
  const suggestions = commandRegistry.filter(c => 
    c.name.toLowerCase().includes(term) || 
    c.description.toLowerCase().includes(term)
  ).slice(0, 8);
  
  if (suggestions.length === 0) return null;

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length, term]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex].name);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex].name);
        }
        break;
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Expose the keyboard handler via imperative handle
  useImperativeHandle(ref, () => ({
    handleExternalKeyDown: (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      return ['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key);
    }
  }));

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-[120]">
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-2xl shadow-purple-500/10 max-w-md mx-auto">
        {/* Header */}
        <div className="px-4 py-2 border-b border-slate-600/50 bg-slate-700/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <CommandLineIcon className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Available Commands</span>
            <span className="text-xs text-slate-400 ml-auto">↑↓ navigate • ↵ select</span>
          </div>
        </div>

        {/* Commands */}
        <div className="max-h-64 overflow-y-auto py-1">
          {suggestions.map((cmd, index) => (
            <button
              key={cmd.name}
              className={`block w-full text-left px-4 py-3 transition-all duration-150 ${
                index === selectedIndex 
                  ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-l-2 border-purple-400' 
                  : 'hover:bg-slate-700/50'
              }`}
              onMouseDown={() => onSelect(cmd.name)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start gap-3">
                <span className={`font-mono text-sm font-semibold ${
                  index === selectedIndex ? 'text-purple-300' : 'text-slate-300'
                }`}>
                  /{cmd.name}
                </span>
                <span className={`text-xs leading-5 ${
                  index === selectedIndex ? 'text-slate-200' : 'text-slate-400'
                }`}>
                  {cmd.description}
                </span>
              </div>
              {cmd.args && cmd.args.length > 0 && (
                <div className="mt-1 text-xs text-slate-500 font-mono">
                  {cmd.args.map(arg => `<${arg}>`).join(' ')}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-600/50 bg-slate-700/30 rounded-b-xl">
          <span className="text-xs text-slate-500">
            {suggestions.length} command{suggestions.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>
    </div>
  );
});

SlashCommandAutocomplete.displayName = 'SlashCommandAutocomplete';

export default SlashCommandAutocomplete; 