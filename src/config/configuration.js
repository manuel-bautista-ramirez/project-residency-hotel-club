import port from 'dotenv'
port.config();

export const config={
  app: {
    port: process.env.APP_PORT || 3000

  },
  mysql:{
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_club'

  },


};
