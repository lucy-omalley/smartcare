import { atom } from 'jotai';
import { Theme } from '@/lib/themes';

export const themeAtom = atom<Theme>('default'); 