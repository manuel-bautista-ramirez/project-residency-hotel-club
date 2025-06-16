/**
 * Middleware de registro de solicitudes HTTP.
 * Este middleware registra en la consola el método HTTP y la URL de cada solicitud recibida.
 *
 * @function loggerMiddleware
 * @param {import('express').Request} req - Objeto de solicitud HTTP de Express.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware.
 */
const loggerMiddleware = (req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  next();
};

export default loggerMiddleware;
