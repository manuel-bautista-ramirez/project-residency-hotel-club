import fs from 'fs';
import path from 'path';

async function main() {
  const mdPath = path.resolve('./reports/DB_Changes_Report.md');
  const healthPath = path.resolve('./src/dataBase/db_health_report.json');
  const outHtmlPath = path.resolve('./reports/DB_Changes_Report.html');
  const outPdfPath = path.resolve('./reports/DB_Changes_Report.pdf');

  if (!fs.existsSync(mdPath)) {
    console.error('❌ No se encontró el archivo Markdown del reporte:', mdPath);
    process.exit(1);
  }

  const mdBase = fs.readFileSync(mdPath, 'utf8');

  // Construir un resumen a partir del health JSON si existe
  let healthSummary = '';
  if (fs.existsSync(healthPath)) {
    try {
      const health = JSON.parse(fs.readFileSync(healthPath, 'utf8'));
      const tablesPresent = health?.requiredTables?.present ?? null;
      const tablesTotal = health?.requiredTables?.total ?? null;
      const missing = (health?.requiredTables?.missing ?? []).join(', ') || 'Ninguna';

      const engines = Array.isArray(health?.engines) ? health.engines : (health?.engines?.mismatched ? [] : []);
      const enginesTable = Array.isArray(health?.engines)
        ? health.engines.map(e => `| ${e.table} | ${e.engine || ''} | ${e.collation || ''} | ${e.engOk ? 'OK' : '(!)'} | ${e.colOk ? 'OK' : '(!)'} |`).join('\n')
        : '';

      const indexes = Array.isArray(health?.indexes) ? health.indexes : [];
      const indexesTable = indexes.map(i => `| ${i.table} | ${i.index} | ${i.ok ? 'OK' : 'FALTA'} |`).join('\n');

      healthSummary = `\n\n## 9. Resumen del último Health (auto-generado)\n\n- Tablas presentes: ${tablesPresent ?? '?'} / ${tablesTotal ?? '?'}\n- Faltantes: ${missing}\n\n### 9.1. Engines y Collations\n| Tabla | Engine | Collation | Engine OK | Collation OK |\n|---|---|---|---|---|\n${enginesTable || '*Sin datos de engines en el reporte*'}\n\n### 9.2. Índices verificados\n| Tabla | Índice | Estado |\n|---|---|---|\n${indexesTable || '*Sin datos de índices en el reporte*'}\n`;
    } catch (e) {
      console.warn('⚠️  No se pudo leer/parsing db_health_report.json:', e.message);
    }
  } else {
    healthSummary = '\n\n> Nota: No se encontró src/dataBase/db_health_report.json. Ejecuta `npm run db:health` para generar el último reporte antes de exportar.';
  }

  // Inyectar el resumen al final del Markdown base
  const fullMarkdown = mdBase + '\n' + healthSummary + '\n';

  // HTML que usa marked (CDN) para renderizar Markdown y CSS para PDF bonito
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>DB Changes Report</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 32px; color: #111; }
    h1,h2,h3 { color: #0f172a; }
    code, pre { background: #f5f5f5; border-radius: 6px; }
    pre { padding: 12px; overflow: auto; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background: #f1f5f9; text-align: left; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .muted { color: #64748b; font-size: 12px; }
    @page { size: A4; margin: 20mm; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Reporte de Cambios y Validaciones de BD</h1>
      <div class="muted">Generado: ${new Date().toISOString()}</div>
    </div>
  </div>
  <div id="content"></div>
  <script>
    const md = ${JSON.stringify(fullMarkdown)};
    document.getElementById('content').innerHTML = marked.parse(md);
  </script>
</body>
</html>`;

  fs.writeFileSync(outHtmlPath, html, 'utf8');
  console.log('📝 HTML generado:', outHtmlPath);

  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMediaType('screen');
    await page.pdf({ path: outPdfPath, format: 'A4', printBackground: true });
    await browser.close();
    console.log('✅ PDF generado:', outPdfPath);
  } catch (e) {
    console.warn('⚠️  No se pudo generar el PDF automáticamente. Puedes abrir el HTML y exportar a PDF desde el navegador.', e.message);
  }
}

main().catch(err => {
  console.error('❌ Error al exportar el reporte:', err);
  process.exit(1);
});
