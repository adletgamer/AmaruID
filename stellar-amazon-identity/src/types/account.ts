export type AccountRole = 'community' | 'leader' | 'member';

export interface CommunityAccount {
  id: string;
  publicKey: string;
  name: string;
  description: string;
  role: 'community';
  signers: string[];
  thresholdLow: number;
  thresholdMed: number;
  thresholdHigh: number;
  createdAt: string;
  funded: boolean;
}

export interface LeaderAccount {
  id: string;
  publicKey: string;
  secretKey: string;
  name: string;
  role: 'leader';
  communityId: string;
  createdAt: string;
  funded: boolean;
}

export interface MemberAccount {
  id: string;
  publicKey: string;
  secretKey: string;
  name: string;
  role: 'member';
  communityId: string;
  certified: boolean;
  certifiedAt?: string;
  createdAt: string;
  funded: boolean;
}

export type AnyAccount = CommunityAccount | LeaderAccount | MemberAccount;

export interface AccountSetupState {
  step: 1 | 2 | 3;
  community?: CommunityAccount;
  leaders: LeaderAccount[];
  members: MemberAccount[];
}
