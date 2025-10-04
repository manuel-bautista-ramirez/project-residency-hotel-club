import fs from 'fs';
import path from 'path';

async function main() {
  const htmlPath = path.resolve('./doc/Guia-Integracion-WhatsApp.html');
  const outPath = path.resolve('./doc/Guia-Integracion-WhatsApp.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('❌ No se encontró el archivo HTML:', htmlPath);
    process.exit(1);
  }

  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Cargar contenido desde archivo
    const html = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generar PDF (A4, fondo impreso)
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '14mm', bottom: '16mm', left: '14mm' }
    });

    await browser.close();
    console.log('✅ Guía exportada a PDF:', outPath);
  } catch (err) {
    console.error('❌ Error exportando la guía a PDF:', err);
    process.exit(1);
  }
}

main();
