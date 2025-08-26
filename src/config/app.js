import express from 'express';
import path from 'path';
import exphbs, { engine } from 'express-handlebars';
import {config } from '../config/configuration.js';
import { hbsHelpers } from '../helpers/hbsHelpers.js';

export const app = express();

//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de Handlebars
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main', // layout principal
  partialsDir: path.join('./src/views/partials'), // partials globales
  layoutsDir: path.join('./src/views/layouts'), // layouts globales
  helpers: {
    eq: (a, b) => a === b
  }
}));

app.set('view engine', 'hbs');
app.set('views', ['./src/modules/login/views/','./src/views/','./src/modules/membership/views/']);

app.engine("Handlebars", engine({
  helpers: hbsHelpers
    }
  ));

  app.set("port", config.app.port);
  app.set("database",config.mysql.database);
