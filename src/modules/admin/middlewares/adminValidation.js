import { 
  validateEmptyFields, 
  validateUsername, 
  validatePassword 
} from '../../login/middlewares/validation/textBox.js';

// Middleware para validar datos de usuario en el admin
export const validateUserData = (req, res, next) => {
  const { username, password, role } = req.body;
  const errors = [];

  // Validar campos vacíos
  const emptyFieldsValidation = validateEmptyFields([username, password, role]);
  if (!emptyFieldsValidation.status) {
    errors.push(emptyFieldsValidation.message);
  }

  // Validar username si se proporciona
  if (username) {
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.status) {
      errors.push(usernameValidation.message);
    }
  }

  // Validar password si se proporciona
  if (password) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.status) {
      errors.push(passwordValidation.message);
    }
  }

  // Validar role
  if (role && !['Administrador', 'Usuario'].includes(role)) {
    errors.push('El rol debe ser "Administrador" o "Usuario"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de usuario inválidos',
      errors
    });
  }

  next();
};

// Middleware para validar ID de usuario
export const validateUserId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario inválido'
    });
  }

  req.userId = parseInt(id);
  next();
};

// Middleware para logging de acciones administrativas
export const logAdminAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      logAction(req, action, res.statusCode, data);
      originalSend.call(this, data);
    };
    
    res.json = function(data) {
      logAction(req, action, res.statusCode, data);
      originalJson.call(this, data);
    };
    
    next();
  };
};

function logAction(req, action, statusCode, responseData) {
  const logData = {
    timestamp: new Date().toISOString(),
    admin: req.session.user?.username || 'Unknown',
    adminId: req.session.user?.id || null,
    action,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    success: statusCode >= 200 && statusCode < 300,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  };

  // Si hay datos específicos del usuario afectado
  if (req.params.id) {
    logData.targetUserId = req.params.id;
  }

  if (req.body && req.body.username) {
    logData.targetUsername = req.body.username;
  }

  // Log de la acción
  console.log('🔐 ADMIN ACTION:', JSON.stringify(logData, null, 2));
}
