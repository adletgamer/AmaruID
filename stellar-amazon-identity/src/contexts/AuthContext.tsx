import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AnyAccount, CommunityAccount, LeaderAccount, MemberAccount } from '@/types/account';
import { db } from '@/lib/storage/schema';

interface AuthContextType {
  currentAccount: AnyAccount | null;
  community: CommunityAccount | null;
  leaders: LeaderAccount[];
  members: MemberAccount[];
  selectAccount: (account: AnyAccount) => void;
  clearAccount: () => void;
  refreshAccounts: () => Promise<void>;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<AnyAccount | null>(null);
  const [community, setCommunity] = useState<CommunityAccount | null>(null);
  const [leaders, setLeaders] = useState<LeaderAccount[]>([]);
  const [members, setMembers] = useState<MemberAccount[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshAccounts = useCallback(async () => {
    try {
      const communities = await db.communities.toArray();
      const ldrs = await db.leaders.toArray();
      const mbrs = await db.members.toArray();

      if (communities.length > 0) setCommunity(communities[0]);
      setLeaders(ldrs);
      setMembers(mbrs);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const selectAccount = useCallback((account: AnyAccount) => {
    setCurrentAccount(account);
    localStorage.setItem('amaruid:currentAccount', JSON.stringify(account));
  }, []);

  const clearAccount = useCallback(() => {
    setCurrentAccount(null);
    localStorage.removeItem('amaruid:currentAccount');
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('amaruid:currentAccount');
    if (saved) {
      try {
        setCurrentAccount(JSON.parse(saved));
      } catch {
        localStorage.removeItem('amaruid:currentAccount');
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentAccount,
        community,
        leaders,
        members,
        selectAccount,
        clearAccount,
        refreshAccounts,
        isLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
