# Módulo de Administración de Usuarios

Este módulo proporciona funcionalidades completas para la gestión de usuarios del sistema Hotel Club.

## Estructura del Módulo

```
src/modules/admin/
├── controllers/
│   └── controller.js          # Controlador principal con funciones CRUD
├── models/
│   └── model.js              # Modelo para interacción con la base de datos
├── router/
│   └── router.js             # Rutas del módulo admin
├── views/
│   └── home.hbs              # Vista principal del panel de administración
├── middlewares/
│   └── validation.js         # Middlewares de validación y logging
└── README.md                 # Este archivo
```

## Funcionalidades

### Panel de Administración
- **Ruta**: `/admin`
- **Descripción**: Panel principal con estadísticas y gestión de usuarios
- **Permisos**: Solo administradores

### Gestión de Usuarios (CRUD)

#### Crear Usuario
- **Ruta API**: `POST /api/admin/users`
- **Validaciones**:
  - Username: 3-50 caracteres, solo letras, números y guiones bajos
  - Password: mínimo 6 caracteres
  - Role: "Administrador" o "Usuario"

#### Leer Usuarios
- **Obtener todos**: `GET /api/admin/users`
- **Obtener por ID**: `GET /api/admin/users/:id`

#### Actualizar Usuario
- **Ruta API**: `PUT /api/admin/users/:id`
- **Validaciones**: Mismas que crear + no permitir cambiar el último administrador

#### Eliminar Usuario
- **Ruta API**: `DELETE /api/admin/users/:id`
- **Validaciones**: 
  - No puede eliminar su propio usuario
  - No puede eliminar usuarios con actividad (reservaciones, rentas, ventas)

### Estadísticas Disponibles
- Total de usuarios
- Número de administradores
- Número de usuarios regulares
- Usuarios activos en los últimos 30 días

## Middlewares de Seguridad

### Autenticación y Autorización
- `authMiddleware`: Verifica que el usuario esté autenticado
- `roleMiddleware('Administrador')`: Verifica que el usuario sea administrador

### Validaciones Específicas
- `validateUserData`: Valida datos de entrada para usuarios
- `validateUserDeletion`: Verifica si un usuario puede ser eliminado
- `validateUserId`: Valida formato de ID de usuario
- `validateLastAdmin`: Previene eliminar el último administrador
- `logAdminAction`: Registra todas las acciones administrativas

## Seguridad Implementada

1. **Control de Acceso**: Solo administradores pueden acceder
2. **Validación de Datos**: Validación exhaustiva en frontend y backend
3. **Protección de Integridad**: No permite eliminar usuarios con actividad
4. **Logging de Auditoría**: Registra todas las acciones administrativas
5. **Prevención de Auto-eliminación**: Los administradores no pueden eliminarse a sí mismos
6. **Protección del Último Admin**: Previene quedarse sin administradores

## Uso

### Acceder al Panel
1. Iniciar sesión como administrador
2. Navegar a `/admin`

### Crear Usuario
1. En el panel, hacer clic en "Crear Usuario"
2. Llenar el formulario modal
3. El sistema validará y creará el usuario

### Editar Usuario
1. Hacer clic en el ícono de editar junto al usuario
2. Modificar los datos en el modal
3. La contraseña es opcional al editar

### Eliminar Usuario
1. Hacer clic en el ícono de eliminar
2. Confirmar la acción
3. El sistema verificará si es posible eliminar el usuario

## Logs de Auditoría

Todas las acciones administrativas se registran con:
- Timestamp
- Usuario administrador que realizó la acción
- Acción realizada
- IP y User-Agent
- Estado de la respuesta
- Datos del usuario afectado

## Consideraciones Técnicas

### Base de Datos
- Utiliza la tabla `users_hotel` existente
- Consultas optimizadas con índices
- Transacciones para operaciones críticas

### Frontend
- Interfaz moderna con Tailwind CSS
- Modales para crear/editar usuarios
- Validación en tiempo real
- Confirmaciones para acciones destructivas

### API
- Respuestas consistentes en formato JSON
- Códigos de estado HTTP apropiados
- Manejo de errores robusto
- Validación de entrada exhaustiva

## Extensibilidad

El módulo está diseñado para ser fácilmente extensible:

1. **Nuevas Funcionalidades**: Agregar métodos al controlador y rutas correspondientes
2. **Validaciones Adicionales**: Extender los middlewares de validación
3. **Nuevas Vistas**: Agregar archivos .hbs en la carpeta views
4. **Reportes**: Utilizar los métodos del modelo para generar reportes

## Dependencias

- `bcryptjs`: Para hash de contraseñas
- `express`: Framework web
- `mysql2`: Conexión a base de datos
- `handlebars`: Motor de plantillas

## Rutas Completas

### Vistas HTML
- `GET /admin` - Panel principal
- `GET /admin/users/create` - Formulario de creación (si se implementa)

### API JSON
- `GET /api/admin/users` - Listar usuarios
- `GET /api/admin/users/:id` - Obtener usuario específico
- `POST /api/admin/users` - Crear usuario
- `PUT /api/admin/users/:id` - Actualizar usuario
- `DELETE /api/admin/users/:id` - Eliminar usuario
- `PATCH /api/admin/users/:id/status` - Cambiar estado (futuro)
