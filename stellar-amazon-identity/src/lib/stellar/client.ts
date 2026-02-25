import * as StellarSdk from '@stellar/stellar-sdk';
import type { StellarConfig, StellarAccountInfo, StellarKeypair } from '@/types/stellar';

const DEFAULT_CONFIG: StellarConfig = {
  network: 'testnet',
  horizonUrl: import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  friendbotUrl: import.meta.env.VITE_STELLAR_FRIENDBOT_URL || 'https://friendbot.stellar.org',
};

let serverInstance: StellarSdk.Horizon.Server | null = null;

export function getConfig(): StellarConfig {
  return DEFAULT_CONFIG;
}

export function getServer(): StellarSdk.Horizon.Server {
  if (!serverInstance) {
    serverInstance = new StellarSdk.Horizon.Server(DEFAULT_CONFIG.horizonUrl);
  }
  return serverInstance;
}

export function getNetworkPassphrase(): string {
  return DEFAULT_CONFIG.network === 'testnet'
    ? StellarSdk.Networks.TESTNET
    : StellarSdk.Networks.PUBLIC;
}

export function generateKeypair(): StellarKeypair {
  const pair = StellarSdk.Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

export function keypairFromSecret(secret: string): StellarSdk.Keypair {
  return StellarSdk.Keypair.fromSecret(secret);
}

export async function fundAccount(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${DEFAULT_CONFIG.friendbotUrl}?addr=${publicKey}`);
    if (!response.ok) {
      const text = await response.text();
      console.error('Friendbot error:', text);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to fund account:', error);
    return false;
  }
}

export async function getAccountInfo(publicKey: string): Promise<StellarAccountInfo | null> {
  try {
    const server = getServer();
    const account = await server.loadAccount(publicKey);
    return {
      id: account.id,
      sequence: account.sequenceNumber(),
      balances: account.balances.map((b: StellarSdk.Horizon.HorizonApi.BalanceLine) => ({
        asset_type: b.asset_type,
        asset_code: 'asset_code' in b ? b.asset_code : undefined,
        asset_issuer: 'asset_issuer' in b ? b.asset_issuer : undefined,
        balance: b.balance,
      })),
      signers: account.signers.map((s: StellarSdk.Horizon.HorizonApi.AccountSigner) => ({
        key: s.key,
        weight: s.weight,
        type: s.type,
      })),
      thresholds: {
        low_threshold: account.thresholds.low_threshold,
        med_threshold: account.thresholds.med_threshold,
        high_threshold: account.thresholds.high_threshold,
      },
      data: account.data_attr || {},
    };
  } catch (error) {
    console.error('Failed to load account:', error);
    return null;
  }
}

export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    const server = getServer();
    await server.loadAccount(publicKey);
    return true;
  } catch {
    return false;
  }
}
