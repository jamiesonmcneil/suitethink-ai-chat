const express = require('express');
const path = require('path');
const { router } = require('./routes/api.js');
require('dotenv').config({ path: './.env' });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app };
