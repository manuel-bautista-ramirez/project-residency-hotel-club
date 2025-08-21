import express from 'express';
import path from 'path';
import exphbs, { engine } from 'express-handlebars';
import {config } from '../config/configuration.js';
import { hbsHelpers } from '../helpers/hbsHelpers.js';

export const app = express();

// Configuración de Handlebars
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: "./src/modules/login/views/",
  layoutsDir: path.join('./src/views/layouts/'),
  helpers: hbsHelpers
}));

app.set('view engine', 'hbs');
app.set('views', ['./src/modules/login/views/','./src/views/']);

app.engine("Handlebars", engine({
  helpers: {
    eq: function(a,b){
      return a===b;
    }
      }
    }
  ));

  app.set("port", config.app.port);
  app.set("database",config.mysql.database);
