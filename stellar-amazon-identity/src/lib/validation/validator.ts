/**
 * ============================================================================
 * AMARUID - VALIDATION LAYER
 * ============================================================================
 * 
 * Módulo de validación con lógica de threshold (k-of-n signatures).
 * 
 * CONCEPTO:
 * Un evento se considera validado cuando alcanza >= k firmas válidas
 * de un conjunto de n validadores autorizados.
 * 
 * CARACTERÍSTICAS:
 * - Lista configurable de validadores
 * - Verificación de firmas individuales
 * - Conteo de firmas válidas
 * - Generación de certificados de validación
 * - Funciones puras sin efectos secundarios
 * 
 * @module validation/validator
 * @author AMARUID Team
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { signString, verifyString, isValidPublicKey } from '../crypto/identity';
import type { 
  SignedEvent, 
  ValidationSignature, 
  ValidationCertificate,
  ThresholdConfig 
} from '../events/types';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Configuración de un validador.
 */
export interface Validator {
  /** Clave pública del validador */
  publicKey: string;
  /** Nombre legible del validador */
  name: string;
  /** Si el validador está activo */
  active: boolean;
  /** Rol del validador (opcional) */
  role?: 'leader' | 'elder' | 'witness';
}

/**
 * Resultado de validación de un evento.
 */
export interface ValidationResult {
  /** Si el evento alcanzó el threshold */
  isValidated: boolean;
  /** Número de firmas válidas */
  validSignatures: number;
  /** Número de firmas requeridas */
  requiredSignatures: number;
  /** Detalle por cada firma */
  signatureDetails: {
    validator: string;
    valid: boolean;
    timestamp: number;
  }[];
  /** Certificado si se alcanzó el threshold */
  certificate?: ValidationCertificate;
}

/**
 * Estado de validación pendiente.
 */
export interface PendingValidation {
  /** ID del evento */
  eventId: string;
  /** Hash del evento */
  eventHash: string;
  /** Firmas recolectadas */
  signatures: ValidationSignature[];
  /** Configuración de threshold */
  threshold: ThresholdConfig;
  /** Timestamp de inicio */
  startedAt: number;
}

// ============================================================================
// CLASE PRINCIPAL: ValidatorRegistry
// ============================================================================

/**
 * Registro de validadores autorizados.
 * Gestiona la lista de validadores y sus estados.
 */
export class ValidatorRegistry {
  private validators: Map<string, Validator> = new Map();

  /**
   * Agrega un validador al registro.
   * 
   * @param publicKey - Clave pública del validador
   * @param name - Nombre del validador
   * @param role - Rol opcional
   */
  addValidator(publicKey: string, name: string, role?: Validator['role']): void {
    if (!isValidPublicKey(publicKey)) {
      throw new Error(`Invalid public key: ${publicKey}`);
    }
    
    this.validators.set(publicKey, {
      publicKey,
      name,
      active: true,
      role,
    });
  }

  /**
   * Remueve un validador del registro.
   */
  removeValidator(publicKey: string): boolean {
    return this.validators.delete(publicKey);
  }

  /**
   * Desactiva un validador sin removerlo.
   */
  deactivateValidator(publicKey: string): void {
    const validator = this.validators.get(publicKey);
    if (validator) {
      validator.active = false;
    }
  }

  /**
   * Activa un validador.
   */
  activateValidator(publicKey: string): void {
    const validator = this.validators.get(publicKey);
    if (validator) {
      validator.active = true;
    }
  }

  /**
   * Verifica si una clave pública es un validador activo.
   */
  isActiveValidator(publicKey: string): boolean {
    const validator = this.validators.get(publicKey);
    return validator?.active ?? false;
  }

  /**
   * Obtiene todos los validadores activos.
   */
  getActiveValidators(): Validator[] {
    return Array.from(this.validators.values()).filter(v => v.active);
  }

  /**
   * Obtiene el número de validadores activos.
   */
  getActiveCount(): number {
    return this.getActiveValidators().length;
  }

  /**
   * Obtiene un validador por su clave pública.
   */
  getValidator(publicKey: string): Validator | undefined {
    return this.validators.get(publicKey);
  }

  /**
   * Exporta la lista de validadores.
   */
  export(): Validator[] {
    return Array.from(this.validators.values());
  }

  /**
   * Importa una lista de validadores.
   */
  import(validators: Validator[]): void {
    this.validators.clear();
    for (const v of validators) {
      this.validators.set(v.publicKey, v);
    }
  }
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Crea una firma de validación para un evento.
 * 
 * @param event - Evento a validar
 * @param validatorKeypair - Keypair del validador
 * @returns Firma de validación
 */
export function createValidationSignature(
  event: SignedEvent,
  validatorKeypair: StellarSdk.Keypair
): ValidationSignature {
  const signature = signString(event.metadata_hash, validatorKeypair);
  
  return {
    validator_public_key: validatorKeypair.publicKey(),
    signature,
    timestamp: Date.now(),
  };
}

/**
 * Verifica una firma de validación individual.
 * 
 * @param eventHash - Hash del evento
 * @param validation - Firma a verificar
 * @returns true si la firma es válida
 */
export function verifyValidationSignature(
  eventHash: string,
  validation: ValidationSignature
): boolean {
  return verifyString(
    eventHash,
    validation.signature,
    validation.validator_public_key
  );
}

/**
 * Verifica todas las firmas de validación de un evento.
 * Retorna detalles de cada verificación.
 * 
 * @param event - Evento con validaciones
 * @returns Array con resultado por cada firma
 */
export function verifyAllValidations(
  event: SignedEvent
): { validator: string; valid: boolean; timestamp: number }[] {
  return event.validations.map(validation => ({
    validator: validation.validator_public_key,
    valid: verifyValidationSignature(event.metadata_hash, validation),
    timestamp: validation.timestamp,
  }));
}

/**
 * Cuenta las firmas válidas de un evento.
 * 
 * @param event - Evento a verificar
 * @returns Número de firmas válidas
 */
export function countValidSignatures(event: SignedEvent): number {
  return event.validations.filter(v => 
    verifyValidationSignature(event.metadata_hash, v)
  ).length;
}

/**
 * Cuenta las firmas válidas de validadores autorizados.
 * Solo cuenta firmas de validadores en el registro.
 * 
 * @param event - Evento a verificar
 * @param registry - Registro de validadores
 * @returns Número de firmas válidas de validadores autorizados
 */
export function countAuthorizedValidSignatures(
  event: SignedEvent,
  registry: ValidatorRegistry
): number {
  return event.validations.filter(v => 
    registry.isActiveValidator(v.validator_public_key) &&
    verifyValidationSignature(event.metadata_hash, v)
  ).length;
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

/**
 * Verifica si un evento ha alcanzado el threshold con validadores autorizados.
 * 
 * @param event - Evento a verificar
 * @param required - Número de firmas requeridas
 * @param registry - Registro de validadores
 * @returns true si tiene suficientes firmas de validadores autorizados
 */
export function hasReachedAuthorizedThreshold(
  event: SignedEvent,
  required: number,
  registry: ValidatorRegistry
): boolean {
  return countAuthorizedValidSignatures(event, registry) >= required;
}

// ============================================================================
// FUNCIONES DE CERTIFICACIÓN
// ============================================================================

/**
 * Genera un certificado de validación para un evento.
 * Solo se genera si el evento alcanzó el threshold.
 * 
 * @param event - Evento validado
 * @param threshold - Configuración de threshold
 * @returns Certificado o null si no alcanzó threshold
 */
export function generateValidationCertificate(
  event: SignedEvent,
  threshold: ThresholdConfig
): ValidationCertificate | null {
  const validSignatures = event.validations.filter(v =>
    verifyValidationSignature(event.metadata_hash, v)
  );

  if (validSignatures.length < threshold.required) {
    return null;
  }

  return {
    event_hash: event.metadata_hash,
    event_id: event.id,
    signatures: validSignatures,
    threshold,
    validated_at: Date.now(),
  };
}

/**
 * Valida un evento completo y retorna resultado detallado.
 * 
 * @param event - Evento a validar
 * @param threshold - Configuración de threshold
 * @param registry - Registro de validadores (opcional)
 * @returns Resultado de validación completo
 */
export function validateEvent(
  event: SignedEvent,
  threshold: ThresholdConfig,
  registry?: ValidatorRegistry
): ValidationResult {
  const signatureDetails = verifyAllValidations(event);
  
  let validSignatures: number;
  if (registry) {
    validSignatures = signatureDetails.filter(
      s => s.valid && registry.isActiveValidator(s.validator)
    ).length;
  } else {
    validSignatures = signatureDetails.filter(s => s.valid).length;
  }

  const isValidated = validSignatures >= threshold.required;
  
  let certificate: ValidationCertificate | undefined;
  if (isValidated) {
    certificate = generateValidationCertificate(event, threshold) ?? undefined;
  }

  return {
    isValidated,
    validSignatures,
    requiredSignatures: threshold.required,
    signatureDetails,
    certificate,
  };
}

// ============================================================================
// FUNCIONES DE GESTIÓN DE VALIDACIÓN PENDIENTE
// ============================================================================

/**
 * Crea un objeto de validación pendiente.
 * 
 * @param event - Evento a validar
 * @param threshold - Configuración de threshold
 * @returns Objeto de validación pendiente
 */
export function createPendingValidation(
  event: SignedEvent,
  threshold: ThresholdConfig
): PendingValidation {
  return {
    eventId: event.id,
    eventHash: event.metadata_hash,
    signatures: [...event.validations],
    threshold,
    startedAt: Date.now(),
  };
}

/**
 * Agrega una firma a una validación pendiente.
 * Función pura que retorna nueva validación pendiente.
 * 
 * @param pending - Validación pendiente actual
 * @param signature - Nueva firma a agregar
 * @returns Nueva validación pendiente con la firma
 */
export function addSignatureToPending(
  pending: PendingValidation,
  signature: ValidationSignature
): PendingValidation {
  // Evitar duplicados
  const exists = pending.signatures.some(
    s => s.validator_public_key === signature.validator_public_key
  );
  
  if (exists) {
    return pending;
  }

  return {
    ...pending,
    signatures: [...pending.signatures, signature],
  };
}

/**
 * Verifica si una validación pendiente está completa.
 * 
 * @param pending - Validación pendiente
 * @returns true si alcanzó el threshold
 */
export function isPendingComplete(pending: PendingValidation): boolean {
  const validCount = pending.signatures.filter(s =>
    verifyValidationSignature(pending.eventHash, s)
  ).length;
  
  return validCount >= pending.threshold.required;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Crea una configuración de threshold.
 * 
 * @param required - Firmas requeridas
 * @param total - Total de validadores
 * @returns Configuración de threshold
 */
export function createThresholdConfig(
  required: number,
  total: number
): ThresholdConfig {
  if (required > total) {
    throw new Error('Required signatures cannot exceed total validators');
  }
  if (required < 1) {
    throw new Error('At least 1 signature is required');
  }
  
  return { required, total };
}

/**
 * Calcula el threshold recomendado para un número de validadores.
 * Usa la fórmula: ceil(n * 2/3) para tolerancia bizantina.
 * 
 * @param totalValidators - Número total de validadores
 * @returns Número de firmas recomendadas
 */
export function calculateRecommendedThreshold(totalValidators: number): number {
  return Math.ceil(totalValidators * 2 / 3);
}

/**
 * Serializa un certificado de validación.
 */
export function serializeCertificate(cert: ValidationCertificate): string {
  return JSON.stringify(cert);
}

/**
 * Deserializa un certificado de validación.
 */
export function deserializeCertificate(data: string): ValidationCertificate {
  return JSON.parse(data) as ValidationCertificate;
}
