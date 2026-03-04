/**
 * ============================================================================
 * AMARUID - MERKLE TREE IMPLEMENTATION
 * ============================================================================
 * 
 * Implementación de Merkle Tree para el Anchoring Layer.
 * Permite agrupar múltiples eventos en un solo anchor de blockchain.
 * 
 * ============================================================================
 * ESPECIFICACIÓN
 * ============================================================================
 * 
 * 1. ORDENAMIENTO DE HOJAS
 *    - Las hojas se ordenan LEXICOGRÁFICAMENTE antes de construir el árbol
 *    - Esto previene manipulación por orden de inserción
 *    - Garantiza que el mismo conjunto de eventos produce el mismo root
 * 
 * 2. ALGORITMO DE HASH
 *    - Hash function: SHA-256
 *    - Parent hash: SHA-256(left_child || right_child)
 *    - Si número impar de nodos, el último se duplica
 * 
 * 3. ESTRUCTURA DE PRUEBA
 *    - Cada paso incluye: hash del hermano + posición (left/right)
 *    - Verificación: reconstruir path hasta root
 * 
 * 4. PROPIEDADES DE SEGURIDAD
 *    - Collision resistance: heredada de SHA-256
 *    - Tamper evidence: cualquier cambio altera el root
 *    - Proof of inclusion: O(log n) verificación
 * 
 * @module crypto/merkle
 * @author AMARUID Team
 * @version 2.0.0
 */

import { sha256Bytes, bytesToHex, hexToBytes, concatBytes } from './hash';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Estructura completa del árbol Merkle.
 */
export interface MerkleTree {
  /** Hojas del árbol (ordenadas lexicográficamente) */
  leaves: string[];
  /** Raíz del árbol */
  root: string;
  /** Todas las capas del árbol (desde hojas hasta raíz) */
  layers: string[][];
  /** Metadata del árbol */
  metadata: {
    /** Número de hojas */
    leafCount: number;
    /** Altura del árbol */
    height: number;
    /** Timestamp de creación */
    createdAt: number;
    /** Versión del algoritmo */
    version: string;
  };
}

/**
 * Prueba de inclusión en el árbol Merkle.
 */
export interface MerkleProof {
  /** Hash de la hoja a probar */
  leaf: string;
  /** Índice de la hoja en el árbol */
  leafIndex: number;
  /** Pasos de la prueba */
  proof: MerkleProofStep[];
  /** Raíz del árbol */
  root: string;
  /** Número total de hojas */
  leafCount: number;
}

/**
 * Un paso en la prueba de Merkle.
 */
export interface MerkleProofStep {
  /** Hash del nodo hermano */
  hash: string;
  /** Posición del hermano (left = hermano está a la izquierda) */
  position: 'left' | 'right';
}

/**
 * Resultado de verificación de prueba.
 */
export interface MerkleVerificationResult {
  /** Si la prueba es válida */
  valid: boolean;
  /** Hash computado (debe coincidir con root si es válido) */
  computedRoot: string;
  /** Root esperado */
  expectedRoot: string;
  /** Pasos de verificación para debugging */
  steps: { input: string; sibling: string; output: string }[];
  /** Error si la verificación falló */
  error?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Versión del algoritmo Merkle */
export const MERKLE_VERSION = '2.0.0';

/** Algoritmo de hash usado */
export const MERKLE_HASH_ALGORITHM = 'SHA-256';

// ============================================================================
// FUNCIONES INTERNAS
// ============================================================================

/**
 * Calcula el hash de un par de nodos.
 * 
 * @param left - Hash del nodo izquierdo
 * @param right - Hash del nodo derecho
 * @returns Hash del nodo padre
 */
async function hashPair(left: string, right: string): Promise<string> {
  const leftBytes = hexToBytes(left);
  const rightBytes = hexToBytes(right);
  const combined = concatBytes(leftBytes, rightBytes);
  const hashBytes = await sha256Bytes(combined);
  return bytesToHex(hashBytes);
}

// ============================================================================
// FUNCIONES DE CONSTRUCCIÓN
// ============================================================================

/**
 * Construye un árbol Merkle a partir de hashes de eventos.
 * 
 * IMPORTANTE: Las hojas se ordenan lexicográficamente para garantizar
 * que el mismo conjunto de eventos siempre produce el mismo root,
 * independientemente del orden de inserción.
 * 
 * @param eventHashes - Array de hashes de eventos (hex strings)
 * @returns Árbol Merkle completo con metadata
 * 
 * @example
 * const hashes = ['abc123...', 'def456...', 'ghi789...'];
 * const tree = await buildMerkleTree(hashes);
 * console.log(tree.root); // Merkle root
 */
export async function buildMerkleTree(eventHashes: string[]): Promise<MerkleTree> {
  if (eventHashes.length === 0) {
    throw new Error('Cannot build Merkle tree with no leaves');
  }

  // CRÍTICO: Ordenar lexicográficamente para determinismo
  const sortedHashes = [...eventHashes].sort();
  
  const layers: string[][] = [sortedHashes];
  let currentLayer = sortedHashes;
  
  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = currentLayer[i + 1] || left; // Duplicar si impar
      const parentHash = await hashPair(left, right);
      nextLayer.push(parentHash);
    }
    
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }
  
  return {
    leaves: sortedHashes,
    root: currentLayer[0],
    layers,
    metadata: {
      leafCount: sortedHashes.length,
      height: layers.length,
      createdAt: Date.now(),
      version: MERKLE_VERSION,
    },
  };
}

// ============================================================================
// FUNCIONES DE PRUEBA
// ============================================================================

/**
 * Genera una prueba de inclusión para una hoja específica.
 * 
 * La prueba contiene todos los hashes necesarios para reconstruir
 * el path desde la hoja hasta la raíz.
 * 
 * @param tree - Árbol Merkle
 * @param leafHash - Hash de la hoja a probar
 * @returns Prueba de inclusión o null si la hoja no existe
 * 
 * @example
 * const proof = getMerkleProof(tree, eventHash);
 * if (proof) {
 *   const isValid = await verifyMerkleProof(proof);
 * }
 */
export function getMerkleProof(tree: MerkleTree, leafHash: string): MerkleProof | null {
  const leafIndex = tree.leaves.indexOf(leafHash);
  
  if (leafIndex === -1) {
    return null;
  }
  
  const proof: MerkleProofStep[] = [];
  let currentIndex = leafIndex;
  
  for (let layerIndex = 0; layerIndex < tree.layers.length - 1; layerIndex++) {
    const layer = tree.layers[layerIndex];
    const isRightNode = currentIndex % 2 === 1;
    const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
    
    if (siblingIndex < layer.length) {
      proof.push({
        hash: layer[siblingIndex],
        position: isRightNode ? 'left' : 'right',
      });
    } else {
      // Nodo sin hermano (número impar) - se duplica a sí mismo
      proof.push({
        hash: layer[currentIndex],
        position: 'right',
      });
    }
    
    currentIndex = Math.floor(currentIndex / 2);
  }
  
  return {
    leaf: leafHash,
    leafIndex,
    proof,
    root: tree.root,
    leafCount: tree.leaves.length,
  };
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

/**
 * Verifica una prueba de inclusión Merkle.
 * 
 * Reconstruye el path desde la hoja hasta la raíz y compara
 * con la raíz esperada.
 * 
 * @param proof - Prueba de inclusión a verificar
 * @returns true si la prueba es válida
 * 
 * @example
 * const isValid = await verifyMerkleProof(proof);
 * if (isValid) {
 *   console.log('Event is included in the Merkle tree');
 * }
 */
export async function verifyMerkleProof(proof: MerkleProof): Promise<boolean> {
  const result = await verifyMerkleProofDetailed(proof);
  return result.valid;
}

/**
 * Verifica una prueba de inclusión con resultado detallado.
 * Útil para debugging y demostración.
 * 
 * @param proof - Prueba de inclusión a verificar
 * @returns Resultado detallado de la verificación
 */
export async function verifyMerkleProofDetailed(
  proof: MerkleProof
): Promise<MerkleVerificationResult> {
  const steps: { input: string; sibling: string; output: string }[] = [];
  let currentHash = proof.leaf;
  
  try {
    for (const step of proof.proof) {
      const sibling = step.hash;
      let output: string;
      
      if (step.position === 'left') {
        output = await hashPair(sibling, currentHash);
      } else {
        output = await hashPair(currentHash, sibling);
      }
      
      steps.push({
        input: currentHash,
        sibling,
        output,
      });
      
      currentHash = output;
    }
    
    const valid = currentHash === proof.root;
    
    return {
      valid,
      computedRoot: currentHash,
      expectedRoot: proof.root,
      steps,
      error: valid ? undefined : 'Computed root does not match expected root',
    };
  } catch (error) {
    return {
      valid: false,
      computedRoot: currentHash,
      expectedRoot: proof.root,
      steps,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verifica que una hoja pertenece a un árbol dado su root.
 * Función de conveniencia que combina proof + verify.
 * 
 * @param leaf - Hash de la hoja
 * @param proof - Pasos de la prueba
 * @param root - Raíz esperada
 * @returns true si la hoja pertenece al árbol
 */
export async function verifyLeafInclusion(
  leaf: string,
  proof: MerkleProofStep[],
  root: string
): Promise<boolean> {
  let currentHash = leaf;
  
  for (const step of proof) {
    if (step.position === 'left') {
      currentHash = await hashPair(step.hash, currentHash);
    } else {
      currentHash = await hashPair(currentHash, step.hash);
    }
  }
  
  return currentHash === root;
}

export async function getMerkleRoot(eventHashes: string[]): Promise<string> {
  const tree = await buildMerkleTree(eventHashes);
  return tree.root;
}

export function serializeMerkleTree(tree: MerkleTree): string {
  return JSON.stringify(tree);
}

export function deserializeMerkleTree(data: string): MerkleTree {
  return JSON.parse(data) as MerkleTree;
}

export function serializeMerkleProof(proof: MerkleProof): string {
  return JSON.stringify(proof);
}

export function deserializeMerkleProof(data: string): MerkleProof {
  return JSON.parse(data) as MerkleProof;
}
