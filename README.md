# 🎮 Pokemita Full Stack — Simulador Competitivo Pokémon

Una plataforma web completa para simular batallas Pokémon competitivas (Gen 9 OU) en tiempo real. Este proyecto ha sido actualizado con tecnologías modernas de seguridad, bases de datos relacionales y comunicación bidireccional.

## 🚀 Características Principales

*   **Autenticación Segura:** Registro y login con contraseñas encriptadas (`bcrypt`) y sesiones manejadas con **JSON Web Tokens (JWT)**.
*   **Seguridad Avanzada (2FA):** Autenticación de Dos Factores (TOTP) integrada con Google Authenticator o Authy. Incluye generación de códigos QR y validación estricta de códigos temporales.
*   **Batallas en Tiempo Real:** Motor de simulación `pokemon-showdown` conectado a través de **WebSockets** para una experiencia fluida sin recargas de página.
*   **Persistencia de Datos:** Base de datos **MySQL** para almacenar usuarios y sus equipos personalizados, gestionada a través de **XAMPP**.
*   **Constructor de Equipos:** Interfaz completa para buscar Pokémon, filtrar por tiers/tipos, configurar movimientos, habilidades e ítems, y guardar equipos en la nube.
*   **Modos de Juego:** 
    *   `IA vs IA`: Observa batallas automáticas en tiempo real.
    *   `Jugador vs IA`: Combate manual con control de movimientos, cambios y mochila (pociones, revives, etc.).

## 🛠️ Stack Tecnológico

### Frontend
*   **React 19** (con Vite)
*   **Tailwind CSS** (Estilos)
*   **Zustand** (Manejo del estado global)
*   **React Router 7** (Navegación)
*   **Axios** (Cliente HTTP)
*   **WebSockets** (API nativa del navegador)

### Backend
*   **Node.js + Express.js**
*   **MySQL** (Base de datos relacional vía XAMPP)
*   **WebSockets (`ws`)** (Comunicación en tiempo real)
*   **JWT (`jsonwebtoken`)** (Autenticación)
*   **bcryptjs** (Hashing de contraseñas)
*   **otplib & qrcode** (Generación de 2FA)
*   **pokemon-showdown** (Motor de batalla)

---

## ⚙️ Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:
*   [Node.js](https://nodejs.org/) (v18 o superior)
*   [XAMPP](https://www.apachefriends.org/es/index.html) (para MySQL y Apache)
*   [Git](https://git-scm.com/)

---

