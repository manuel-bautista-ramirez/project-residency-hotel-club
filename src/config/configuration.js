import port from 'dotenv'
port.config();

export const config={
  app: {
    port: process.env.PORT|| 3000

  },
  mysql:{
    host: process.env.PORT || 'localhost',
    user: process.env.PORT || 'root',
    password: process.env.PORT || '',
    database: process.env.PORT || 'hotel_club'

  },


};
