import { useAuth } from '@/hooks/use-auth';

export interface Session {
  user: {
    id: number;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Hook that provides session information based on authentication state
 * This is a wrapper around useAuth to provide a more standardized interface
 */
export function useSession(): Session {
  const { user, isLoading } = useAuth();
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading
  };
}