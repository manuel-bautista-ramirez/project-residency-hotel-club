import fs from 'fs';
import path from 'path';

class ValidadorDirectorios {
  constructor() {
    this.basePath = path.join(process.cwd(), 'public', 'uploads', 'store');
    this.estructuraEsperada = {
      pdf: ['reportes', 'ventas'],
      qr: ['ventas']
    };

    console.log('📁 ValidadorDirectorios inicializado');
    console.log('Ruta base:', this.basePath);
  }

  /**
   * Valida y crea toda la estructura de directorios necesaria
   */
  validarEstructuraCompleta() {
    console.log('🔍 INICIANDO VALIDACIÓN DE DIRECTORIOS');

    const resultados = {
      exitoso: true,
      errores: [],
      directoriosCreados: [],
      directoriosExistentes: []
    };

    try {
      // Validar carpeta base
      if (!this._crearDirectorio(this.basePath)) {
        resultados.exitoso = false;
        resultados.errores.push(`No se pudo crear la carpeta base: ${this.basePath}`);
        return resultados;
      }

      // Validar estructura de categorías y subcarpetas
      for (const [categoria, subcarpetas] of Object.entries(this.estructuraEsperada)) {
        const categoriaPath = path.join(this.basePath, categoria);

        if (!this._crearDirectorio(categoriaPath)) {
          resultados.exitoso = false;
          resultados.errores.push(`No se pudo crear la categoría: ${categoria}`);
          continue;
        }

        // Validar subcarpetas de cada categoría
        for (const subcarpeta of subcarpetas) {
          const subcarpetaPath = path.join(categoriaPath, subcarpeta);

          if (!this._crearDirectorio(subcarpetaPath)) {
            resultados.exitoso = false;
            resultados.errores.push(`No se pudo crear la subcarpeta: ${subcarpeta}`);
          }
        }
      }

      // Verificar permisos de escritura
      if (!this._verificarPermisosEscritura()) {
        resultados.exitoso = false;
        resultados.errores.push('No hay permisos de escritura en los directorios');
      }

      console.log('✅ Validación de directorios completada');
      return resultados;

    } catch (error) {
      console.error('❌ Error crítico durante la validación:', error);
      resultados.exitoso = false;
      resultados.errores.push(`Error crítico: ${error.message}`);
      return resultados;
    }
  }

  /**
   * Crea un directorio si no existe
   */
  _crearDirectorio(ruta) {
    try {
      if (!fs.existsSync(ruta)) {
        fs.mkdirSync(ruta, { recursive: true });
        console.log(`✅ CREADO: ${ruta}`);
        return true;
      } else {
        console.log(`✅ EXISTE: ${ruta}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ ERROR creando ${ruta}:`, error.message);
      return false;
    }
  }

  /**
   * Verifica permisos de escritura en los directorios
   */
  _verificarPermisosEscritura() {
    try {
      const archivoTest = path.join(this.basePath, 'test_permisos.tmp');

      // Intentar crear un archivo de prueba
      fs.writeFileSync(archivoTest, 'test');

      // Verificar que se puede leer
      const contenido = fs.readFileSync(archivoTest, 'utf8');

      // Eliminar archivo de prueba
      fs.unlinkSync(archivoTest);

      console.log('✅ Permisos de escritura/lectura verificados');
      return true;
    } catch (error) {
      console.error('❌ Error verificando permisos:', error.message);
      return false;
    }
  }

  /**
   * Valida una ruta específica para PDF o QR
   */
  validarRutaEspecifica(tipo, subtipo) {
    const tiposValidos = ['pdf', 'qr'];
    const subtiposValidos = ['reportes', 'ventas'];

    if (!tiposValidos.includes(tipo)) {
      throw new Error(`Tipo inválido: ${tipo}. Debe ser 'pdf' o 'qr'`);
    }

    if (!subtiposValidos.includes(subtipo)) {
      throw new Error(`Subtipo inválido: ${subtipo}. Debe ser 'reportes' o 'ventas'`);
    }

    const rutaEspecifica = path.join(this.basePath, tipo, subtipo);
    return this._crearDirectorio(rutaEspecifica);
  }

  /**
   * Obtiene la ruta completa para un tipo y subtipo específicos
   */
  obtenerRuta(tipo, subtipo) {
    return path.join(this.basePath, tipo, subtipo);
  }

  /**
   * Limpia archivos temporales o de prueba
   */
  limpiarArchivosTemporales() {
    try {
      if (!fs.existsSync(this.basePath)) {
        return;
      }

      const archivos = fs.readdirSync(this.basePath);
      const archivosTemporales = archivos.filter(archivo =>
        archivo.includes('test_permisos') ||
        archivo.includes('temp_check') ||
        archivo.endsWith('.tmp')
      );

      archivosTemporales.forEach(archivo => {
        try {
          fs.unlinkSync(path.join(this.basePath, archivo));
          console.log(`🧹 Eliminado: ${archivo}`);
        } catch (error) {
          console.log(`⚠️ No se pudo eliminar: ${archivo}`);
        }
      });

      console.log('✅ Limpieza de archivos temporales completada');
    } catch (error) {
      console.log('⚠️ No se pudieron limpiar archivos temporales');
    }
  }
}

// Crear instancia única
const validadorDirectorios = new ValidadorDirectorios();

export default validadorDirectorios;
