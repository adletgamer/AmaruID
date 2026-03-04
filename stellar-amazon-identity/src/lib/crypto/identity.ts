/**
 * ============================================================================
 * AMARUID - IDENTITY LAYER
 * ============================================================================
 * 
 * Módulo de identidad digital offline-first para comunidades amazónicas.
 * 
 * CARACTERÍSTICAS:
 * - Generación de keypair Ed25519 completamente offline
 * - Cifrado de clave privada con AES-256-GCM
 * - Derivación de clave con PBKDF2 (100,000 iteraciones)
 * - Funciones puras sin efectos secundarios
 * - Compatible con Stellar blockchain
 * 
 * SEGURIDAD:
 * - La clave privada NUNCA se expone sin cifrar
 * - Salt y IV únicos por identidad
 * - Verificación de firmas sin necesidad de clave privada
 * 
 * @module identity
 * @author AMARUID Team
 * @license MIT
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { sha256 } from './hash';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Identidad cifrada para almacenamiento seguro.
 * Contiene todos los datos necesarios para reconstruir la identidad
 * cuando el usuario proporciona su passphrase.
 */
export interface EncryptedIdentity {
  /** Clave pública Ed25519 en formato Stellar (G...) */
  publicKey: string;
  /** Identificador corto derivado del hash de la clave pública (16 bytes hex) */
  identifier: string;
  /** Clave privada cifrada con AES-256-GCM (base64) */
  encryptedPrivateKey: string;
  /** Vector de inicialización para AES-GCM (base64) */
  iv: string;
  /** Salt para derivación PBKDF2 (base64) */
  salt: string;
  /** Timestamp de creación */
  createdAt: number;
}

/**
 * Identidad desbloqueada con acceso a la clave privada.
 * ADVERTENCIA: Mantener en memoria solo el tiempo necesario.
 */
export interface UnlockedIdentity {
  /** Clave pública Ed25519 en formato Stellar (G...) */
  publicKey: string;
  /** Clave secreta en formato Stellar (S...) - SENSIBLE */
  secretKey: string;
  /** Identificador corto (16 bytes hex) */
  identifier: string;
  /** Objeto Keypair de Stellar SDK para operaciones criptográficas */
  keypair: StellarSdk.Keypair;
}

/**
 * Resultado de una operación de firma.
 */
export interface SignatureResult {
  /** Datos originales que fueron firmados */
  data: string;
  /** Firma en formato hexadecimal */
  signature: string;
  /** Clave pública del firmante */
  publicKey: string;
  /** Timestamp de la firma */
  timestamp: number;
}

/**
 * Resultado de verificación de firma.
 */
export interface VerificationResult {
  /** Si la firma es válida */
  isValid: boolean;
  /** Clave pública del firmante */
  publicKey: string;
  /** Mensaje de error si la verificación falló */
  error?: string;
}

// ============================================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================================

/** Iteraciones PBKDF2 - Balance entre seguridad y rendimiento */
const PBKDF2_ITERATIONS = 100000;

/** Longitud de clave AES en bits */
const AES_KEY_LENGTH = 256;

/** Longitud del salt en bytes */
const SALT_LENGTH = 16;

/** Longitud del IV para AES-GCM en bytes */
const IV_LENGTH = 12;

/** Longitud del identificador en caracteres hex */
const IDENTIFIER_LENGTH = 32;

// ============================================================================
// FUNCIONES AUXILIARES PURAS
// ============================================================================

/**
 * Convierte un ArrayBuffer a string Base64.
 * Función pura sin efectos secundarios.
 * 
 * @param buffer - ArrayBuffer a convertir
 * @returns String en formato Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convierte un string Base64 a ArrayBuffer.
 * Función pura sin efectos secundarios.
 * 
 * @param base64 - String en formato Base64
 * @returns ArrayBuffer con los datos decodificados
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convierte bytes a string hexadecimal.
 * Función pura sin efectos secundarios.
 * 
 * @param bytes - Uint8Array a convertir
 * @returns String hexadecimal
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte string hexadecimal a bytes.
 * Función pura sin efectos secundarios.
 * 
 * @param hex - String hexadecimal
 * @returns Uint8Array con los bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hex string');
  }
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Deriva una clave AES-256 a partir de un passphrase usando PBKDF2.
 * 
 * @param passphrase - Contraseña del usuario
 * @param salt - Salt único para esta derivación
 * @returns CryptoKey para operaciones AES-GCM
 */
async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // Importar passphrase como clave PBKDF2
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derivar clave AES-256
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// FUNCIONES PRINCIPALES DE IDENTIDAD
// ============================================================================

/**
 * Genera un nuevo par de claves Ed25519.
 * Función pura que no almacena nada - solo genera.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @returns Objeto con publicKey y secretKey
 * 
 * @example
 * const { publicKey, secretKey, keypair } = generateKeypair();
 * console.log('Public Key:', publicKey); // G...
 */
export function generateKeypair(): {
  publicKey: string;
  secretKey: string;
  keypair: StellarSdk.Keypair;
} {
  const keypair = StellarSdk.Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
    keypair,
  };
}

/**
 * Genera una identidad cifrada a partir de un passphrase.
 * La clave privada se cifra con AES-256-GCM antes de retornar.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param passphrase - Contraseña para cifrar la clave privada
 * @returns Identidad cifrada lista para almacenar
 * 
 * @example
 * const identity = await generateIdentity('mi-contraseña-segura');
 * console.log('Public Key:', identity.publicKey);
 * // Guardar identity en storage seguro
 */
export async function generateIdentity(passphrase: string): Promise<EncryptedIdentity> {
  // 1. Generar keypair Ed25519
  const { publicKey, secretKey } = generateKeypair();

  // 2. Derivar identificador corto del hash de la clave pública
  const fullHash = await sha256(publicKey);
  const identifier = fullHash.slice(0, IDENTIFIER_LENGTH);

  // 3. Generar salt e IV aleatorios
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // 4. Derivar clave de cifrado del passphrase
  const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);

  // 5. Cifrar la clave privada
  const encoder = new TextEncoder();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encoder.encode(secretKey)
  );

  // 6. Retornar identidad cifrada
  return {
    publicKey,
    identifier,
    encryptedPrivateKey: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    createdAt: Date.now(),
  };
}

/**
 * Desbloquea una identidad cifrada usando el passphrase.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param encrypted - Identidad cifrada
 * @param passphrase - Contraseña para descifrar
 * @returns Identidad desbloqueada con acceso a clave privada
 * @throws Error si el passphrase es incorrecto
 * 
 * @example
 * const unlocked = await unlockIdentity(storedIdentity, 'mi-contraseña');
 * // Usar unlocked.keypair para firmar
 */
export async function unlockIdentity(
  encrypted: EncryptedIdentity,
  passphrase: string
): Promise<UnlockedIdentity> {
  // 1. Decodificar salt, IV y datos cifrados
  const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));
  const encryptedData = base64ToArrayBuffer(encrypted.encryptedPrivateKey);

  // 2. Derivar clave de descifrado
  const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);

  // 3. Descifrar clave privada
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    encryptedData
  );

  // 4. Reconstruir keypair
  const decoder = new TextDecoder();
  const secretKey = decoder.decode(decryptedBuffer);
  const keypair = StellarSdk.Keypair.fromSecret(secretKey);

  return {
    publicKey: encrypted.publicKey,
    secretKey,
    identifier: encrypted.identifier,
    keypair,
  };
}

// ============================================================================
// FUNCIONES DE FIRMA Y VERIFICACIÓN
// ============================================================================

/**
 * Firma datos binarios con una clave privada Ed25519.
 * Función pura que retorna la firma en formato hexadecimal.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param data - Datos a firmar (Uint8Array)
 * @param keypair - Keypair con clave privada
 * @returns Firma en formato hexadecimal (128 caracteres)
 * 
 * @example
 * const signature = signBytes(dataBytes, keypair);
 */
export function signBytes(data: Uint8Array, keypair: StellarSdk.Keypair): string {
  const signature = keypair.sign(Buffer.from(data));
  return bytesToHex(new Uint8Array(signature));
}

/**
 * Firma un string con una clave privada Ed25519.
 * El string se codifica como UTF-8 antes de firmar.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param data - String a firmar
 * @param keypair - Keypair con clave privada
 * @returns Firma en formato hexadecimal
 * 
 * @example
 * const signature = signString('Hello World', keypair);
 */
export function signString(data: string, keypair: StellarSdk.Keypair): string {
  const encoder = new TextEncoder();
  return signBytes(encoder.encode(data), keypair);
}

/**
 * Firma un objeto JSON de forma determinística.
 * Las claves se ordenan alfabéticamente para garantizar consistencia.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param obj - Objeto a firmar
 * @param keypair - Keypair con clave privada
 * @returns SignatureResult con datos, firma y metadata
 * 
 * @example
 * const result = signJson({ action: 'plant_tree', count: 5 }, keypair);
 * console.log(result.signature);
 */
export function signJson(
  obj: Record<string, unknown>,
  keypair: StellarSdk.Keypair
): SignatureResult {
  // Serialización determinística: claves ordenadas alfabéticamente
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  
  const jsonString = JSON.stringify(sortedObj);
  const signature = signString(jsonString, keypair);
  
  return {
    data: jsonString,
    signature,
    publicKey: keypair.publicKey(),
    timestamp: Date.now(),
  };
}

/**
 * Verifica una firma sobre datos binarios.
 * Función pura que no requiere clave privada.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param data - Datos originales
 * @param signatureHex - Firma en formato hexadecimal
 * @param publicKey - Clave pública del firmante
 * @returns true si la firma es válida
 * 
 * @example
 * const isValid = verifyBytes(dataBytes, signature, publicKey);
 */
export function verifyBytes(
  data: Uint8Array,
  signatureHex: string,
  publicKey: string
): boolean {
  try {
    const signature = hexToBytes(signatureHex);
    const kp = StellarSdk.Keypair.fromPublicKey(publicKey);
    return kp.verify(Buffer.from(data), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Verifica una firma sobre un string.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param data - String original
 * @param signatureHex - Firma en formato hexadecimal
 * @param publicKey - Clave pública del firmante
 * @returns true si la firma es válida
 */
export function verifyString(
  data: string,
  signatureHex: string,
  publicKey: string
): boolean {
  const encoder = new TextEncoder();
  return verifyBytes(encoder.encode(data), signatureHex, publicKey);
}

/**
 * Verifica una firma sobre un objeto JSON.
 * El objeto se serializa de forma determinística antes de verificar.
 * 
 * OFFLINE: ✅ Funciona completamente sin internet.
 * 
 * @param obj - Objeto original
 * @param signatureHex - Firma en formato hexadecimal
 * @param publicKey - Clave pública del firmante
 * @returns VerificationResult con estado y detalles
 * 
 * @example
 * const result = verifyJson({ action: 'plant_tree', count: 5 }, signature, publicKey);
 * if (result.isValid) {
 *   console.log('Firma válida!');
 * }
 */
export function verifyJson(
  obj: Record<string, unknown>,
  signatureHex: string,
  publicKey: string
): VerificationResult {
  try {
    // Serialización determinística
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }
    
    const jsonString = JSON.stringify(sortedObj);
    const isValid = verifyString(jsonString, signatureHex, publicKey);
    
    return {
      isValid,
      publicKey,
      error: isValid ? undefined : 'Signature verification failed',
    };
  } catch (error) {
    return {
      isValid: false,
      publicKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Deriva un identificador corto a partir de una clave pública.
 * Útil para mostrar identificadores legibles al usuario.
 * 
 * @param publicKey - Clave pública en formato Stellar
 * @returns Identificador de 32 caracteres hexadecimales
 */
export async function getIdentifierFromPublicKey(publicKey: string): Promise<string> {
  const hash = await sha256(publicKey);
  return hash.slice(0, IDENTIFIER_LENGTH);
}

/**
 * Valida si una clave pública tiene formato correcto.
 * 
 * @param publicKey - String a validar
 * @returns true si es una clave pública válida
 */
export function isValidPublicKey(publicKey: string): boolean {
  try {
    StellarSdk.Keypair.fromPublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida si una clave secreta tiene formato correcto.
 * 
 * @param secretKey - String a validar
 * @returns true si es una clave secreta válida
 */
export function isValidSecretKey(secretKey: string): boolean {
  try {
    StellarSdk.Keypair.fromSecret(secretKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reconstruye un Keypair a partir de una clave secreta.
 * 
 * @param secretKey - Clave secreta en formato Stellar (S...)
 * @returns Keypair de Stellar SDK
 */
export function keypairFromSecret(secretKey: string): StellarSdk.Keypair {
  return StellarSdk.Keypair.fromSecret(secretKey);
}

/**
 * Trunca una clave para mostrar de forma legible.
 * 
 * @param key - Clave a truncar
 * @param chars - Caracteres a mostrar en cada extremo (default: 6)
 * @returns Clave truncada (ej: "GABCD...WXYZ")
 */
export function truncateKey(key: string, chars: number = 6): string {
  if (key.length <= chars * 2) return key;
  return `${key.substring(0, chars)}...${key.substring(key.length - chars)}`;
}

// ============================================================================
// EXPORTS LEGACY (compatibilidad hacia atrás)
// ============================================================================

/** @deprecated Use signBytes instead */
export const signData = signBytes;

/** @deprecated Use verifyBytes instead */
export const verifySignature = verifyBytes;
