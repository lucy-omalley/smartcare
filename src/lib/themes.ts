export type Theme = 'default' | 'warm' | 'cool' | 'nature';

export const themes = {
  default: {
    primary: 'hsl(221 83% 53%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(210 100% 97%)',
    secondaryForeground: 'hsl(221 83% 53%)',
    accent: 'hsl(262 83% 58%)',
    accentForeground: 'hsl(0 0% 100%)',
    muted: 'hsl(210 40% 96.1%)',
    mutedForeground: 'hsl(215.4 16.3% 46.9%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: 'hsl(221 83% 53%)',
  },
  warm: {
    primary: 'hsl(24 95% 53%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(48 96% 89%)',
    secondaryForeground: 'hsl(24 95% 53%)',
    accent: 'hsl(262 83% 58%)',
    accentForeground: 'hsl(0 0% 100%)',
    muted: 'hsl(48 96% 89%)',
    mutedForeground: 'hsl(24 95% 53%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(24 95% 53%)',
    border: 'hsl(48 96% 89%)',
    input: 'hsl(48 96% 89%)',
    ring: 'hsl(24 95% 53%)',
  },
  cool: {
    primary: 'hsl(199 89% 48%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(187 100% 97%)',
    secondaryForeground: 'hsl(199 89% 48%)',
    accent: 'hsl(187 100% 42%)',
    accentForeground: 'hsl(0 0% 100%)',
    muted: 'hsl(187 100% 97%)',
    mutedForeground: 'hsl(199 89% 48%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(199 89% 48%)',
    border: 'hsl(187 100% 97%)',
    input: 'hsl(187 100% 97%)',
    ring: 'hsl(199 89% 48%)',
  },
  nature: {
    primary: 'hsl(142 76% 36%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(142 76% 96%)',
    secondaryForeground: 'hsl(142 76% 36%)',
    accent: 'hsl(35 91% 32%)',
    accentForeground: 'hsl(0 0% 100%)',
    muted: 'hsl(142 76% 96%)',
    mutedForeground: 'hsl(142 76% 36%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(142 76% 36%)',
    border: 'hsl(142 76% 96%)',
    input: 'hsl(142 76% 96%)',
    ring: 'hsl(142 76% 36%)',
  },
} as const;

export const themeNames = {
  default: 'Classic Blue',
  warm: 'Sunset Orange',
  cool: 'Ocean Blue',
  nature: 'Forest Green',
} as const; 