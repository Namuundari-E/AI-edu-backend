require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3010;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port 0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});