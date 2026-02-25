import * as StellarSdk from '@stellar/stellar-sdk';
import { getServer, getNetworkPassphrase, keypairFromSecret } from './client';
import type { TransactionResult } from '@/types/stellar';

export const COMMCERT_CODE = 'COMMCERT';

export async function createTrustline(
  receiverSecretKey: string,
  assetCode: string,
  issuerPublicKey: string
): Promise<TransactionResult> {
  try {
    const server = getServer();
    const receiverKeypair = keypairFromSecret(receiverSecretKey);
    const account = await server.loadAccount(receiverKeypair.publicKey());
    const asset = new StellarSdk.Asset(assetCode, issuerPublicKey);

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset }))
      .setTimeout(30)
      .build();

    transaction.sign(receiverKeypair);
    const result = await server.submitTransaction(transaction);

    return { success: true, hash: result.hash, ledger: result.ledger };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating trustline',
    };
  }
}

export async function issueCertificate(
  issuerSecretKeys: string[],
  memberPublicKey: string,
  issuerPublicKey: string,
  amount: string = '1'
): Promise<TransactionResult> {
  try {
    const server = getServer();
    const asset = new StellarSdk.Asset(COMMCERT_CODE, issuerPublicKey);
    const sourceAccount = await server.loadAccount(issuerPublicKey);

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: memberPublicKey,
          asset: asset,
          amount: amount,
        })
      )
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `cert:${memberPublicKey.substring(0, 8)}:date`,
          value: new Date().toISOString(),
        })
      )
      .setTimeout(30)
      .build();

    // Sign with all provided leader keys (multisig)
    for (const secret of issuerSecretKeys) {
      const kp = keypairFromSecret(secret);
      transaction.sign(kp);
    }

    const result = await server.submitTransaction(transaction);
    return { success: true, hash: result.hash, ledger: result.ledger };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error issuing certificate',
    };
  }
}

export async function hasCertificate(
  memberPublicKey: string,
  issuerPublicKey: string
): Promise<boolean> {
  try {
    const server = getServer();
    const account = await server.loadAccount(memberPublicKey);
    return account.balances.some(
      (b: StellarSdk.Horizon.HorizonApi.BalanceLine) =>
        'asset_code' in b &&
        b.asset_code === COMMCERT_CODE &&
        'asset_issuer' in b &&
        b.asset_issuer === issuerPublicKey &&
        parseFloat(b.balance) > 0
    );
  } catch {
    return false;
  }
}
