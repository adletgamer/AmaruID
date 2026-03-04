/**
 * ============================================================================
 * AMARUID - EVENT LAYER TYPES
 * ============================================================================
 * 
 * Definición de tipos para el sistema de eventos firmados.
 * 
 * ESTRUCTURA DE EVENTO:
 * {
 *   id,                    // UUID único del evento
 *   timestamp,             // Momento de creación
 *   actor_public_key,      // Clave pública del actor
 *   metadata_hash,         // Hash SHA256 de la metadata
 *   signature              // Firma Ed25519 del hash
 * }
 * 
 * CARACTERÍSTICAS:
 * - Hash determinístico (claves ordenadas alfabéticamente)
 * - Eventos serializables y verificables
 * - Compatible con validación threshold
 * 
 * @module events/types
 * @author AMARUID Team
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

/**
 * Tipos de eventos soportados por el sistema.
 */
export type EventType = 
  | 'conservation'    // Acción de conservación ambiental
  | 'endorsement'     // Endoso de otro miembro
  | 'claim'           // Reclamo de beneficio
  | 'certification';  // Certificación comunitaria

/**
 * Estados del ciclo de vida de un evento.
 */
export type EventStatus = 
  | 'pending'     // Creado, esperando validación
  | 'validated'   // Validado por threshold de firmas
  | 'anchored';   // Anclado en blockchain

// ============================================================================
// INTERFACES DE METADATA
// ============================================================================

/**
 * Coordenadas geográficas con precisión opcional.
 */
export interface GeoPoint {
  /** Latitud en grados decimales */
  lat: number;
  /** Longitud en grados decimales */
  lng: number;
  /** Precisión en metros (opcional) */
  accuracy?: number;
}

/**
 * Metadata del evento - datos específicos de la acción.
 * Esta estructura se hashea de forma determinística.
 */
export interface EventMetadata {
  /** Tipo de evento */
  type: EventType;
  /** Acción específica realizada */
  action: string;
  /** Datos adicionales de la acción */
  data: Record<string, unknown>;
  /** Evidencia adjunta (hashes o base64) */
  evidence: string[];
  /** Ubicación geográfica (opcional) */
  location?: GeoPoint;
}

// ============================================================================
// INTERFACES DE EVENTO
// ============================================================================

/**
 * Evento firmado completo.
 * Estructura principal del Event Layer.
 * 
 * IMPORTANTE: El hash se calcula sobre la metadata serializada
 * de forma determinística (claves ordenadas alfabéticamente).
 */
export interface SignedEvent {
  /** UUID v4 único del evento */
  id: string;
  
  /** Timestamp Unix de creación (milisegundos) */
  timestamp: number;
  
  /** Clave pública del actor que creó el evento */
  actor_public_key: string;
  
  /** Metadata del evento */
  metadata: EventMetadata;
  
  /** Hash SHA256 de la metadata serializada */
  metadata_hash: string;
  
  /** Firma Ed25519 del metadata_hash */
  signature: string;
  
  /** Estado actual del evento */
  status: EventStatus;
  
  /** Firmas de validación recolectadas */
  validations: ValidationSignature[];
  
  /** Prueba de anclaje en blockchain (si existe) */
  anchor_proof?: AnchorProofRef;
}

/**
 * Versión simplificada para transmisión.
 * Contiene solo los campos necesarios para verificación.
 */
export interface EventEnvelope {
  /** ID del evento */
  id: string;
  /** Timestamp de creación */
  timestamp: number;
  /** Clave pública del actor */
  actor_public_key: string;
  /** Hash de la metadata */
  metadata_hash: string;
  /** Firma del hash */
  signature: string;
}

// ============================================================================
// INTERFACES DE VALIDACIÓN
// ============================================================================

/**
 * Firma de un validador sobre un evento.
 */
export interface ValidationSignature {
  /** Clave pública del validador */
  validator_public_key: string;
  /** Firma del validador sobre el metadata_hash */
  signature: string;
  /** Timestamp de la validación */
  timestamp: number;
}

/**
 * Certificado de validación completo.
 * Se genera cuando un evento alcanza el threshold requerido.
 */
export interface ValidationCertificate {
  /** Hash del evento validado */
  event_hash: string;
  /** ID del evento */
  event_id: string;
  /** Firmas de los validadores */
  signatures: ValidationSignature[];
  /** Configuración de threshold usada */
  threshold: ThresholdConfig;
  /** Timestamp de validación completa */
  validated_at: number;
}

/**
 * Configuración de threshold para validación.
 */
export interface ThresholdConfig {
  /** Número mínimo de firmas requeridas */
  required: number;
  /** Número total de validadores */
  total: number;
}

// ============================================================================
// INTERFACES DE ANCLAJE
// ============================================================================

/**
 * Referencia a prueba de anclaje en blockchain.
 */
export interface AnchorProofRef {
  /** Raíz del árbol Merkle */
  merkle_root: string;
  /** Hash de transacción en Stellar */
  stellar_tx_hash: string;
  /** Timestamp de anclaje */
  anchored_at: number;
}

// ============================================================================
// INTERFACES DE RESULTADO
// ============================================================================

/**
 * Resultado de creación de evento.
 */
export interface EventCreationResult {
  /** Evento creado */
  event: SignedEvent;
  /** Si la creación fue exitosa */
  success: boolean;
  /** Mensaje de error si falló */
  error?: string;
}

/**
 * Resultado de verificación de evento.
 */
export interface EventVerificationResult {
  /** Si el evento es válido */
  is_valid: boolean;
  /** Hash recalculado */
  computed_hash: string;
  /** Si el hash coincide */
  hash_matches: boolean;
  /** Si la firma es válida */
  signature_valid: boolean;
  /** Mensaje de error si falló */
  error?: string;
}

// ============================================================================
// COMPATIBILIDAD HACIA ATRÁS
// ============================================================================

/** @deprecated Use EventMetadata instead */
export type EventPayload = EventMetadata;

/** @deprecated Use actor_public_key instead */
export type PublicKey = string;
