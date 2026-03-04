/**
 * ============================================================================
 * AMARUID - STELLAR ANCHORING LAYER
 * ============================================================================
 * 
 * Anclaje profesional de Merkle Roots en Stellar blockchain.
 * Proporciona prueba inmutable y verificable de lotes de eventos.
 * 
 * ============================================================================
 * ESPECIFICACIÓN DE ANCHORING
 * ============================================================================
 * 
 * 1. OPERACIÓN STELLAR
 *    - Tipo: ManageData
 *    - Key: "MERKLE_ROOT" (constante, verificable)
 *    - Value: Merkle root en hex (64 caracteres)
 * 
 * 2. MEMO
 *    - Formato: "AMARUID:v1:{count}"
 *    - Ejemplo: "AMARUID:v1:25" (25 eventos en el batch)
 * 
 * 3. ANCHOR PROOF COMPLETO
 *    - root: Merkle root
 *    - tx_hash: Hash de transacción Stellar
 *    - ledger: Número de ledger
 *    - network_passphrase: Red usada (testnet/mainnet)
 *    - anchored_at: Timestamp ISO 8601
 *    - event_count: Número de eventos
 *    - version: Versión del protocolo
 * 
 * 4. VERIFICACIÓN
 *    - Cualquiera puede verificar en Stellar Explorer
 *    - Root reproducible desde eventos originales
 *    - Prueba de inclusión para cada evento
 * 
 * @module stellar/anchoring
 * @author AMARUID Team
 * @version 2.0.0
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { getServer, getNetworkPassphrase } from './client';
import { buildMerkleTree, getMerkleProof, type MerkleTree, type MerkleProof } from '../crypto/merkle';
import type { SignedEvent } from '../events/types';

// ============================================================================
// CONSTANTES
// ============================================================================

/** Versión del protocolo de anchoring */
export const ANCHORING_VERSION = '2.0.0';

/** Key para ManageData operation - CRÍTICO: no cambiar */
export const MERKLE_ROOT_KEY = 'MERKLE_ROOT';

/** Prefijo para memo */
export const MEMO_PREFIX = 'AMARUID:v1';

/** URL base de Stellar Explorer (testnet) */
export const STELLAR_EXPLORER_TESTNET = 'https://stellar.expert/explorer/testnet';

/** URL base de Stellar Explorer (mainnet) */
export const STELLAR_EXPLORER_MAINNET = 'https://stellar.expert/explorer/public';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Prueba de anclaje completa y verificable.
 */
export interface AnchorProof {
  /** Merkle root anclado */
  root: string;
  /** Hash de transacción Stellar */
  tx_hash: string;
  /** Número de ledger donde se ancló */
  ledger: number;
  /** Network passphrase usada */
  network_passphrase: string;
  /** Timestamp de anclaje (ISO 8601) */
  anchored_at: string;
  /** Número de eventos en el batch */
  event_count: number;
  /** Hashes de eventos incluidos */
  event_hashes: string[];
  /** Versión del protocolo */
  version: string;
  /** URL para verificar en Explorer */
  explorer_url: string;
}

/**
 * Resultado de operación de anchoring.
 */
export interface AnchorResult {
  success: boolean;
  proof?: AnchorProof;
  error?: string;
  /** Detalles técnicos para debugging */
  details?: {
    operation_type: string;
    data_key: string;
    memo: string;
    fee: string;
  };
}

/**
 * Resultado de verificación de anchor.
 */
export interface AnchorVerificationResult {
  /** Si el anchor es válido */
  verified: boolean;
  /** Root encontrado en la transacción */
  found_root?: string;
  /** Root esperado */
  expected_root?: string;
  /** Ledger de la transacción */
  ledger?: number;
  /** Timestamp de la transacción */
  timestamp?: string;
  /** Error si la verificación falló */
  error?: string;
}

/**
 * Prueba completa de un evento (Merkle + Anchor).
 */
export interface EventInclusionProof {
  /** ID del evento */
  event_id: string;
  /** Hash del evento */
  event_hash: string;
  /** Prueba Merkle */
  merkle_proof: MerkleProof;
  /** Prueba de anchor */
  anchor_proof: AnchorProof;
  /** Si la prueba es verificable */
  verifiable: boolean;
}

// ============================================================================
// FUNCIONES DE ANCHORING
// ============================================================================

/**
 * Determina la URL del Explorer según la red.
 */
function getExplorerUrl(txHash: string): string {
  const passphrase = getNetworkPassphrase();
  const isTestnet = passphrase.includes('Test');
  const baseUrl = isTestnet ? STELLAR_EXPLORER_TESTNET : STELLAR_EXPLORER_MAINNET;
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Ancla un lote de eventos en Stellar blockchain.
 * 
 * OPERACIÓN:
 * - ManageData con key "MERKLE_ROOT" y value = merkle root hex
 * - Memo con formato "AMARUID:v1:{count}"
 * 
 * @param events - Eventos a anclar
 * @param signerKeypair - Keypair para firmar la transacción
 * @returns Resultado con prueba de anclaje
 * 
 * @example
 * const result = await anchorToStellar(events, keypair);
 * if (result.success) {
 *   console.log('Anchored at:', result.proof.explorer_url);
 * }
 */
export async function anchorToStellar(
  events: SignedEvent[],
  signerKeypair: StellarSdk.Keypair
): Promise<AnchorResult> {
  if (events.length === 0) {
    return { success: false, error: 'No events to anchor' };
  }

  const networkPassphrase = getNetworkPassphrase();
  const memo = `${MEMO_PREFIX}:${events.length}`;

  try {
    const eventHashes = events.map(e => e.metadata_hash);
    const merkleTree = await buildMerkleTree(eventHashes);
    const merkleRoot = merkleTree.root;

    const server = getServer();
    const account = await server.loadAccount(signerKeypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: MERKLE_ROOT_KEY,
          value: merkleRoot,
        })
      )
      .addMemo(StellarSdk.Memo.text(memo))
      .setTimeout(30)
      .build();

    transaction.sign(signerKeypair);

    const result = await server.submitTransaction(transaction);

    const proof: AnchorProof = {
      root: merkleRoot,
      tx_hash: result.hash,
      ledger: result.ledger,
      network_passphrase: networkPassphrase,
      anchored_at: new Date().toISOString(),
      event_count: events.length,
      event_hashes: eventHashes,
      version: ANCHORING_VERSION,
      explorer_url: getExplorerUrl(result.hash),
    };

    return { 
      success: true, 
      proof,
      details: {
        operation_type: 'ManageData',
        data_key: MERKLE_ROOT_KEY,
        memo,
        fee: StellarSdk.BASE_FEE,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

/**
 * Verifica un anchor en Stellar blockchain.
 * 
 * Busca la operación ManageData con key "MERKLE_ROOT" y compara
 * el valor con el root esperado.
 * 
 * @param txHash - Hash de la transacción a verificar
 * @param expectedRoot - Merkle root esperado
 * @returns Resultado detallado de la verificación
 */
export async function verifyAnchor(
  txHash: string,
  expectedRoot: string
): Promise<AnchorVerificationResult> {
  try {
    const server = getServer();
    const transaction = await server.transactions().transaction(txHash).call();

    const operations = await server
      .operations()
      .forTransaction(txHash)
      .call();

    for (const op of operations.records) {
      if (op.type === 'manage_data') {
        const manageDataOp = op as StellarSdk.Horizon.ServerApi.ManageDataOperationRecord;
        if (manageDataOp.name === MERKLE_ROOT_KEY) {
          const storedValue = manageDataOp.value 
            ? atob(manageDataOp.value as unknown as string)
            : null;
          
          if (storedValue === expectedRoot) {
            return { 
              verified: true,
              found_root: storedValue,
              expected_root: expectedRoot,
              ledger: transaction.ledger as unknown as number,
              timestamp: transaction.created_at,
            };
          } else {
            return { 
              verified: false,
              found_root: storedValue || undefined,
              expected_root: expectedRoot,
              error: `Root mismatch: expected ${expectedRoot}, got ${storedValue}`,
            };
          }
        }
      }
    }

    return { verified: false, error: 'No MERKLE_ROOT data found in transaction' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { verified: false, error: errorMessage };
  }
}

/**
 * Verifica un AnchorProof completo.
 * Combina verificación de transacción + reproducción de Merkle root.
 * 
 * @param proof - Prueba de anchor a verificar
 * @param events - Eventos originales (opcional, para verificar root)
 * @returns Resultado de verificación
 */
export async function verifyAnchorProof(
  proof: AnchorProof,
  events?: SignedEvent[]
): Promise<AnchorVerificationResult> {
  // 1. Verificar en blockchain
  const blockchainResult = await verifyAnchor(proof.tx_hash, proof.root);
  
  if (!blockchainResult.verified) {
    return blockchainResult;
  }
  
  // 2. Si se proporcionan eventos, verificar que el root es reproducible
  if (events) {
    const eventHashes = events.map(e => e.metadata_hash);
    const tree = await buildMerkleTree(eventHashes);
    
    if (tree.root !== proof.root) {
      return {
        verified: false,
        found_root: proof.root,
        expected_root: tree.root,
        error: 'Merkle root is not reproducible from provided events',
      };
    }
  }
  
  return blockchainResult;
}

export async function getEventProof(
  event: SignedEvent,
  allEvents: SignedEvent[]
): Promise<{ proof: MerkleProof; tree: MerkleTree } | null> {
  const eventHashes = allEvents.map(e => e.metadata_hash);
  const tree = await buildMerkleTree(eventHashes);
  const proof = getMerkleProof(tree, event.metadata_hash);
  
  if (!proof) {
    return null;
  }
  
  return { proof, tree };
}

export async function createAnchorBatch(
  events: SignedEvent[],
  signerKeypair: StellarSdk.Keypair
): Promise<{
  result: AnchorResult;
  proofs: Map<string, MerkleProof>;
}> {
  const result = await anchorToStellar(events, signerKeypair);
  const proofs = new Map<string, MerkleProof>();

  if (result.success && result.proof) {
    const eventHashes = events.map(e => e.metadata_hash);
    const tree = await buildMerkleTree(eventHashes);

    for (const event of events) {
      const proof = getMerkleProof(tree, event.metadata_hash);
      if (proof) {
        proofs.set(event.id, proof);
      }
    }
  }

  return { result, proofs };
}

export function serializeAnchorProof(proof: AnchorProof): string {
  return JSON.stringify(proof);
}

export function deserializeAnchorProof(data: string): AnchorProof {
  return JSON.parse(data) as AnchorProof;
}
