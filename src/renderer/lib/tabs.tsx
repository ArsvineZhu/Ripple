import { Sun } from 'lucide-react';
import { Search } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Music } from 'lucide-react';
import { Mic } from 'lucide-react';
import { List } from 'lucide-react';
import { Check } from 'lucide-react';
import { Settings } from 'lucide-react';
import { SETTINGS_TAB_ID } from '../../shared/appState';
export const TABS = [
  {
    id: 0,
    nameKey: 'tabSearch' as const,
    icon: (color: string) => <Search size={16} color={color} />,
  },
  {
    id: 1,
    nameKey: 'tabWorkflows' as const,
    icon: (color: string) => <Zap size={16} color={color} />,
  },
  {
    id: 2,
    nameKey: 'tabOverview' as const,
    icon: (color: string) => <Sun size={16} color={color} />,
  },
  {
    id: 3,
    nameKey: 'tabPlaying' as const,
    icon: (color: string) => <Music size={16} color={color} />,
  },
  {
    id: 4,
    nameKey: 'tabAssistant' as const,
    icon: (color: string) => <Mic size={16} color={color} />,
  },
  {
    id: 5,
    nameKey: 'tabClipboard' as const,
    icon: (color: string) => <List size={16} color={color} />,
  },
  {
    id: 6,
    nameKey: 'tabTasks' as const,
    icon: (color: string) => <Check size={16} color={color} />,
  },
  {
    id: SETTINGS_TAB_ID,
    nameKey: 'tabSettings' as const,
    icon: (color: string) => <Settings size={16} color={color} />,
  },
];
