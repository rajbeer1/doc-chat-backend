const app = require('./app');
const connectDB = require('./config/database');

require('dotenv').config();

const PORT = process.env.PORT || 3001;


connectDB();


app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});