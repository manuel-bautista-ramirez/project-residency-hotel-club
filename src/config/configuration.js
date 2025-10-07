import dotenv from 'dotenv';
dotenv.config();

export const config={
  app: {
    port: process.env.PORT || 3000
  },
  mysql:{
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_club'
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
