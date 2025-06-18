import React from 'react';
import { commandRegistry } from '../../commands/registry';

interface Props {
  query: string;
  onSelect: (command: string) => void;
}

const SlashCommandAutocomplete: React.FC<Props> = ({ query, onSelect }) => {
  if (!query.startsWith('/')) return null;
  const term = query.slice(1);
  const suggestions = commandRegistry.filter(c => c.name.startsWith(term)).slice(0, 5);
  if (suggestions.length === 0) return null;
  return (
    <div className="absolute bottom-16 left-4 sm:left-6 bg-slate-800 text-slate-100 border border-slate-700 rounded-md shadow-lg w-72 max-h-60 overflow-y-auto z-50">
      {suggestions.map(cmd => (
        <button
          key={cmd.name}
          className="block w-full text-left px-3 py-2 hover:bg-slate-700 focus:outline-none"
          onMouseDown={() => onSelect(cmd.name)}
        >
          <span className="font-semibold">/{cmd.name}</span>
          <span className="ml-2 text-xs text-slate-400">{cmd.description}</span>
        </button>
      ))}
    </div>
  );
};

export default SlashCommandAutocomplete; 