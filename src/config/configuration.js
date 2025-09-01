import port from 'dotenv'
port.config();

export const config={
  app: {
    port: process.env.PORT|| 3000

  },
  mysql:{
    host: process.env.PORT || 'localhost',
    user: process.env.PORT || 'manuel',
    password: process.env.PORT || 'manuel12',
    database: process.env.PORT || 'hotel_club'

  },


};
