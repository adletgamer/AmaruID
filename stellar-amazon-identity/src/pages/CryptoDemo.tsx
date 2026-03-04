/**
 * AMARUID - CRYPTO DEMO PAGE
 * Demostración interactiva de Identity, Event y Validation Layers
 */

import { useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  generateKeypair,
  signJson,
  verifyJson,
  truncateKey,
  type SignatureResult,
  type VerificationResult,
} from '@/lib/crypto/identity';
import {
  createEvent,
  verifyEvent,
  addValidation,
} from '@/lib/events/signedEvent';
import type { SignedEvent } from '@/lib/events/types';
import {
  ValidatorRegistry,
  validateEvent,
  createThresholdConfig,
  type ValidationResult,
} from '@/lib/validation/validator';

type TabType = 'identity' | 'events' | 'validation';

export default function CryptoDemo() {
  const [activeTab, setActiveTab] = useState<TabType>('identity');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔐 AMARUID Crypto Demo</h1>
        <p className="text-gray-600 mb-6">
          Demostración interactiva de las capas criptográficas offline-first
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['identity', 'events', 'validation'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'identity' && '🔑 Identity'}
              {tab === 'events' && '📝 Events'}
              {tab === 'validation' && '✅ Validation'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'identity' && <IdentityDemo />}
        {activeTab === 'events' && <EventDemo />}
        {activeTab === 'validation' && <ValidationDemo />}
      </div>
    </div>
  );
}

function IdentityDemo() {
  const [keypair, setKeypair] = useState<StellarSdk.Keypair | null>(null);
  const [publicKey, setPublicKey] = useState('');
  const [jsonInput, setJsonInput] = useState('{\n  "action": "plant_tree",\n  "count": 5\n}');
  const [signature, setSignature] = useState<SignatureResult | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  const handleGenerate = () => {
    const result = generateKeypair();
    setKeypair(result.keypair);
    setPublicKey(result.publicKey);
    setSignature(null);
    setVerification(null);
  };

  const handleSign = () => {
    if (!keypair) return;
    try {
      const obj = JSON.parse(jsonInput);
      const result = signJson(obj, keypair);
      setSignature(result);
      setVerification(null);
    } catch (err) {
      console.error('Error signing:', err);
    }
  };

  const handleVerify = () => {
    if (!signature) return;
    try {
      const obj = JSON.parse(jsonInput);
      const result = verifyJson(obj, signature.signature, signature.publicKey);
      setVerification(result);
    } catch (err) {
      console.error('Error verifying:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Generate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">🔑 Paso 1: Generar Keypair Ed25519</h2>
        <p className="text-gray-600 text-sm mb-4">Genera un par de claves criptográficas offline</p>
        
        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Generar Nuevo Keypair
        </button>

        {publicKey && (
          <div className="mt-4 space-y-2">
            <div>
              <span className="text-sm text-gray-500">Public Key:</span>
              <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                {publicKey}
              </code>
            </div>
            <div>
              <span className="text-sm text-gray-500">Truncated:</span>
              <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm font-mono">
                {truncateKey(publicKey)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Sign */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">✍️ Paso 2: Firmar JSON</h2>
        <p className="text-gray-600 text-sm mb-4">Firma un objeto JSON de forma determinística</p>

        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-1">JSON a firmar:</label>
          <textarea
            value={jsonInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm"
            rows={4}
          />
        </div>

        <button
          onClick={handleSign}
          disabled={!keypair}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          ✍️ Firmar JSON
        </button>

        {signature && (
          <div className="mt-4 p-4 bg-gray-50 rounded space-y-2">
            <div>
              <span className="text-sm text-gray-500">Firma (hex):</span>
              <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all max-h-20 overflow-auto">
                {signature.signature}
              </code>
            </div>
            <div>
              <span className="text-sm text-gray-500">Timestamp:</span>
              <span className="ml-2 text-sm">{new Date(signature.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Verify */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">🛡️ Paso 3: Verificar Firma</h2>
        <p className="text-gray-600 text-sm mb-4">Verifica la firma sin necesidad de conexión</p>

        <button
          onClick={handleVerify}
          disabled={!signature}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          ✓ Verificar Firma
        </button>

        {verification && (
          <div className={`mt-4 p-4 rounded ${verification.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
            {verification.isValid ? (
              <span className="text-green-800 font-medium">✅ Firma Válida</span>
            ) : (
              <span className="text-red-800 font-medium">❌ Firma Inválida: {verification.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventDemo() {
  const [keypair, setKeypair] = useState<StellarSdk.Keypair | null>(null);
  const [event, setEvent] = useState<SignedEvent | null>(null);
  const [eventType, setEventType] = useState('conservation');
  const [action, setAction] = useState('plant_trees');
  const [dataInput, setDataInput] = useState('{"count": 50, "species": "cedro"}');
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const handleGenerate = () => {
    const result = generateKeypair();
    setKeypair(result.keypair);
    setEvent(null);
    setVerifyStatus(null);
  };

  const handleCreateEvent = async () => {
    if (!keypair) return;
    try {
      const data = JSON.parse(dataInput);
      const newEvent = await createEvent(
        eventType as 'conservation' | 'endorsement' | 'claim' | 'certification',
        action,
        data,
        keypair
      );
      setEvent(newEvent);
      setVerifyStatus(null);
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleVerifyEvent = async () => {
    if (!event) return;
    const result = await verifyEvent(event);
    setVerifyStatus(result.is_valid ? 'valid' : `invalid: ${result.error}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">🔑 Actor Identity</h2>
        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Generar Identidad de Actor
        </button>
        {keypair && (
          <div className="mt-4">
            <span className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">
              {truncateKey(keypair.publicKey())}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">📝 Crear Evento Firmado</h2>
        <p className="text-gray-600 text-sm mb-4">Hash determinístico + Firma Ed25519</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Tipo:</label>
            <input
              value={eventType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventType(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Acción:</label>
            <input
              value={action}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAction(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-1">Datos (JSON):</label>
          <textarea
            value={dataInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDataInput(e.target.value)}
            className="w-full p-2 border rounded font-mono text-sm"
            rows={3}
          />
        </div>

        <button
          onClick={handleCreateEvent}
          disabled={!keypair}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          📝 Crear y Firmar Evento
        </button>

        {event && (
          <div className="mt-4 p-4 bg-gray-50 rounded space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ID:</span>
              <code className="text-xs">{event.id.slice(0, 16)}...</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status:</span>
              <span className="px-2 py-0.5 bg-yellow-200 rounded text-xs">{event.status}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Metadata Hash:</span>
              <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                {event.metadata_hash}
              </code>
            </div>
            <button
              onClick={handleVerifyEvent}
              className="w-full mt-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
            >
              🛡️ Verificar Evento
            </button>
            {verifyStatus && (
              <div className={`p-2 rounded ${verifyStatus === 'valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {verifyStatus === 'valid' ? '✅ Evento Válido' : `❌ ${verifyStatus}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ValidationDemo() {
  const [actorKeypair, setActorKeypair] = useState<StellarSdk.Keypair | null>(null);
  const [validators, setValidators] = useState<StellarSdk.Keypair[]>([]);
  const [event, setEvent] = useState<SignedEvent | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [threshold, setThreshold] = useState(2);

  const handleSetup = async () => {
    const actor = generateKeypair();
    setActorKeypair(actor.keypair);

    const newValidators = [
      generateKeypair().keypair,
      generateKeypair().keypair,
      generateKeypair().keypair,
    ];
    setValidators(newValidators);

    const newEvent = await createEvent(
      'conservation',
      'reforestation',
      { trees: 100, area: '5 hectares' },
      actor.keypair
    );
    setEvent(newEvent);
    setValidationResult(null);
  };

  const handleAddValidation = (index: number) => {
    if (!event || !validators[index]) return;
    const updated = addValidation(event, validators[index]);
    setEvent(updated);
    setValidationResult(null);
  };

  const handleCheckThreshold = () => {
    if (!event) return;
    const registry = new ValidatorRegistry();
    validators.forEach((v, i) => {
      registry.addValidator(v.publicKey(), `Validator ${i + 1}`, 'witness');
    });
    const config = createThresholdConfig(threshold, validators.length);
    const result = validateEvent(event, config, registry);
    setValidationResult(result);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">👥 Configuración de Validación</h2>
        <p className="text-gray-600 text-sm mb-4">Simula validación con múltiples firmantes</p>

        <button
          onClick={handleSetup}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Inicializar Demo (1 Actor + 3 Validadores)
        </button>

        {actorKeypair && (
          <div className="mt-4 space-y-2">
            <div>
              <span className="text-sm text-gray-500">Actor:</span>
              <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm font-mono">
                {truncateKey(actorKeypair.publicKey())}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Validadores:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {validators.map((v, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 rounded text-xs font-mono">
                    V{i + 1}: {truncateKey(v.publicKey(), 4)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {event && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">✍️ Agregar Validaciones</h2>
          <p className="text-gray-600 text-sm mb-4">Cada validador firma el hash del evento</p>

          <div className="p-3 bg-gray-50 rounded mb-4">
            <div className="text-sm">
              <span className="text-gray-500">Event Hash:</span>
              <code className="ml-2 text-xs">{event.metadata_hash.slice(0, 32)}...</code>
            </div>
            <div className="text-sm mt-1">
              <span className="text-gray-500">Validaciones:</span>
              <span className="ml-2 px-2 py-0.5 bg-blue-200 rounded text-xs">
                {event.validations.length} / {validators.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {validators.map((v, i) => {
              const hasValidated = event.validations.some(
                (val) => val.validator_public_key === v.publicKey()
              );
              return (
                <button
                  key={i}
                  onClick={() => handleAddValidation(i)}
                  disabled={hasValidated}
                  className={`py-2 px-3 rounded-lg transition ${
                    hasValidated
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {hasValidated ? '✓' : '+'} V{i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {event && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">🛡️ Verificar Threshold</h2>
          <p className="text-gray-600 text-sm mb-4">
            Evento validado si tiene {'>'}= k firmas válidas
          </p>

          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-500">Threshold (k):</label>
            <input
              type="number"
              min={1}
              max={validators.length}
              value={threshold}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThreshold(parseInt(e.target.value) || 1)}
              className="w-20 p-2 border rounded"
            />
            <span className="text-gray-500">de {validators.length} validadores</span>
          </div>

          <button
            onClick={handleCheckThreshold}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
          >
            ✓ Verificar Threshold
          </button>

          {validationResult && (
            <div className={`mt-4 p-4 rounded ${validationResult.isValidated ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <div className="font-medium mb-2">
                {validationResult.isValidated ? (
                  <span className="text-green-800">✅ Evento Validado</span>
                ) : (
                  <span className="text-yellow-800">
                    ⏳ Pendiente: {validationResult.validSignatures}/{validationResult.requiredSignatures} firmas
                  </span>
                )}
              </div>
              <div className="text-sm space-y-1">
                {validationResult.signatureDetails.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{s.valid ? '✓' : '✗'}</span>
                    <code className="text-xs">{truncateKey(s.validator, 4)}</code>
                  </div>
                ))}
              </div>
              {validationResult.certificate && (
                <div className="mt-3 p-2 bg-white rounded">
                  <span className="text-xs text-gray-500">Certificado generado</span>
                  <code className="block text-xs mt-1">
                    ID: {validationResult.certificate.event_id.slice(0, 16)}...
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
