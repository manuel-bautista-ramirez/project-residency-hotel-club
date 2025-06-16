/**
 * Middleware para manejar el intercambio de recursos de origen cruzado (CORS) en solicitudes HTTP entrantes.
 *
 * Este middleware establece los encabezados apropiados para permitir solicitudes de origen cruzado
 * desde cualquier origen, habilitando al servidor para manejar solicitudes desde diferentes dominios.
 *
 * Encabezados establecidos por este middleware:
 * - `Access-Control-Allow-Origin`: Permite solicitudes desde cualquier origen (`*`).
 * - `Access-Control-Allow-Methods`: Especifica los métodos HTTP permitidos (`GET, POST, PUT, DELETE`).
 * - `Access-Control-Allow-Headers`: Especifica los encabezados permitidos (`Content-Type, Authorization`).
 *
 * @param {Object} req - El objeto de solicitud HTTP.
 * @param {Object} res - El objeto de respuesta HTTP.
 * @param {Function} next - El callback para pasar el control al siguiente middleware.
 */
const corsMiddleware = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
};

export default corsMiddleware;
