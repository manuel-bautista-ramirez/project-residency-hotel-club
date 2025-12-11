import cron from 'node-cron';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { config } from '../src/config/configuration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupDir = path.resolve(__dirname, 'backups');
fs.mkdirSync(backupDir, { recursive: true });

function buildDumpArgs() {
  const args = [];
  if (config.mysql.host) args.push('-h', config.mysql.host);
  if (config.mysql.user) args.push('-u', config.mysql.user);
  if (config.mysql.password) args.push(`-p${config.mysql.password}`);
  if (config.mysql.database) args.push(config.mysql.database);
  return args;
}

function performBackup() {
  return new Promise((resolve, reject) => {
    if (!config.mysql.database) {
      return reject(new Error('Database name missing in configuration'));
    }

    const existingFiles = fs.readdirSync(backupDir).filter((file) => file.endsWith('.sql'));
    for (const file of existingFiles) {
      fs.unlinkSync(path.join(backupDir, file));
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.sql`);
    const args = buildDumpArgs();

    const dump = spawn('mysqldump', args);
    const writeStream = fs.createWriteStream(backupPath);
    dump.stdout.pipe(writeStream);

    dump.stderr.on('data', (chunk) => {
      console.error('[DB BACKUP] mysqldump:', chunk.toString());
    });

    dump.on('error', reject);
    dump.on('close', (code) => {
      if (code === 0) {
        console.log('[DB BACKUP] saved to', backupPath);
        resolve(backupPath);
      } else {
        reject(new Error(`mysqldump exited with code ${code}`));
      }
    });
  });
}

function createMailer() {
  return nodemailer.createTransport({
    host: config.email.host,
    port: Number(config.email.port) || 587,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

async function notifyFailure(error) {
  try {
    if (!config.email.user || !config.email.pass || !config.email.host) {
      console.warn('[DB BACKUP] email credentials missing, skipping alert');
      return;
    }
    const transporter = createMailer();
    const recipients = process.env.BACKUP_ALERT_RECIPIENT || config.email.user;
    await transporter.sendMail({
      from: `Backup Monitor <${config.email.user}>`,
      to: recipients,
      subject: 'Backup fallido en Hotel Club',
      text: 'La copia de seguridad falló. Error: ' + (error.message || error),
    });
    console.log('[DB BACKUP] alert email sent to', recipients);
  } catch (mailerError) {
    console.error('[DB BACKUP] no se pudo enviar email de alerta:', mailerError.message);
  }
}

async function runBackup() {
  try {
    await performBackup();
  } catch (error) {
    console.error('[DB BACKUP] failed:', error.message);
    notifyFailure(error);
  }
}

cron.schedule('0 0 * * *', () => {
  console.log('[JobQueue] Buscando tareas pendientes...');
  runBackup().finally(() => {
    console.log('[JobQueue] No hay tareas pendientes');
  });
});


if (!fs.readdirSync(backupDir).some((file) => file.endsWith('.sql'))) {
  console.log('[DB BACKUP] no backups yet, creating one now');
  runBackup();
}
