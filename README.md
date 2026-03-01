# 🌿 AMARUID

### Identidad Digital y Reputación para Comunidades Indígenas Amazónicas
#### *Offline Verifiable Credential Anchoring Protocol (OVCAP)*

*Amaruid significa "espíritu de la selva" en la cosmovisión de varios pueblos amazónicos. Este proyecto lleva ese nombre porque busca capturar la esencia de quienes protegen nuestro pulmón verde.*

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)
![Offline-First](https://img.shields.io/badge/Offline--First-✓-orange)

---

## 📋 TABLA DE CONTENIDOS

- [🇪🇸 Versión Español](#español)
- [🇬🇧 English Version](#english)
- [🏗 Arquitectura Técnica](#arquitectura-técnica)
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

**AMARUID** es un sistema de identidad digital y reputación construido sobre **Stellar blockchain** (testnet), diseñado específicamente para comunidades indígenas amazónicas que enfrentan tres desafíos fundamentales:

| Desafío | Solución AMARUID |
|---------|------------------|
| 📵 **Conectividad intermitente** | Arquitectura offline-first con anclaje periódico a blockchain |
| 🏦 **Exclusión financiera** | Identidad digital verificable que puede habilitar acceso a servicios financieros |
| 🌱 **Conservación no reconocida** | Las acciones ambientales se traducen en reputación cuantificable |

### 🎯 Propósito del Proyecto

Este proyecto nace como parte de mi postulación a **Australia Awards 2026**, demostrando cómo la tecnología blockchain puede aplicarse a problemas reales de desarrollo sostenible en comunidades vulnerables.

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

<a name="arquitectura-técnica"></a>
## 🏗 Arquitectura Técnica

El sistema implementa el protocolo **OVCAP (Offline Verifiable Credential Anchoring Protocol)** en cuatro capas:

### 1️⃣ Capa de Identidad (Offline)
- Generación de pares de claves Ed25519 en el dispositivo
- Almacenamiento local cifrado
- Identificador único derivado de la clave pública

### 2️⃣ Capa de Evento (Offline)
Cada acción de conservación genera un evento estructurado:
```json
{
  "actor": "public_key_hash",
  "timestamp": "ISO8601",
  "event_type": "reforestacion|monitoreo|educacion",
  "metadata_hash": "sha256_hash",
  "evidence": ["foto1_hash", "foto2_hash"],
  "location": "coordenadas"
}
