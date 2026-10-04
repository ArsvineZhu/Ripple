import { Sun } from 'lucide-react';
import { Search } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Music } from 'lucide-react';
import { Mic } from 'lucide-react';
import { List } from 'lucide-react';
import { Check } from 'lucide-react';
import { Settings } from 'lucide-react';
export const TABS = [
  { id: 0, name: 'Browser Search', icon: (color: string) => <Search size={16} color={color} /> },
  { id: 1, name: 'Workflows & QA', icon: (color: string) => <Zap size={16} color={color} /> },
  { id: 2, name: 'Overview', icon: (color: string) => <Sun size={16} color={color} /> },
  { id: 3, name: 'Now Playing', icon: (color: string) => <Music size={16} color={color} /> },
  { id: 4, name: 'AI Assistant', icon: (color: string) => <Mic size={16} color={color} /> },
  { id: 5, name: 'Clipboard', icon: (color: string) => <List size={16} color={color} /> },
  { id: 6, name: 'Tasks', icon: (color: string) => <Check size={16} color={color} /> },
  { id: 7, name: 'Settings', icon: (color: string) => <Settings size={16} color={color} /> },
];
