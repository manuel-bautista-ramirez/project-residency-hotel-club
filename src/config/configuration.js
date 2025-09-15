import port from 'dotenv'
port.config();

export const config={
  app: {
    port: process.env.PORT || 3000

  },
  mysql:{
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '586226',
    database: process.env.DB_NAME || 'hotel_club'

  },


};
