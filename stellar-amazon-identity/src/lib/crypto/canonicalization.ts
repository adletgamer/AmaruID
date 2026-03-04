/**
 * ============================================================================
 * AMARUID - CANONICAL JSON SPECIFICATION
 * ============================================================================
 * 
 * FORMAL SPECIFICATION FOR DETERMINISTIC JSON SERIALIZATION
 * 
 * This module implements RFC 8785 (JSON Canonicalization Scheme) inspired
 * canonicalization for cryptographic hashing of JSON objects.
 * 
 * ============================================================================
 * SPECIFICATION
 * ============================================================================
 * 
 * 1. KEY ORDERING
 *    - All object keys MUST be sorted lexicographically (Unicode code point order)
 *    - Sorting is recursive (applies to nested objects)
 *    - Arrays maintain their original order (elements are NOT sorted)
 * 
 * 2. ENCODING
 *    - Output encoding: UTF-8
 *    - No BOM (Byte Order Mark)
 *    - No trailing newlines
 * 
 * 3. WHITESPACE
 *    - No whitespace between tokens
 *    - No indentation
 *    - No trailing spaces
 * 
 * 4. STRING ESCAPING
 *    - Standard JSON escaping (RFC 8259)
 *    - Unicode characters above U+001F are NOT escaped
 * 
 * 5. NUMBER FORMATTING
 *    - No leading zeros
 *    - No trailing zeros after decimal point
 *    - Exponential notation for very large/small numbers
 * 
 * 6. SPECIAL VALUES
 *    - null → "null"
 *    - true → "true"
 *    - false → "false"
 *    - undefined properties are OMITTED
 * 
 * ============================================================================
 * HASH ALGORITHM
 * ============================================================================
 * 
 * EventHash = SHA-256( CanonicalJSON(event_metadata) )
 * 
 * Where:
 *   - SHA-256 is the hash function (FIPS 180-4)
 *   - CanonicalJSON is this module's deterministicStringify function
 *   - Output is lowercase hexadecimal (64 characters)
 * 
 * ============================================================================
 * SECURITY CONSIDERATIONS
 * ============================================================================
 * 
 * - Deterministic output prevents signature malleability
 * - Lexicographic ordering prevents key-order manipulation
 * - UTF-8 encoding prevents encoding-based attacks
 * - SHA-256 provides collision resistance (128-bit security)
 * 
 * @module crypto/canonicalization
 * @author AMARUID Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Hash algorithm used for event hashing.
 * SHA-256 provides 128-bit security level.
 */
export const HASH_ALGORITHM = 'SHA-256' as const;

/**
 * Output encoding for canonical JSON.
 */
export const ENCODING = 'UTF-8' as const;

/**
 * Version of the canonicalization specification.
 */
export const SPEC_VERSION = '1.0.0' as const;

// ============================================================================
// CANONICAL JSON IMPLEMENTATION
// ============================================================================

/**
 * Serializes any value to canonical JSON format.
 * 
 * GUARANTEES:
 * - Same input always produces same output
 * - Object keys are lexicographically sorted
 * - No whitespace between tokens
 * - UTF-8 encoding
 * 
 * @param value - Any JSON-serializable value
 * @returns Canonical JSON string
 * 
 * @example
 * // Keys are sorted alphabetically
 * canonicalize({ b: 1, a: 2 })
 * // Returns: '{"a":2,"b":1}'
 * 
 * @example
 * // Nested objects are also sorted
 * canonicalize({ z: { b: 1, a: 2 }, a: 1 })
 * // Returns: '{"a":1,"z":{"a":2,"b":1}}'
 * 
 * @example
 * // Arrays maintain order
 * canonicalize({ arr: [3, 1, 2] })
 * // Returns: '{"arr":[3,1,2]}'
 */
export function canonicalize(value: unknown): string {
  return canonicalizeValue(value);
}

/**
 * Internal recursive canonicalization function.
 */
function canonicalizeValue(value: unknown): string {
  // Handle null
  if (value === null) {
    return 'null';
  }
  
  // Handle undefined (should be omitted, but if passed directly, treat as null)
  if (value === undefined) {
    return 'null';
  }
  
  // Handle primitives
  const type = typeof value;
  
  if (type === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (type === 'number') {
    // Handle special number cases
    if (!Number.isFinite(value as number)) {
      return 'null'; // Infinity and NaN become null per JSON spec
    }
    return JSON.stringify(value);
  }
  
  if (type === 'string') {
    return JSON.stringify(value);
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    const elements = value.map(element => canonicalizeValue(element));
    return `[${elements.join(',')}]`;
  }
  
  // Handle objects
  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    
    // Get keys and sort lexicographically
    const sortedKeys = Object.keys(obj)
      .filter(key => obj[key] !== undefined) // Omit undefined values
      .sort((a, b) => {
        // Lexicographic comparison using Unicode code points
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
    
    const pairs = sortedKeys.map(key => {
      const canonicalKey = JSON.stringify(key);
      const canonicalValue = canonicalizeValue(obj[key]);
      return `${canonicalKey}:${canonicalValue}`;
    });
    
    return `{${pairs.join(',')}}`;
  }
  
  // Fallback for other types (functions, symbols, etc.)
  return 'null';
}

// ============================================================================
// HASH FUNCTIONS
// ============================================================================

/**
 * Computes SHA-256 hash of canonical JSON.
 * 
 * FORMULA: SHA-256( CanonicalJSON(value) )
 * 
 * @param value - Value to hash
 * @returns SHA-256 hash as lowercase hex string (64 chars)
 * 
 * @example
 * const hash = await canonicalHash({ action: 'plant_tree', count: 5 });
 * // Returns: '3a7bd3e2c...' (64 hex characters)
 */
export async function canonicalHash(value: unknown): Promise<string> {
  const canonical = canonicalize(value);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes hash of a pre-canonicalized string.
 * Use this when you already have canonical JSON.
 * 
 * @param canonicalJson - Already canonicalized JSON string
 * @returns SHA-256 hash as lowercase hex string
 */
export async function hashCanonical(canonicalJson: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalJson);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verifies that a hash matches the canonical hash of a value.
 * 
 * @param value - Original value
 * @param expectedHash - Expected hash to verify against
 * @returns true if hash matches
 */
export async function verifyCanonicalHash(
  value: unknown,
  expectedHash: string
): Promise<boolean> {
  const computedHash = await canonicalHash(value);
  return computedHash === expectedHash.toLowerCase();
}

/**
 * Compares two values for canonical equality.
 * Two values are canonically equal if their canonical JSON is identical.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns true if canonically equal
 */
export function canonicalEquals(a: unknown, b: unknown): boolean {
  return canonicalize(a) === canonicalize(b);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates that a string is valid canonical JSON.
 * 
 * @param json - JSON string to validate
 * @returns true if the string is valid canonical JSON
 */
export function isCanonical(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    const recanonical = canonicalize(parsed);
    return json === recanonical;
  } catch {
    return false;
  }
}

/**
 * Returns the byte length of canonical JSON in UTF-8.
 * 
 * @param value - Value to measure
 * @returns Byte length
 */
export function canonicalByteLength(value: unknown): number {
  const canonical = canonicalize(value);
  const encoder = new TextEncoder();
  return encoder.encode(canonical).length;
}

/**
 * Creates a hash commitment for a value.
 * Useful for commit-reveal schemes.
 * 
 * @param value - Value to commit
 * @param nonce - Random nonce for hiding
 * @returns Commitment hash
 */
export async function createCommitment(
  value: unknown,
  nonce: string
): Promise<string> {
  return canonicalHash({ value, nonce });
}

/**
 * Verifies a commitment.
 * 
 * @param value - Revealed value
 * @param nonce - Revealed nonce
 * @param commitment - Original commitment hash
 * @returns true if commitment is valid
 */
export async function verifyCommitment(
  value: unknown,
  nonce: string,
  commitment: string
): Promise<boolean> {
  const computed = await createCommitment(value, nonce);
  return computed === commitment;
}

// ============================================================================
// SPECIFICATION METADATA
// ============================================================================

/**
 * Returns the specification metadata for documentation.
 */
export function getSpecification(): {
  version: string;
  hashAlgorithm: string;
  encoding: string;
  keyOrdering: string;
  formula: string;
} {
  return {
    version: SPEC_VERSION,
    hashAlgorithm: HASH_ALGORITHM,
    encoding: ENCODING,
    keyOrdering: 'lexicographic (Unicode code point order)',
    formula: 'EventHash = SHA-256( CanonicalJSON(event_metadata) )',
  };
}
