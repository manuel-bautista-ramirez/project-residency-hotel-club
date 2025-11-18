import bcrypt from 'bcrypt';
import { 
  getAllUsers, 
  getUserStats, 
  findById, 
  updateUser, 
  deleteUser,
  canDeleteUser 
} from '../models/model.js';
import { 
  findUserByUsername, 
  findUserByEmail,
  addUser,
  addUserWithoutPassword 
} from '../../login/models/userModel.js';

// Mostrar el panel principal de administración
export const showAdminPanel = async (req, res) => {
  try {
    const users = await getAllUsers();
    const stats = await getUserStats();
    
    res.render('homeAdmintration', {
      layout: 'main',
      title: 'Panel de Administración',
      users,
      stats,
      showNavbar: true,
      showFooter: true
    });
  } catch (error) {
    console.error('Error al cargar panel de administración:', error);
    res.status(500).render('error500', {
      layout: 'main',
      title: 'Error del servidor',
      mensaje: 'Error al cargar el panel de administración'
    });
  }
};

// Mostrar formulario para crear usuario
export const showCreateUserForm = async (req, res) => {
  res.render('createUser', {
    layout: 'main',
    title: 'Crear Usuario',
    showNavbar: true,
    showFooter: true
  });
};

// Crear nuevo usuario (sin contraseña)
export const createUserController = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Validaciones en el controlador
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, email y rol son obligatorios'
      });
    }

    // Validar username
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario debe tener al menos 3 caracteres'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario solo puede contener letras, números y guiones bajos'
      });
    }

    // Validar email (password contiene el email en este caso)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // Validar role
    if (!['Administrador', 'Usuario'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'El rol debe ser "Administrador" o "Usuario"'
      });
    }

    // Verificar si el usuario ya existe (por username)
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await findUserByEmail(password);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear el usuario sin contraseña (password contiene el email)
    await addUserWithoutPassword(username, password, role);

    res.json({
      success: true,
      message: `Usuario ${username} creado exitosamente. Debe usar recuperación de contraseña para acceder.`
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    const user = await findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No enviar la contraseña
    delete user.password;
    
    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar usuario
export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, password } = req.body;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // Verificar que el usuario existe
    const existingUser = await findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validaciones
    if (username && username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario debe tener al menos 3 caracteres'
      });
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario solo puede contener letras, números y guiones bajos'
      });
    }

    // Validar email si se proporciona (password contiene el email)
    if (password) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del email no es válido'
        });
      }
    }

    if (role && !['Administrador', 'Usuario'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'El rol debe ser "Administrador" o "Usuario"'
      });
    }

    // Validar que no se está cambiando el último administrador
    if (role === 'Usuario' && existingUser.role === 'Administrador') {
      const stats = await getUserStats();
      if (stats.administrators <= 1) {
        return res.status(400).json({
          success: false,
          message: 'No se puede cambiar el rol del último administrador del sistema'
        });
      }
    }

    // Preparar datos de actualización
    const updateData = { username, role };
    
    // Si se proporciona nuevo email, agregarlo (password contiene el email)
    if (password && password.trim() !== '') {
      updateData.email = password;
    }

    // Verificar si el username ya existe (excepto para el usuario actual)
    if (username && username !== existingUser.username) {
      const userWithSameUsername = await findUserByUsername(username);
      if (userWithSameUsername && userWithSameUsername.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya existe'
        });
      }
    }

    // Verificar si el email ya existe (excepto para el usuario actual)
    if (password && password !== existingUser.email) {
      const userWithSameEmail = await findUserByEmail(password);
      if (userWithSameEmail && userWithSameEmail.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    await updateUser(id, updateData);
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar usuario
export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    // Verificar que el usuario existe
    const user = await findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar el propio usuario
    if (parseInt(id) === req.session.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    // Verificar si el usuario puede ser eliminado
    const canDelete = await canDeleteUser(id);
    if (!canDelete.canDelete) {
      const reasons = [];
      if (canDelete.reasons.hasReservations) {
        reasons.push(`${canDelete.counts.reservations} reservaciones`);
      }
      if (canDelete.reasons.hasRents) {
        reasons.push(`${canDelete.counts.rents} rentas`);
      }
      if (canDelete.reasons.hasSales) {
        reasons.push(`${canDelete.counts.sales} ventas`);
      }

      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el usuario porque tiene actividad registrada: ${reasons.join(', ')}`,
        canDelete: false,
        details: canDelete
      });
    }

    await deleteUser(id);
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los usuarios (API)
export const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();
    
    // Remover contraseñas de la respuesta
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json({
      success: true,
      users: safeUsers
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};