/**
 * Middleware para manejar errores en la aplicación.
 *
 * @param {Error} err - Objeto de error que contiene información sobre el error ocurrido.
 * @param {import('express').Request} req - Objeto de solicitud HTTP de Express.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware.
 *
 * @description Este middleware captura errores que ocurren en la aplicación, los registra en la consola
 * y envía una respuesta con un código de estado HTTP correspondiente y un mensaje genérico.
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).send('Ocurrió un error en el servidor.');
};

export default errorHandlerMiddleware;
