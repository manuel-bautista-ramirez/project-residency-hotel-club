import express from 'express';
import path from 'path';
import { engine } from 'express-handlebars';
import { config } from '../config/configuration.js';
import { hbsHelpers } from '../helpers/hbsHelpers.js';

export const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure Handlebars
app.engine('.hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  partialsDir: path.join('./src/views/partials'),
  layoutsDir: path.join('./src/views/layouts'),
  helpers: {
    eq: (a, b) => a === b,
    ...hbsHelpers
  }
}));

app.set('view engine', '.hbs');
app.set('views', [
  './src/modules/login/views/',
  './src/views/',
  './src/modules/membership/views/'
]);

app.set('port', config.app.port);
app.set('database', config.mysql.database);
