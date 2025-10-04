import directoryManager from './src/utils/directoryManager.js';
import fs from 'fs';

console.log('🧪 Probando estructura de directorios...\n');

// 1. Verificar que se crean los directorios
console.log('1️⃣ Creando directorios...');
directoryManager.ensureDirectories();

// 2. Probar rutas para rentas
console.log('\n2️⃣ Probando rutas para RENTAS:');
const rentQRPath = directoryManager.getQRPath('rent');
const rentPDFPath = directoryManager.getPDFPath('rent');
console.log('   QR Renta:', rentQRPath);
console.log('   PDF Renta:', rentPDFPath);

// 3. Probar rutas para reservaciones
console.log('\n3️⃣ Probando rutas para RESERVACIONES:');
const reservationQRPath = directoryManager.getQRPath('reservation');
const reservationPDFPath = directoryManager.getPDFPath('reservation');
console.log('   QR Reservación:', reservationQRPath);
console.log('   PDF Reservación:', reservationPDFPath);

// 4. Generar nombres de archivo
console.log('\n4️⃣ Generando nombres de archivo:');
const rentQRFile = directoryManager.generateQRFileName('rent', 123);
const rentPDFFile = directoryManager.generatePDFFileName('rent', 123);
const reservationQRFile = directoryManager.generateQRFileName('reservation', 456);
const reservationPDFFile = directoryManager.generatePDFFileName('reservation', 456);

console.log('   QR Renta:', rentQRFile);
console.log('   PDF Renta:', rentPDFFile);
console.log('   QR Reservación:', reservationQRFile);
console.log('   PDF Reservación:', reservationPDFFile);

// 5. Rutas completas
console.log('\n5️⃣ Rutas completas de archivos:');
const rentQRFullPath = directoryManager.getQRFilePath('rent', 123);
const rentPDFFullPath = directoryManager.getPDFFilePath('rent', 123);
const reservationQRFullPath = directoryManager.getQRFilePath('reservation', 456);
const reservationPDFFullPath = directoryManager.getPDFFilePath('reservation', 456);

console.log('   QR Renta completa:', rentQRFullPath);
console.log('   PDF Renta completa:', rentPDFFullPath);
console.log('   QR Reservación completa:', reservationQRFullPath);
console.log('   PDF Reservación completa:', reservationPDFFullPath);

// 6. Verificar que los directorios existen
console.log('\n6️⃣ Verificando que los directorios existen:');
const dirsToCheck = [
  './public/uploads/rooms/qr/rentas',
  './public/uploads/rooms/qr/reservaciones',
  './public/uploads/rooms/pdf/rentas',
  './public/uploads/rooms/pdf/reservaciones'
];

dirsToCheck.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`   ${exists ? '✅' : '❌'} ${dir}`);
});

// 7. Crear archivos de prueba
console.log('\n7️⃣ Creando archivos de prueba...');
try {
  // Crear QR de prueba para renta
  fs.writeFileSync(rentQRFullPath, 'QR de prueba para renta');
  console.log('   ✅ QR renta creado:', rentQRFullPath);
  
  // Crear PDF de prueba para renta
  fs.writeFileSync(rentPDFFullPath, 'PDF de prueba para renta');
  console.log('   ✅ PDF renta creado:', rentPDFFullPath);
  
  // Crear QR de prueba para reservación
  fs.writeFileSync(reservationQRFullPath, 'QR de prueba para reservación');
  console.log('   ✅ QR reservación creado:', reservationQRFullPath);
  
  // Crear PDF de prueba para reservación
  fs.writeFileSync(reservationPDFFullPath, 'PDF de prueba para reservación');
  console.log('   ✅ PDF reservación creado:', reservationPDFFullPath);
  
} catch (error) {
  console.error('   ❌ Error creando archivos de prueba:', error.message);
}

// 8. Estadísticas
console.log('\n8️⃣ Estadísticas de almacenamiento:');
const stats = directoryManager.getStorageStats();
console.log('   Estadísticas:', JSON.stringify(stats, null, 2));

console.log('\n✅ Prueba completada. Revisa los archivos creados en las carpetas correspondientes.');
