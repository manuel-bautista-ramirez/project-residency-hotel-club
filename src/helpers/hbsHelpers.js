export const hbsHelpers = {
  eq: (a, b) => a === b,
  or: (...args) => {
    args.pop(); // último argumento es "options" de Handlebars
    return args.some(Boolean);
  },
  and: (...args) => {
    args.pop();
    return args.every(Boolean);
  },
  not: (a) => !a,

  // Helper para comparar mayor que
  gt: (a, b) => a > b,
  // Helper para comparar menor que
  lt: (a, b) => a < b,
  // Helper para comparar menor o igual que
  lte: (a, b) => a <= b,
  // Helper para comparar mayor o igual que
  gte: (a, b) => a >= b,
  json: (context) => JSON.stringify(context),

  // Helper para formatear fechas
  formatDate: (date, format) => {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    // Formato por defecto: DD/MM/YYYY
    if (!format || format === 'short') {
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    // Formato completo: DD/MM/YYYY HH:mm
    if (format === 'full') {
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Formato de fecha y hora: DD/MM/YYYY a las HH:mm
    if (format === 'datetime') {
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' a las ' + d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return d.toLocaleDateString('es-MX');
  },

  // Helper para truncar texto
  truncate: (str, len) => {
    if (str && str.length > len) {
      return str.substring(0, len) + '...';
    }
    return str;
  }
};
