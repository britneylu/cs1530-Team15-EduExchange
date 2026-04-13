const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EduExchange API',
            version: '1.0.0',
            description: 'API for the EduExchange platform',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: ['./server/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const listingsRouter = require('./routes/listings');
const messagesRouter = require('./routes/messages');
const authRouter = require('./routes/auth');
app.use('/listings', listingsRouter);
app.use('/messages', messagesRouter);
app.use('/auth', authRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});