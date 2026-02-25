import * as StellarSdk from '@stellar/stellar-sdk';
import { getServer, getNetworkPassphrase, keypairFromSecret } from './client';
import type { TransactionResult } from '@/types/stellar';

export interface MultisigSetupParams {
  communitySecretKey: string;
  leaderPublicKeys: string[];
  thresholdLow: number;
  thresholdMed: number;
  thresholdHigh: number;
}

export async function setupMultisig(params: MultisigSetupParams): Promise<TransactionResult> {
  try {
    const server = getServer();
    const communityKeypair = keypairFromSecret(params.communitySecretKey);
    const account = await server.loadAccount(communityKeypair.publicKey());

    const builder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    });

    // Add each leader as a signer with weight 1
    for (const leaderPK of params.leaderPublicKeys) {
      builder.addOperation(
        StellarSdk.Operation.setOptions({
          signer: {
            ed25519PublicKey: leaderPK,
            weight: 1,
          },
        })
      );
    }

    // Set thresholds and reduce master key weight
    builder.addOperation(
      StellarSdk.Operation.setOptions({
        masterWeight: 0,
        lowThreshold: params.thresholdLow,
        medThreshold: params.thresholdMed,
        highThreshold: params.thresholdHigh,
      })
    );

    // Add community identity data
    builder.addOperation(
      StellarSdk.Operation.manageData({
        name: 'amaruid:type',
        value: 'community',
      })
    );

    const transaction = builder.setTimeout(30).build();
    transaction.sign(communityKeypair);
    const result = await server.submitTransaction(transaction);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error setting up multisig',
    };
  }
}

export async function signAndSubmitMultisig(
  transactionXdr: string,
  signerSecretKeys: string[]
): Promise<TransactionResult> {
  try {
    const server = getServer();
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      transactionXdr,
      getNetworkPassphrase()
    ) as StellarSdk.Transaction;

    for (const secretKey of signerSecretKeys) {
      const keypair = keypairFromSecret(secretKey);
      transaction.sign(keypair);
    }

    const result = await server.submitTransaction(transaction);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error submitting multisig tx',
    };
  }
}
