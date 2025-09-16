// controllers/verificationController.js
import { MembershipModel } from '../models/modelMembership.js';

const verificationController = {
  async verifyMembership(req, res) {
    const { data } = req.query;

    if (!data) {
      return res.status(400).render('verificationResult', {
        layout: 'main',
        title: 'Error de Verificación',
        status: 'error',
        message: 'No se proporcionaron datos para la verificación.',
      });
    }

    try {
      // El dato viene de una URL, decodificarlo es una buena práctica
      const decodedData = decodeURIComponent(data);
      const qrData = JSON.parse(decodedData);
      const { id_activa } = qrData;

      if (!id_activa) {
        return res.status(400).render('verificationResult', {
          layout: 'main',
          title: 'Error de Verificación',
          status: 'error',
          message: 'El código QR no contiene un ID de membresía válido.',
        });
      }

      const membership = await MembershipModel.getMembresiaById(id_activa);

      if (!membership) {
        return res.status(404).render('verificationResult', {
          layout: 'main',
          title: 'Verificación de Membresía',
          status: 'error',
          message: 'No se encontró ninguna membresía con el ID proporcionado.',
        });
      }

      const now = new Date();
      // Asegurarse que la fecha de la BD se interprete correctamente
      const endDate = new Date(membership.fecha_fin + 'T00:00:00');
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = '';
      let message = '';
      let statusColor = ''; // Tailwind color class

      if (endDate < now) {
        status = 'inactive';
        message = 'La membresía está vencida.';
        statusColor = 'bg-red-500';
      } else if (diffDays <= 5) {
        status = 'expiring';
        message = `La membresía expira en ${diffDays} día(s).`;
        statusColor = 'bg-yellow-400';
      } else {
        status = 'active';
        message = 'La membresía está activa.';
        statusColor = 'bg-green-500';
      }

      res.render('verificationResult', {
        layout: 'main', // Aseguramos que use el layout principal
        title: 'Verificación de Membresía',
        status,
        message,
        statusColor,
        membership,
        helpers: {
            formatDate: function (date) {
                return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
            }
        }
      });
    } catch (error) {
      console.error('Error al verificar la membresía:', error);
      res.status(500).render('verificationResult', {
        layout: 'main',
        title: 'Error del Servidor',
        status: 'error',
        message: 'Ocurrió un error al procesar la solicitud. El QR podría no ser válido.',
        statusColor: 'bg-gray-500',
      });
    }
  },
};

export { verificationController };
