/**
 * ============================================================================
 * AMARUID - REPLAY PROTECTION
 * ============================================================================
 * 
 * Protección contra ataques de replay y duplicación de eventos.
 * 
 * AMENAZAS MITIGADAS:
 * 1. Replay Attack: Reenvío de eventos válidos antiguos
 * 2. Duplicate Submission: Envío múltiple del mismo evento
 * 3. Hash Collision: Eventos diferentes con mismo hash
 * 
 * MECANISMOS:
 * 1. Unique Event IDs (UUID v4)
 * 2. Timestamps con ventana de validez
 * 3. Nonce opcional para idempotencia
 * 4. Hash registry para detectar duplicados
 * 
 * @module crypto/replayProtection
 * @author AMARUID Team
 * @version 1.0.0
 */

import type { SignedEvent } from '../events/types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Ventana de tiempo máxima para aceptar eventos (en ms).
 * Eventos más antiguos que esto son rechazados.
 * Default: 24 horas
 */
export const DEFAULT_TIME_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Ventana de tiempo para eventos "futuros" (clock skew tolerance).
 * Default: 5 minutos
 */
export const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Tamaño máximo del registro de hashes en memoria.
 * Después de este límite, se eliminan los más antiguos.
 */
export const MAX_HASH_REGISTRY_SIZE = 10000;

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Entrada en el registro de hashes.
 */
export interface HashRegistryEntry {
  hash: string;
  eventId: string;
  timestamp: number;
  receivedAt: number;
}

/**
 * Resultado de validación de replay.
 */
export interface ReplayValidationResult {
  valid: boolean;
  reason?: string;
  details?: {
    isDuplicate?: boolean;
    isExpired?: boolean;
    isFuture?: boolean;
    existingEventId?: string;
  };
}

/**
 * Configuración de protección contra replay.
 */
export interface ReplayProtectionConfig {
  timeWindowMs: number;
  futureToleranceMs: number;
  maxRegistrySize: number;
  requireNonce: boolean;
}

// ============================================================================
// HASH REGISTRY (IN-MEMORY)
// ============================================================================

/**
 * Registro en memoria de hashes procesados.
 * En producción, esto debería ser persistente (IndexedDB, Redis, etc.)
 */
class HashRegistry {
  private entries: Map<string, HashRegistryEntry> = new Map();
  private maxSize: number;

  constructor(maxSize: number = MAX_HASH_REGISTRY_SIZE) {
    this.maxSize = maxSize;
  }

  /**
   * Verifica si un hash ya existe en el registro.
   */
  has(hash: string): boolean {
    return this.entries.has(hash);
  }

  /**
   * Obtiene la entrada de un hash.
   */
  get(hash: string): HashRegistryEntry | undefined {
    return this.entries.get(hash);
  }

  /**
   * Registra un nuevo hash.
   */
  add(entry: HashRegistryEntry): void {
    // Limpiar entradas antiguas si excede el límite
    if (this.entries.size >= this.maxSize) {
      this.pruneOldest(Math.floor(this.maxSize * 0.1)); // Eliminar 10%
    }
    this.entries.set(entry.hash, entry);
  }

  /**
   * Elimina las entradas más antiguas.
   */
  private pruneOldest(count: number): void {
    const sorted = Array.from(this.entries.entries())
      .sort((a, b) => a[1].receivedAt - b[1].receivedAt);
    
    for (let i = 0; i < count && i < sorted.length; i++) {
      this.entries.delete(sorted[i][0]);
    }
  }

  /**
   * Elimina entradas más antiguas que el tiempo especificado.
   */
  pruneOlderThan(maxAgeMs: number): number {
    const cutoff = Date.now() - maxAgeMs;
    let pruned = 0;
    
    for (const [hash, entry] of this.entries) {
      if (entry.receivedAt < cutoff) {
        this.entries.delete(hash);
        pruned++;
      }
    }
    
    return pruned;
  }

  /**
   * Obtiene el tamaño actual del registro.
   */
  size(): number {
    return this.entries.size;
  }

  /**
   * Limpia todo el registro.
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Exporta el registro para persistencia.
   */
  export(): HashRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Importa entradas al registro.
   */
  import(entries: HashRegistryEntry[]): void {
    for (const entry of entries) {
      this.entries.set(entry.hash, entry);
    }
  }
}

// Instancia global del registro
const globalRegistry = new HashRegistry();

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Valida un evento contra ataques de replay.
 * 
 * VERIFICACIONES:
 * 1. El hash no existe en el registro (no es duplicado)
 * 2. El timestamp está dentro de la ventana válida
 * 3. El timestamp no está en el futuro (más allá de tolerancia)
 * 
 * @param event - Evento a validar
 * @param config - Configuración opcional
 * @returns Resultado de validación
 */
export function validateAgainstReplay(
  event: SignedEvent,
  config: Partial<ReplayProtectionConfig> = {}
): ReplayValidationResult {
  const {
    timeWindowMs = DEFAULT_TIME_WINDOW_MS,
    futureToleranceMs = FUTURE_TOLERANCE_MS,
  } = config;

  const now = Date.now();

  // 1. Verificar duplicado por hash
  const existingEntry = globalRegistry.get(event.metadata_hash);
  if (existingEntry) {
    return {
      valid: false,
      reason: 'Duplicate event hash detected',
      details: {
        isDuplicate: true,
        existingEventId: existingEntry.eventId,
      },
    };
  }

  // 2. Verificar que el timestamp no sea muy antiguo
  const eventAge = now - event.timestamp;
  if (eventAge > timeWindowMs) {
    return {
      valid: false,
      reason: `Event timestamp too old (${Math.floor(eventAge / 1000)}s > ${Math.floor(timeWindowMs / 1000)}s)`,
      details: {
        isExpired: true,
      },
    };
  }

  // 3. Verificar que el timestamp no esté en el futuro
  if (event.timestamp > now + futureToleranceMs) {
    return {
      valid: false,
      reason: 'Event timestamp is in the future',
      details: {
        isFuture: true,
      },
    };
  }

  return { valid: true };
}

/**
 * Registra un evento como procesado.
 * Debe llamarse DESPUÉS de validar y procesar exitosamente el evento.
 * 
 * @param event - Evento a registrar
 */
export function registerProcessedEvent(event: SignedEvent): void {
  globalRegistry.add({
    hash: event.metadata_hash,
    eventId: event.id,
    timestamp: event.timestamp,
    receivedAt: Date.now(),
  });
}

/**
 * Valida y registra un evento en una sola operación.
 * Útil para procesamiento atómico.
 * 
 * @param event - Evento a procesar
 * @param config - Configuración opcional
 * @returns Resultado de validación
 */
export function validateAndRegister(
  event: SignedEvent,
  config: Partial<ReplayProtectionConfig> = {}
): ReplayValidationResult {
  const result = validateAgainstReplay(event, config);
  
  if (result.valid) {
    registerProcessedEvent(event);
  }
  
  return result;
}

// ============================================================================
// FUNCIONES DE NONCE
// ============================================================================

/**
 * Genera un nonce criptográficamente seguro.
 * 
 * @param length - Longitud en bytes (default: 16)
 * @returns Nonce como string hexadecimal
 */
export function generateNonce(length: number = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Genera un nonce con timestamp embebido.
 * Formato: [timestamp_hex]-[random_hex]
 * 
 * @returns Nonce con timestamp
 */
export function generateTimestampedNonce(): string {
  const timestamp = Date.now().toString(16);
  const random = generateNonce(8);
  return `${timestamp}-${random}`;
}

/**
 * Extrae el timestamp de un nonce timestamped.
 * 
 * @param nonce - Nonce con timestamp
 * @returns Timestamp o null si inválido
 */
export function extractNonceTimestamp(nonce: string): number | null {
  const parts = nonce.split('-');
  if (parts.length !== 2) return null;
  
  const timestamp = parseInt(parts[0], 16);
  if (isNaN(timestamp)) return null;
  
  return timestamp;
}

// ============================================================================
// FUNCIONES DE IDEMPOTENCIA
// ============================================================================

/**
 * Genera una clave de idempotencia para una operación.
 * Útil para garantizar que una operación solo se ejecute una vez.
 * 
 * @param actorPublicKey - Clave pública del actor
 * @param action - Acción a realizar
 * @param params - Parámetros de la acción
 * @returns Clave de idempotencia
 */
export async function generateIdempotencyKey(
  actorPublicKey: string,
  action: string,
  params: Record<string, unknown>
): Promise<string> {
  const data = JSON.stringify({ actor: actorPublicKey, action, params });
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ============================================================================
// FUNCIONES DE GESTIÓN DEL REGISTRO
// ============================================================================

/**
 * Limpia entradas antiguas del registro.
 * 
 * @param maxAgeMs - Edad máxima en milisegundos
 * @returns Número de entradas eliminadas
 */
export function pruneRegistry(maxAgeMs: number = DEFAULT_TIME_WINDOW_MS): number {
  return globalRegistry.pruneOlderThan(maxAgeMs);
}

/**
 * Obtiene estadísticas del registro.
 */
export function getRegistryStats(): {
  size: number;
  maxSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  const entries = globalRegistry.export();
  
  let oldest: number | null = null;
  let newest: number | null = null;
  
  for (const entry of entries) {
    if (oldest === null || entry.receivedAt < oldest) {
      oldest = entry.receivedAt;
    }
    if (newest === null || entry.receivedAt > newest) {
      newest = entry.receivedAt;
    }
  }
  
  return {
    size: globalRegistry.size(),
    maxSize: MAX_HASH_REGISTRY_SIZE,
    oldestEntry: oldest,
    newestEntry: newest,
  };
}

/**
 * Limpia todo el registro.
 * ⚠️ CUIDADO: Esto permite que eventos duplicados sean aceptados.
 */
export function clearRegistry(): void {
  globalRegistry.clear();
}

/**
 * Exporta el registro para persistencia.
 */
export function exportRegistry(): HashRegistryEntry[] {
  return globalRegistry.export();
}

/**
 * Importa entradas al registro.
 */
export function importRegistry(entries: HashRegistryEntry[]): void {
  globalRegistry.import(entries);
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN DE INTEGRIDAD
// ============================================================================

/**
 * Verifica la integridad completa de un evento.
 * Combina verificación de replay con otras validaciones.
 * 
 * @param event - Evento a verificar
 * @returns Resultado de validación
 */
export function verifyEventIntegrity(event: SignedEvent): {
  valid: boolean;
  checks: {
    hasValidId: boolean;
    hasValidTimestamp: boolean;
    hasValidHash: boolean;
    hasValidSignature: boolean;
    notDuplicate: boolean;
    notExpired: boolean;
    notFuture: boolean;
  };
  errors: string[];
} {
  const errors: string[] = [];
  
  // Verificar ID
  const hasValidId = typeof event.id === 'string' && event.id.length > 0;
  if (!hasValidId) errors.push('Invalid or missing event ID');
  
  // Verificar timestamp
  const hasValidTimestamp = typeof event.timestamp === 'number' && event.timestamp > 0;
  if (!hasValidTimestamp) errors.push('Invalid or missing timestamp');
  
  // Verificar hash
  const hasValidHash = typeof event.metadata_hash === 'string' && event.metadata_hash.length === 64;
  if (!hasValidHash) errors.push('Invalid or missing metadata hash');
  
  // Verificar firma
  const hasValidSignature = typeof event.signature === 'string' && event.signature.length > 0;
  if (!hasValidSignature) errors.push('Invalid or missing signature');
  
  // Verificar replay
  const replayResult = validateAgainstReplay(event);
  const notDuplicate = !replayResult.details?.isDuplicate;
  const notExpired = !replayResult.details?.isExpired;
  const notFuture = !replayResult.details?.isFuture;
  
  if (!replayResult.valid && replayResult.reason) {
    errors.push(replayResult.reason);
  }
  
  return {
    valid: errors.length === 0,
    checks: {
      hasValidId,
      hasValidTimestamp,
      hasValidHash,
      hasValidSignature,
      notDuplicate,
      notExpired,
      notFuture,
    },
    errors,
  };
}
