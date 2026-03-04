# 🌿 AMARUID

### Identidad Digital y Reputación para Comunidades Indígenas Amazónicas
#### *Offline Verifiable Credential Anchoring Protocol (OVCAP)*

*Amaruid significa "espíritu de la selva" en la cosmovisión de varios pueblos amazónicos. Este proyecto lleva ese nombre porque busca capturar la esencia de quienes protegen nuestro pulmón verde.*

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)
![Offline-First](https://img.shields.io/badge/Offline--First-✓-orange)
![Bilingual](https://img.shields.io/badge/Idiomas-Español%20%7C%20English-red)

---

## 📋 TABLA DE CONTENIDOS

- [🇪🇸 Versión Español](#español)
- [🇬🇧 English Version](#english)
- [🏗 Arquitectura Técnica](#arquitectura-técnica)
- [🧠 Insights Potentes](#insights-potentes)
- [🧮 Sistema de Reputación (MVRS)](#sistema-de-reputación-mvrs)
- [🔧 Stack Tecnológico](#stack-tecnológico)
- [🚀 Inicio Rápido](#inicio-rápido)
- [📚 Documentación](#documentación)
- [🎯 Roadmap](#roadmap)
- [🤝 Cómo Contribuir](#cómo-contribuir)
- [📄 Licencia](#licencia)

---

<a name="español"></a>
## 🇪🇸 VERSIÓN ESPAÑOL

### 🌳 ¿Qué es AMARUID?

**AMARUID** es un protocolo experimental de infraestructura diseñado para permitir:

- ✨ Generación de identidad offline
- 📝 Registro de eventos sin conexión
- 🔐 Verificación criptográfica
- 👥 Validación multi-firma
- ⛓️ Anclaje periódico en blockchain pública (Stellar testnet)

A diferencia de la mayoría de sistemas Web3 que asumen conectividad constante, AMARUID está diseñado para operar en entornos con conectividad intermitente o limitada.

Este repositorio demuestra un prototipo funcional de credenciales verificables offline-first con garantías de anclaje público, aplicado específicamente a comunidades indígenas amazónicas.

### 🎯 Problema

La mayoría de sistemas blockchain asumen:

| Supuesto | Realidad en comunidades |
|----------|------------------------|
| 📶 Conectividad permanente | 📵 Conectividad intermitente o nula |
| ⚡ Interacción on-chain inmediata | ⏱️ Acceso periódico a internet |
| 🖥️ Coordinación backend centralizada | 👥 Gobernanza comunitaria descentralizada |

**AMARUID propone:** Integridad criptográfica local primero, anclaje público después.

### 🧠 Principios de Diseño

- 📴 **Offline-first por defecto** - Las operaciones críticas no requieren internet
- 🔒 **Integridad criptográfica en el borde** - Los datos son seguros localmente
- 🪶 **Huella mínima en blockchain** - Solo lo esencial va a la cadena
- 📦 **Anclaje en batch para escalabilidad** - Agrupación de eventos
- 👥 **Modelo compatible con gobernanza colectiva** - Validación multi-firma comunitaria
- 🔗 **Blockchain solo donde agrega garantías reales** - Uso selectivo de la tecnología

### ✨ Características Principales

| Característica | Descripción |
|----------------|-------------|
| 🏘️ **Identidad Colectiva** | La comunidad crea una wallet multisig que representa a la asamblea |
| 👤 **Identidad Individual** | Cada miembro genera su identidad digital sin necesidad de internet |
| 🔏 **Certificación Comunitaria** | La asamblea certifica a sus miembros mediante un asset personalizado "COMMCERT" |
| 🌿 **Acciones de Conservación** | Registro de actividades ambientales con evidencia fotográfica (offline-capable) |
| 📊 **Sistema de Reputación (MVRS)** | Puntaje basado en acciones verificadas, endosos y tiempo activo |
| 🔗 **Verificación Pública** | Cualquier persona puede verificar la identidad y reputación en Stellar Explorer |

---

<a name="english"></a>
## 🇬🇧 ENGLISH VERSION

### 🌳 What is AMARUID?

**AMARUID** is an experimental infrastructure protocol designed to enable:

- ✨ Offline identity generation
- 📝 Offline event logging
- 🔐 Cryptographic verification
- 👥 Multi-signature validation
- ⛓️ Periodic anchoring to a public blockchain (Stellar testnet)

Unlike most Web3 systems that assume constant connectivity, AMARUID is built for environments with intermittent or limited internet access.

This repository demonstrates a functional prototype of offline-first verifiable credentials with public anchoring guarantees, specifically applied to Amazonian indigenous communities.

### 🎯 The Problem

Most blockchain systems assume:

| Assumption | Reality in Communities |
|------------|------------------------|
| 📶 Permanent connectivity | 📵 Intermittent or no connectivity |
| ⚡ Immediate on-chain interaction | ⏱️ Periodic internet access |
| 🖥️ Centralized backend coordination | 👥 Decentralized community governance |

**AMARUID proposes:** Local cryptographic integrity first, public anchoring later.

### 🧠 Design Principles

- 📴 **Offline-first by default** - Critical operations do not require internet
- 🔒 **Cryptographic integrity at the edge** - Data is secure locally
- 🪶 **Minimal blockchain footprint** - Only essentials go on-chain
- 📦 **Batch anchoring for scalability** - Event aggregation
- 👥 **Collective governance model** - Community multi-signature validation
- 🔗 **Blockchain only where it adds guarantees** - Selective use of technology

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🏘️ **Collective Identity** | Community creates a multisig wallet representing the assembly |
| 👤 **Individual Identity** | Each member generates digital identity without internet |
| 🔏 **Community Certification** | Assembly certifies members via custom "COMMCERT" asset |
| 🌿 **Conservation Actions** | Recording environmental activities with photo evidence (offline-capable) |
| 📊 **Reputation System (MVRS)** | Score based on verified actions, endorsements, and active time |
| 🔗 **Public Verification** | Anyone can verify identity and reputation on Stellar Explorer |

---

<a name="arquitectura-técnica"></a>
## 🏗 ARQUITECTURA TÉCNICA / TECHNICAL ARCHITECTURE

### 1️⃣ Capa de Identidad / Identity Layer (Offline)
- Generación de claves Ed25519 / Ed25519 key generation
- Identificador derivado de la clave pública / Identifier derived from public key
- Almacenamiento local cifrado / Encrypted local storage

### 2️⃣ Capa de Evento / Event Layer (Offline)
Cada evento contiene / Each event contains:
```json
{
  "actor": "public_key_hash",
  "timestamp": "2024-01-15T10:30:00Z",
  "event_type": "reforestacion",
  "metadata_hash": "sha256_hash_de_evidencia",
  "location": "coordenadas_gps",
  "evidence": ["foto1_hash", "foto2_hash"]
}
