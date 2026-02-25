import * as StellarSdk from '@stellar/stellar-sdk';

export function generateKeypair(): { publicKey: string; secretKey: string } {
  const pair = StellarSdk.Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

export function isValidPublicKey(key: string): boolean {
  try {
    StellarSdk.Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export function isValidSecretKey(key: string): boolean {
  try {
    StellarSdk.Keypair.fromSecret(key);
    return true;
  } catch {
    return false;
  }
}

export function publicKeyFromSecret(secret: string): string {
  return StellarSdk.Keypair.fromSecret(secret).publicKey();
}

export function truncateKey(key: string, chars: number = 6): string {
  if (key.length <= chars * 2) return key;
  return `${key.substring(0, chars)}...${key.substring(key.length - chars)}`;
}
