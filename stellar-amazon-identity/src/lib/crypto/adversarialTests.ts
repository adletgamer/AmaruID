/**
 * ============================================================================
 * AMARUID - ADVERSARIAL TESTS
 * ============================================================================
 * 
 * Pruebas adversariales ejecutables para demostrar la robustez criptográfica.
 * Estas funciones pueden ejecutarse desde la UI para demostración.
 * 
 * ESCENARIOS:
 * 1. Cambiar 1 byte → firma inválida
 * 2. Cambiar orden JSON → hash diferente (pero canonicalización lo maneja)
 * 3. Evento incompleto → rechazado
 * 4. Replay attack → detectado
 * 5. Timestamp manipulation → rechazado
 * 
 * @module crypto/adversarialTests
 */

import { generateKeypair } from './identity';
import { canonicalize, canonicalHash } from './canonicalization';
import { 
  validateAgainstReplay, 
  registerProcessedEvent,
  clearRegistry,
  generateNonce 
} from './replayProtection';
import { 
  createEvent, 
  verifyEvent, 
  hashMetadata 
} from '../events/signedEvent';
import type { SignedEvent } from '../events/types';

// ============================================================================
// TIPOS
// ============================================================================

export interface TestResult {
  name: string;
  passed: boolean;
  description: string;
  details: Record<string, unknown>;
  duration: number;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

// ============================================================================
// TEST RUNNER
// ============================================================================

/**
 * Ejecuta todas las pruebas adversariales.
 */
export async function runAllAdversarialTests(): Promise<TestSuite> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  // Limpiar estado
  clearRegistry();

  // Ejecutar cada test
  results.push(await testDataTampering());
  results.push(await testSignatureModification());
  results.push(await testActorSwap());
  results.push(await testJsonOrderIndependence());
  results.push(await testJsonOrderDifference());
  results.push(await testIncompleteEvent());
  results.push(await testReplayAttack());
  results.push(await testExpiredTimestamp());
  results.push(await testFutureTimestamp());
  results.push(await testNonceUniqueness());
  results.push(await testHashCollisionResistance());

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    name: 'Adversarial Security Tests',
    results,
    passed,
    failed,
    duration: Date.now() - startTime,
  };
}

// ============================================================================
// TEST 1: DATA TAMPERING
// ============================================================================

async function testDataTampering(): Promise<TestResult> {
  const start = Date.now();
  const { keypair } = generateKeypair();
  
  const event = await createEvent(
    'conservation',
    'plant_trees',
    { count: 50, species: 'cedro' },
    keypair
  );

  // Modificar datos después de firmar
  const tampered: SignedEvent = {
    ...event,
    metadata: {
      ...event.metadata,
      data: { count: 51, species: 'cedro' }, // 50 → 51
    },
  };

  const result = await verifyEvent(tampered);

  return {
    name: 'Data Tampering Detection',
    passed: !result.is_valid && !result.hash_matches,
    description: 'Modificar datos después de firmar debe invalidar el evento',
    details: {
      originalCount: 50,
      tamperedCount: 51,
      hashMatches: result.hash_matches,
      signatureValid: result.signature_valid,
      error: result.error,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 2: SIGNATURE MODIFICATION
// ============================================================================

async function testSignatureModification(): Promise<TestResult> {
  const start = Date.now();
  const { keypair } = generateKeypair();
  
  const event = await createEvent(
    'conservation',
    'test_action',
    { value: 42 },
    keypair
  );

  // Modificar 1 carácter de la firma
  const sigArray = event.signature.split('');
  sigArray[10] = sigArray[10] === 'a' ? 'b' : 'a';
  const tamperedSig = sigArray.join('');

  const tampered: SignedEvent = {
    ...event,
    signature: tamperedSig,
  };

  const result = await verifyEvent(tampered);

  return {
    name: 'Signature Modification Detection',
    passed: !result.is_valid && !result.signature_valid,
    description: 'Modificar la firma debe invalidar el evento',
    details: {
      originalSigPrefix: event.signature.slice(0, 20),
      tamperedSigPrefix: tamperedSig.slice(0, 20),
      signatureValid: result.signature_valid,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 3: ACTOR SWAP
// ============================================================================

async function testActorSwap(): Promise<TestResult> {
  const start = Date.now();
  const { keypair: originalKeypair } = generateKeypair();
  const { keypair: attackerKeypair } = generateKeypair();
  
  const event = await createEvent(
    'conservation',
    'claim_reward',
    { amount: 1000 },
    originalKeypair
  );

  // Atacante intenta reclamar el evento
  const swapped: SignedEvent = {
    ...event,
    actor_public_key: attackerKeypair.publicKey(),
  };

  const result = await verifyEvent(swapped);

  return {
    name: 'Actor Public Key Swap Detection',
    passed: !result.is_valid && !result.signature_valid,
    description: 'Cambiar la clave pública del actor debe invalidar la firma',
    details: {
      originalActor: originalKeypair.publicKey().slice(0, 10) + '...',
      swappedActor: attackerKeypair.publicKey().slice(0, 10) + '...',
      signatureValid: result.signature_valid,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 4: JSON ORDER INDEPENDENCE
// ============================================================================

async function testJsonOrderIndependence(): Promise<TestResult> {
  const start = Date.now();
  
  const obj1 = { z: 1, a: 2, m: 3 };
  const obj2 = { a: 2, m: 3, z: 1 };
  const obj3 = { m: 3, z: 1, a: 2 };

  const hash1 = await canonicalHash(obj1);
  const hash2 = await canonicalHash(obj2);
  const hash3 = await canonicalHash(obj3);

  const allEqual = hash1 === hash2 && hash2 === hash3;

  return {
    name: 'JSON Order Independence',
    passed: allEqual,
    description: 'Objetos con mismo contenido pero diferente orden deben producir mismo hash',
    details: {
      input1: JSON.stringify(obj1),
      input2: JSON.stringify(obj2),
      input3: JSON.stringify(obj3),
      canonical: canonicalize(obj1),
      hash: hash1,
      allEqual,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 5: JSON VALUE DIFFERENCE
// ============================================================================

async function testJsonOrderDifference(): Promise<TestResult> {
  const start = Date.now();
  
  const obj1 = { a: 1, b: 2 };
  const obj2 = { a: 1, b: 3 }; // b changed

  const hash1 = await canonicalHash(obj1);
  const hash2 = await canonicalHash(obj2);

  const different = hash1 !== hash2;

  return {
    name: 'JSON Value Difference Detection',
    passed: different,
    description: 'Objetos con valores diferentes deben producir hashes diferentes',
    details: {
      input1: JSON.stringify(obj1),
      input2: JSON.stringify(obj2),
      hash1: hash1.slice(0, 16) + '...',
      hash2: hash2.slice(0, 16) + '...',
      different,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 6: INCOMPLETE EVENT
// ============================================================================

async function testIncompleteEvent(): Promise<TestResult> {
  const start = Date.now();
  const { keypair } = generateKeypair();
  
  const event = await createEvent(
    'conservation',
    'test_action',
    { value: 42 },
    keypair
  );

  // Evento sin firma
  const noSignature: SignedEvent = {
    ...event,
    signature: '',
  };

  // Evento sin hash
  const noHash: SignedEvent = {
    ...event,
    metadata_hash: '',
  };

  const resultNoSig = await verifyEvent(noSignature);
  const resultNoHash = await verifyEvent(noHash);

  return {
    name: 'Incomplete Event Rejection',
    passed: !resultNoSig.is_valid && !resultNoHash.is_valid,
    description: 'Eventos sin firma o hash deben ser rechazados',
    details: {
      noSignatureValid: resultNoSig.is_valid,
      noHashValid: resultNoHash.is_valid,
      noSignatureError: resultNoSig.error,
      noHashError: resultNoHash.error,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 7: REPLAY ATTACK
// ============================================================================

async function testReplayAttack(): Promise<TestResult> {
  const start = Date.now();
  clearRegistry();
  
  const { keypair } = generateKeypair();
  const event = await createEvent(
    'conservation',
    'claim_reward',
    { amount: 1000 },
    keypair
  );

  // Primera vez: válido
  const first = validateAgainstReplay(event);
  registerProcessedEvent(event);

  // Segunda vez: replay
  const replay = validateAgainstReplay(event);

  return {
    name: 'Replay Attack Detection',
    passed: first.valid && !replay.valid && replay.details?.isDuplicate === true,
    description: 'Reenvío del mismo evento debe ser detectado y rechazado',
    details: {
      firstSubmissionValid: first.valid,
      replayValid: replay.valid,
      isDuplicate: replay.details?.isDuplicate,
      reason: replay.reason,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 8: EXPIRED TIMESTAMP
// ============================================================================

async function testExpiredTimestamp(): Promise<TestResult> {
  const start = Date.now();
  clearRegistry();
  
  const { keypair } = generateKeypair();
  const event = await createEvent(
    'conservation',
    'old_action',
    { value: 1 },
    keypair
  );

  // Evento de hace 25 horas
  const oldEvent: SignedEvent = {
    ...event,
    timestamp: Date.now() - (25 * 60 * 60 * 1000),
  };

  const result = validateAgainstReplay(oldEvent);

  return {
    name: 'Expired Timestamp Rejection',
    passed: !result.valid && result.details?.isExpired === true,
    description: 'Eventos con timestamp muy antiguo deben ser rechazados',
    details: {
      eventAge: '25 hours',
      maxAge: '24 hours',
      valid: result.valid,
      isExpired: result.details?.isExpired,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 9: FUTURE TIMESTAMP
// ============================================================================

async function testFutureTimestamp(): Promise<TestResult> {
  const start = Date.now();
  clearRegistry();
  
  const { keypair } = generateKeypair();
  const event = await createEvent(
    'conservation',
    'future_action',
    { value: 1 },
    keypair
  );

  // Evento de dentro de 10 minutos
  const futureEvent: SignedEvent = {
    ...event,
    timestamp: Date.now() + (10 * 60 * 1000),
  };

  const result = validateAgainstReplay(futureEvent);

  return {
    name: 'Future Timestamp Rejection',
    passed: !result.valid && result.details?.isFuture === true,
    description: 'Eventos con timestamp en el futuro deben ser rechazados',
    details: {
      eventTime: 'now + 10 minutes',
      tolerance: '5 minutes',
      valid: result.valid,
      isFuture: result.details?.isFuture,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 10: NONCE UNIQUENESS
// ============================================================================

async function testNonceUniqueness(): Promise<TestResult> {
  const start = Date.now();
  
  const nonces = new Set<string>();
  const count = 1000;
  
  for (let i = 0; i < count; i++) {
    nonces.add(generateNonce());
  }

  const allUnique = nonces.size === count;

  return {
    name: 'Nonce Uniqueness',
    passed: allUnique,
    description: 'Todos los nonces generados deben ser únicos',
    details: {
      generated: count,
      unique: nonces.size,
      allUnique,
      sampleNonce: generateNonce(),
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// TEST 11: HASH COLLISION RESISTANCE
// ============================================================================

async function testHashCollisionResistance(): Promise<TestResult> {
  const start = Date.now();
  
  const hashes = new Set<string>();
  const count = 100;
  
  for (let i = 0; i < count; i++) {
    const hash = await canonicalHash({ index: i, data: 'test', nonce: generateNonce() });
    hashes.add(hash);
  }

  const noCollisions = hashes.size === count;
  const sampleHash = await canonicalHash({ test: 'sample' });

  return {
    name: 'Hash Collision Resistance',
    passed: noCollisions && sampleHash.length === 64,
    description: 'SHA-256 debe producir hashes únicos de 64 caracteres hex',
    details: {
      generated: count,
      unique: hashes.size,
      noCollisions,
      hashLength: sampleHash.length,
      expectedLength: 64,
    },
    duration: Date.now() - start,
  };
}

// ============================================================================
// DEMO FUNCTIONS FOR UI
// ============================================================================

/**
 * Demo interactiva de tampering para la UI.
 */
export async function demoDataTampering(): Promise<{
  original: { count: number; valid: boolean };
  tampered: { count: number; valid: boolean; error?: string };
}> {
  const { keypair } = generateKeypair();
  
  const event = await createEvent(
    'conservation',
    'plant_trees',
    { count: 50 },
    keypair
  );

  const originalResult = await verifyEvent(event);

  const tampered: SignedEvent = {
    ...event,
    metadata: {
      ...event.metadata,
      data: { count: 100 },
    },
  };

  const tamperedResult = await verifyEvent(tampered);

  return {
    original: { count: 50, valid: originalResult.is_valid },
    tampered: { count: 100, valid: tamperedResult.is_valid, error: tamperedResult.error },
  };
}

/**
 * Demo interactiva de replay para la UI.
 */
export async function demoReplayAttack(): Promise<{
  firstSubmission: { valid: boolean };
  replayAttempt: { valid: boolean; reason?: string };
}> {
  clearRegistry();
  const { keypair } = generateKeypair();
  
  const event = await createEvent(
    'conservation',
    'claim_reward',
    { amount: 1000 },
    keypair
  );

  const first = validateAgainstReplay(event);
  registerProcessedEvent(event);

  const replay = validateAgainstReplay(event);

  return {
    firstSubmission: { valid: first.valid },
    replayAttempt: { valid: replay.valid, reason: replay.reason },
  };
}
