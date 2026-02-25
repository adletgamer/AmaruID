export interface StellarKeypair {
  publicKey: string;
  secretKey: string;
}

export interface StellarAccountInfo {
  id: string;
  sequence: string;
  balances: StellarBalance[];
  signers: StellarSigner[];
  thresholds: StellarThresholds;
  data: Record<string, string>;
}

export interface StellarBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

export interface StellarSigner {
  key: string;
  weight: number;
  type: string;
}

export interface StellarThresholds {
  low_threshold: number;
  med_threshold: number;
  high_threshold: number;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  ledger?: number;
}

export type NetworkType = 'testnet' | 'public';

export interface StellarConfig {
  network: NetworkType;
  horizonUrl: string;
  friendbotUrl: string;
}
