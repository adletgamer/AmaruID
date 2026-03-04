/**
 * ============================================================================
 * AMARUID - EVENT LAYER
 * ============================================================================
 * 
 * Módulo para creación, firma y verificación de eventos.
 * 
 * FLUJO DE EVENTO:
 * 1. Crear metadata del evento
 * 2. Hashear metadata de forma determinística
 * 3. Firmar el hash con clave privada
 * 4. Crear objeto SignedEvent completo
 * 
 * CARACTERÍSTICAS:
 * - Hash determinístico (JSON con claves ordenadas)
 * - Eventos serializables y verificables
 * - Funciones puras sin efectos secundarios
 * - Compatible con validación threshold
 * 
 * @module events/signedEvent
 * @author AMARUID Team
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { sha256 } from '../crypto/hash';
import { signString, verifyString } from '../crypto/identity';
import type { 
  SignedEvent, 
  EventMetadata,
  EventType,
  ValidationSignature,
  EventStatus,
  EventVerificationResult,
  EventEnvelope,
  GeoPoint
} from './types';

// ============================================================================
// FUNCIONES DE SERIALIZACIÓN DETERMINÍSTICA
// ============================================================================

/**
 * Serializa un objeto de forma determinística.
 * Las claves se ordenan alfabéticamente en todos los niveles.
 * 
 * IMPORTANTE: Esta función garantiza que el mismo objeto
 * siempre produce el mismo string JSON.
 * 
 * @param obj - Objeto a serializar
 * @returns String JSON determinístico
 */
export function deterministicStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }
  
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => deterministicStringify(item));
    return `[${items.join(',')}]`;
  }
  
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map(key => {
    const value = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${deterministicStringify(value)}`;
  });
  
  return `{${pairs.join(',')}}`;
}

/**
 * Calcula el hash SHA256 de metadata de forma determinística.
 * 
 * @param metadata - Metadata del evento
 * @returns Hash SHA256 en formato hexadecimal
 */
export async function hashMetadata(metadata: EventMetadata): Promise<string> {
  const serialized = deterministicStringify(metadata);
  return sha256(serialized);
}

// ============================================================================
// FUNCIONES DE CREACIÓN DE EVENTOS
// ============================================================================

/**
 * Crea la metadata de un evento.
 * Función pura que construye la estructura de metadata.
 * 
 * @param type - Tipo de evento
 * @param action - Acción específica
 * @param data - Datos adicionales
 * @param evidence - Array de evidencias (hashes o base64)
 * @param location - Ubicación geográfica opcional
 * @returns Objeto EventMetadata
 */
export function createMetadata(
  type: EventType,
  action: string,
  data: Record<string, unknown> = {},
  evidence: string[] = [],
  location?: GeoPoint
): EventMetadata {
  const metadata: EventMetadata = {
    type,
    action,
    data,
    evidence,
  };
  
  if (location) {
    metadata.location = location;
  }
  
  return metadata;
}

/**
 * Crea un evento firmado completo.
 * 
 * FLUJO:
 * 1. Genera UUID único
 * 2. Hashea metadata de forma determinística
 * 3. Firma el hash con la clave privada
 * 4. Retorna evento completo
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param metadata - Metadata del evento
 * @param keypair - Keypair del actor
 * @returns Evento firmado listo para validación
 * 
 * @example
 * const metadata = createMetadata('conservation', 'plant_trees', { count: 50 });
 * const event = await createSignedEvent(metadata, keypair);
 */
export async function createSignedEvent(
  metadata: EventMetadata,
  keypair: StellarSdk.Keypair
): Promise<SignedEvent> {
  // 1. Generar ID único
  const id = crypto.randomUUID();
  
  // 2. Timestamp actual
  const timestamp = Date.now();
  
  // 3. Hashear metadata de forma determinística
  const metadata_hash = await hashMetadata(metadata);
  
  // 4. Firmar el hash
  const signature = signString(metadata_hash, keypair);
  
  // 5. Construir evento completo
  return {
    id,
    timestamp,
    actor_public_key: keypair.publicKey(),
    metadata,
    metadata_hash,
    signature,
    status: 'pending',
    validations: [],
  };
}

/**
 * Crea un evento con todos los parámetros en una sola llamada.
 * Conveniencia para casos simples.
 * 
 * @param type - Tipo de evento
 * @param action - Acción específica
 * @param data - Datos adicionales
 * @param keypair - Keypair del actor
 * @param evidence - Evidencias opcionales
 * @param location - Ubicación opcional
 * @returns Evento firmado
 */
export async function createEvent(
  type: EventType,
  action: string,
  data: Record<string, unknown>,
  keypair: StellarSdk.Keypair,
  evidence: string[] = [],
  location?: GeoPoint
): Promise<SignedEvent> {
  const metadata = createMetadata(type, action, data, evidence, location);
  return createSignedEvent(metadata, keypair);
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

/**
 * Verifica la integridad y autenticidad de un evento.
 * 
 * VERIFICACIONES:
 * 1. Recalcula el hash de la metadata
 * 2. Compara con el hash almacenado
 * 3. Verifica la firma sobre el hash
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param event - Evento a verificar
 * @returns Resultado detallado de la verificación
 * 
 * @example
 * const result = await verifyEvent(event);
 * if (result.is_valid) {
 *   console.log('Evento válido!');
 * }
 */
export async function verifyEvent(event: SignedEvent): Promise<EventVerificationResult> {
  try {
    // 1. Recalcular hash de metadata
    const computed_hash = await hashMetadata(event.metadata);
    
    // 2. Verificar que el hash coincide
    const hash_matches = computed_hash === event.metadata_hash;
    
    if (!hash_matches) {
      return {
        is_valid: false,
        computed_hash,
        hash_matches: false,
        signature_valid: false,
        error: 'Metadata hash mismatch - data may have been tampered',
      };
    }
    
    // 3. Verificar firma
    const signature_valid = verifyString(
      event.metadata_hash,
      event.signature,
      event.actor_public_key
    );
    
    if (!signature_valid) {
      return {
        is_valid: false,
        computed_hash,
        hash_matches: true,
        signature_valid: false,
        error: 'Invalid signature - not signed by claimed actor',
      };
    }
    
    // 4. Todo válido
    return {
      is_valid: true,
      computed_hash,
      hash_matches: true,
      signature_valid: true,
    };
  } catch (error) {
    return {
      is_valid: false,
      computed_hash: '',
      hash_matches: false,
      signature_valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Verificación simple que retorna boolean.
 * 
 * @param event - Evento a verificar
 * @returns true si el evento es válido
 */
export async function isEventValid(event: SignedEvent): Promise<boolean> {
  const result = await verifyEvent(event);
  return result.is_valid;
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN (THRESHOLD)
// ============================================================================

/**
 * Agrega una firma de validación a un evento.
 * Función pura que retorna un nuevo evento.
 * 
 * @param event - Evento a validar
 * @param validatorKeypair - Keypair del validador
 * @returns Nuevo evento con la validación agregada
 */
export function addValidation(
  event: SignedEvent,
  validatorKeypair: StellarSdk.Keypair
): SignedEvent {
  const signature = signString(event.metadata_hash, validatorKeypair);
  
  const validation: ValidationSignature = {
    validator_public_key: validatorKeypair.publicKey(),
    signature,
    timestamp: Date.now(),
  };
  
  return {
    ...event,
    validations: [...event.validations, validation],
  };
}

/**
 * Verifica una firma de validación individual.
 * 
 * @param event - Evento que contiene el hash
 * @param validation - Firma de validación a verificar
 * @returns true si la validación es válida
 */
export function verifyValidation(
  event: SignedEvent,
  validation: ValidationSignature
): boolean {
  return verifyString(
    event.metadata_hash,
    validation.signature,
    validation.validator_public_key
  );
}

/**
 * Verifica todas las validaciones de un evento.
 * 
 * @param event - Evento a verificar
 * @returns Array de resultados por cada validación
 */
export function verifyAllValidations(
  event: SignedEvent
): { validator: string; valid: boolean }[] {
  return event.validations.map(validation => ({
    validator: validation.validator_public_key,
    valid: verifyValidation(event, validation),
  }));
}

/**
 * Cuenta las validaciones válidas de un evento.
 * 
 * @param event - Evento a verificar
 * @returns Número de validaciones válidas
 */
export function countValidSignatures(event: SignedEvent): number {
  return event.validations.filter(v => verifyValidation(event, v)).length;
}

/**
 * Verifica si un evento ha alcanzado el threshold requerido.
 * 
 * @param event - Evento a verificar
 * @param required - Número de firmas requeridas
 * @returns true si tiene suficientes firmas válidas
 */
export function hasReachedThreshold(
  event: SignedEvent,
  required: number
): boolean {
  return countValidSignatures(event) >= required;
}

// ============================================================================
// FUNCIONES DE ESTADO
// ============================================================================

/**
 * Actualiza el estado de un evento.
 * Función pura que retorna un nuevo evento.
 * 
 * @param event - Evento original
 * @param status - Nuevo estado
 * @returns Nuevo evento con estado actualizado
 */
export function updateEventStatus(
  event: SignedEvent,
  status: EventStatus
): SignedEvent {
  return {
    ...event,
    status,
  };
}

/**
 * Marca un evento como validado.
 * 
 * @param event - Evento a marcar
 * @returns Evento con status 'validated'
 */
export function markAsValidated(event: SignedEvent): SignedEvent {
  return updateEventStatus(event, 'validated');
}

/**
 * Agrega prueba de anclaje a un evento.
 * 
 * @param event - Evento original
 * @param merkleRoot - Raíz del árbol Merkle
 * @param stellarTxHash - Hash de transacción Stellar
 * @returns Evento con prueba de anclaje
 */
export function setAnchorProof(
  event: SignedEvent,
  merkleRoot: string,
  stellarTxHash: string
): SignedEvent {
  return {
    ...event,
    status: 'anchored',
    anchor_proof: {
      merkle_root: merkleRoot,
      stellar_tx_hash: stellarTxHash,
      anchored_at: Date.now(),
    },
  };
}

// ============================================================================
// FUNCIONES DE SERIALIZACIÓN
// ============================================================================

/**
 * Serializa un evento a JSON string.
 * 
 * @param event - Evento a serializar
 * @returns String JSON
 */
export function serializeEvent(event: SignedEvent): string {
  return JSON.stringify(event);
}

/**
 * Deserializa un evento desde JSON string.
 * 
 * @param data - String JSON
 * @returns Evento deserializado
 */
export function deserializeEvent(data: string): SignedEvent {
  return JSON.parse(data) as SignedEvent;
}

/**
 * Extrae el envelope de un evento (versión ligera).
 * Útil para transmisión eficiente.
 * 
 * @param event - Evento completo
 * @returns Envelope con campos esenciales
 */
export function extractEnvelope(event: SignedEvent): EventEnvelope {
  return {
    id: event.id,
    timestamp: event.timestamp,
    actor_public_key: event.actor_public_key,
    metadata_hash: event.metadata_hash,
    signature: event.signature,
  };
}
