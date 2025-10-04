import pdfGenerator from './src/modules/rooms/utils/pdfGenerator.js';
import fs from 'fs';

console.log('🧪 Probando generación real de PDF con nuevas rutas...\n');

// Datos de prueba para renta
const rentData = {
  id: 123,
  type: 'rent',
  client_name: 'Juan Pérez',
  phone: '4531450884',
  room_number: 'HAB-101',
  check_in: '2025-10-04T14:00:00',
  check_out: '2025-10-06T12:00:00',
  total: 1500.00,
  nights: 2,
  rate_per_night: 750.00
};

// Datos de prueba para reservación
const reservationData = {
  id: 456,
  type: 'reservation',
  client_name: 'María García',
  phone: '4531234567',
  room_number: 'HAB-205',
  check_in: '2025-10-10T15:00:00',
  check_out: '2025-10-12T11:00:00',
  total: 2000.00,
  nights: 2,
  rate_per_night: 1000.00
};

async function testPDFGeneration() {
  try {
    console.log('1️⃣ Generando PDF de RENTA...');
    const rentResult = await pdfGenerator.generatePDF(rentData);
    
    if (rentResult.success) {
      console.log('   ✅ PDF de renta generado exitosamente');
      console.log('   📄 Archivo:', rentResult.fileName);
      console.log('   📁 Ruta:', rentResult.filePath);
      console.log('   🔍 Existe:', fs.existsSync(rentResult.filePath) ? 'SÍ' : 'NO');
    } else {
      console.log('   ❌ Error generando PDF de renta:', rentResult.error);
    }

    console.log('\n2️⃣ Generando PDF de RESERVACIÓN...');
    const reservationResult = await pdfGenerator.generatePDF(reservationData);
    
    if (reservationResult.success) {
      console.log('   ✅ PDF de reservación generado exitosamente');
      console.log('   📄 Archivo:', reservationResult.fileName);
      console.log('   📁 Ruta:', reservationResult.filePath);
      console.log('   🔍 Existe:', fs.existsSync(reservationResult.filePath) ? 'SÍ' : 'NO');
    } else {
      console.log('   ❌ Error generando PDF de reservación:', reservationResult.error);
    }

    // Verificar estructura de archivos
    console.log('\n3️⃣ Verificando estructura de archivos generados...');
    
    const rentDir = './public/uploads/rooms/pdf/rentas';
    const reservationDir = './public/uploads/rooms/pdf/reservaciones';
    
    if (fs.existsSync(rentDir)) {
      const rentFiles = fs.readdirSync(rentDir).filter(f => f.endsWith('.pdf'));
      console.log(`   📁 Rentas: ${rentFiles.length} archivos PDF`);
      rentFiles.forEach(file => console.log(`      - ${file}`));
    }
    
    if (fs.existsSync(reservationDir)) {
      const reservationFiles = fs.readdirSync(reservationDir).filter(f => f.endsWith('.pdf'));
      console.log(`   📁 Reservaciones: ${reservationFiles.length} archivos PDF`);
      reservationFiles.forEach(file => console.log(`      - ${file}`));
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testPDFGeneration().then(() => {
  console.log('\n✅ Prueba de generación de PDF completada');
}).catch(err => {
  console.error('❌ Error ejecutando prueba:', err);
});
