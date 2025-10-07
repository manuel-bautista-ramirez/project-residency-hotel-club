# Reporte de Auditoría de Seguridad - Vulnerabilidades Encontradas

Este documento detalla las vulnerabilidades de seguridad identificadas durante la auditoría del proyecto `project-residency-hotel-club`.

---

### 1. Contraseñas Débiles y Expuestas en el Código Fuente (Riesgo: CRÍTICO)

- **Descripción**: Se encontraron contraseñas de usuario (`manuel123`, `dani1234`) escritas en texto plano dentro del archivo `src/modules/login/models/userModel.js`. Estas credenciales estaban en una función (`seedUsers`) diseñada para poblar la base de datos con usuarios iniciales.

- **Impacto**: Cualquier persona con acceso al código fuente (incluidos desarrolladores o repositorios públicos) puede ver estas contraseñas. Si estas credenciales se usan en entornos de producción o staging, un atacante podría obtener acceso no autorizado a la aplicación con privilegios de administrador.

- **Ubicación del Código Vulnerable**:
  ```javascript
  // src/modules/login/models/userModel.js
  const seedUsers = async () => {
    const users = [
      { username: "manuel", password: "manuel123", role: "Administrador" },
      { username: "daniela", password: "dani1234", role: "Usuario" },
    ];
    // ... lógica para agregar usuarios
  };
  ```

---

### 2. Cookie de Sesión Insegura (Riesgo: ALTO)

- **Descripción**: La configuración de `express-session` en `index.js` estaba establecida con `cookie: { secure: false }`. Esto permite que la cookie de sesión, que identifica a un usuario autenticado, se transmita a través de conexiones no cifradas (HTTP).

- **Impacto**: En un entorno de producción que utiliza HTTPS, un atacante en la misma red (por ejemplo, una red Wi-Fi pública) podría interceptar la cookie de sesión y secuestrar la sesión del usuario (ataque de *session hijacking*). Esto le permitiría acceder a la aplicación como si fuera el usuario legítimo sin necesidad de conocer su contraseña.

- **Ubicación del Código Vulnerable**:
  ```javascript
  // index.js
  app.use(
    session({
      // ... otras opciones
      cookie: { secure: false },
    })
  );
  ```

---

### Conclusión de la Auditoría

Ambas vulnerabilidades representan un riesgo significativo para la seguridad de la aplicación y sus usuarios. Se recomienda su corrección inmediata antes de desplegar el proyecto en un entorno de producción.
