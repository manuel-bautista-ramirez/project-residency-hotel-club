/**
 * Middleware que agrega la hora de la solicitud al objeto `req`.
 *
 * Este middleware añade una propiedad `requestTime` al objeto de la solicitud
 * (`req`) con la fecha y hora actual en formato ISO. Luego, llama a la función
 * `next()` para pasar el control al siguiente middleware o manejador de ruta.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar el control al siguiente middleware.
 */
const requestTimeMiddleware = (req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
};

export default requestTimeMiddleware;
