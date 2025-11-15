import dotenv from 'dotenv';
dotenv.config();

export const config={
  app: {
    port: process.env.PORT || 3001
  },
  mysql:{
   
    host: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || ''


  },
  session: {
    secret: process.env.SESSION_SECRET || 'fallback_secret_change_in_production'
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};
