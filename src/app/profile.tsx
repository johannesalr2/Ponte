import { createContext, useContext } from 'react';
import type { Profile } from '@/db/types';

export const ProfileContext = createContext<Profile | null>(null);

/** Perfil ativo; só existe depois do onboarding. */
export function useActiveProfile(): Profile {
  const p = useContext(ProfileContext);
  if (!p) throw new Error('Perfil ausente');
  return p;
}
