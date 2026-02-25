import * as StellarSdk from '@stellar/stellar-sdk';
import { getServer, getNetworkPassphrase, keypairFromSecret } from './client';
import type { TransactionResult } from '@/types/stellar';

export async function setAccountData(
  secretKey: string,
  key: string,
  value: string
): Promise<TransactionResult> {
  try {
    const server = getServer();
    const keypair = keypairFromSecret(secretKey);
    const account = await server.loadAccount(keypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: key,
          value: value,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function setMemberIdentity(
  secretKey: string,
  name: string,
  communityPublicKey: string,
  role: string
): Promise<TransactionResult> {
  try {
    const server = getServer();
    const keypair = keypairFromSecret(secretKey);
    const account = await server.loadAccount(keypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(
        StellarSdk.Operation.manageData({ name: 'amaruid:name', value: name })
      )
      .addOperation(
        StellarSdk.Operation.manageData({ name: 'amaruid:community', value: communityPublicKey })
      )
      .addOperation(
        StellarSdk.Operation.manageData({ name: 'amaruid:role', value: role })
      )
      .addOperation(
        StellarSdk.Operation.manageData({
          name: 'amaruid:created',
          value: new Date().toISOString(),
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function recordAction(
  secretKey: string,
  actionId: string,
  category: string,
  description: string
): Promise<TransactionResult> {
  try {
    const server = getServer();
    const keypair = keypairFromSecret(secretKey);
    const account = await server.loadAccount(keypair.publicKey());

    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `action:${actionId}:cat`,
          value: category,
        })
      )
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `action:${actionId}:desc`,
          value: description.substring(0, 64),
        })
      )
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `action:${actionId}:time`,
          value: new Date().toISOString(),
        })
      )
      .setTimeout(30)
      .build();

    txBuilder.sign(keypair);
    const result = await server.submitTransaction(txBuilder);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
