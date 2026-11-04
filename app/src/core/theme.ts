import type { EmphasisConfig } from './emphasis';
import type { TypographyConfig } from './typography';
import type { ComponentStyleConfig } from './componentStyle';

export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  highlight: string;
  emphasis?: string;
  emphasisConfig?: EmphasisConfig;
  typographyConfig?: TypographyConfig;
  componentStyleConfig?: ComponentStyleConfig;
  gradient: string;
}

export const THEMES: Record<string, Theme> = {
  emerald: {
    id: 'emerald',
    name: '翠绿',
    primary: '#059669', // emerald-600
    secondary: '#10B981', // emerald-500
    highlight: '#FDE68A', // amber-200
    emphasis: '#CBE6D8', // jade green for minimalist inline emphasis
    gradient: 'linear-gradient(135deg, #059669, #10B981)',
  },
  ocean: {
    id: 'ocean',
    name: '海蓝',
    primary: '#2563EB', // blue-600
    secondary: '#3B82F6', // blue-500
    highlight: '#BFDBFE', // blue-200
    gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)',
  },
  sunset: {
    id: 'sunset',
    name: '日落',
    primary: '#EA580C', // orange-600
    secondary: '#F97316', // orange-500
    highlight: '#FFEDD5', // orange-100
    gradient: 'linear-gradient(135deg, #EA580C, #F97316)',
  },
  royal: {
    id: 'royal',
    name: '皇家紫',
    primary: '#7C3AED', // violet-600
    secondary: '#8B5CF6', // violet-500
    highlight: '#DDD6FE', // violet-200
    gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
  },
  cherry: {
    id: 'cherry',
    name: '樱桃红',
    primary: '#E11D48', // rose-600
    secondary: '#F43F5E', // rose-500
    highlight: '#FECDD3', // rose-200
    gradient: 'linear-gradient(135deg, #E11D48, #F43F5E)',
  }
};

export const DEFAULT_THEME = THEMES.emerald;
