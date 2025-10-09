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
  path.join( './src/views/'),
  path.join( './src/modules/membership/views/'),
  path.join( './src/modules/rooms/views/'),
  path.join( './src/modules/login/views/'),
  path.join( './src/modules/entries/views/'),
  

  // add more view directories as needed

]);

app.set('port', config.app.port);



