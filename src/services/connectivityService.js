import dns from 'dns';

class ConnectivityService {
  constructor() {
    this.isOnline = false;
    this.checkInterval = 60000; // Verificar cada 60 segundos
    this.startChecking();
  }

  /**
   * Verifica la conexión a Internet realizando una consulta DNS a un dominio conocido.
   * @returns {Promise<boolean>} - Resuelve a true si hay conexión, false en caso contrario.
   */
  async checkConnection() {
    return new Promise((resolve) => {
      dns.lookup('google.com', (err) => {
        const isConnected = !err;
        if (this.isOnline !== isConnected) {
          console.log(`🌐 Estado de la conexión a Internet: ${isConnected ? 'En línea' : 'Fuera de línea'}`);
          this.isOnline = isConnected;
        }
        resolve(isConnected);
      });
    });
  }

  /**
   * Inicia un intervalo para verificar periódicamente el estado de la conexión.
   */
  startChecking() {
    this.checkConnection(); // Verificar inmediatamente al iniciar
    setInterval(() => this.checkConnection(), this.checkInterval);
  }

  /**
   * Devuelve el último estado conocido de la conexión sin realizar una nueva verificación.
   * @returns {boolean} - True si está en línea, false si no.
   */
  isInternetConnected() {
    return this.isOnline;
  }
}

// Crear instancia única (singleton)
const connectivityService = new ConnectivityService();

export default connectivityService;
