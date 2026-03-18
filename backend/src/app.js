require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const authRouter = require('./routes/auth');
const accountHoldersRouter = require('./routes/accountHolders');
const accountsRouter = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');
const transfersRouter = require('./routes/transfers');
const { accountCardsRouter, cardsRouter } = require('./routes/cards');
const statementsRouter = require('./routes/statements');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Body parser ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NeoBank API',
      version: '1.0.0',
      description:
        'A virtual-only digital banking REST API. All endpoints except /auth/signup and /auth/login require a Bearer JWT.',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // swagger-jsdoc scans these files for @swagger JSDoc comments
  apis: [path.join(__dirname, 'routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/account-holders', accountHoldersRouter);
app.use('/accounts', accountsRouter);

// Nested under /accounts/:id — mergeParams routers handle the parent param
app.use('/accounts/:id/transactions', transactionsRouter);
app.use('/accounts/:id/cards', accountCardsRouter);
app.use('/accounts/:id/statements', statementsRouter);

// Standalone card actions
app.use('/cards', cardsRouter);

// Transfers are always intra-user
app.use('/transfers', transfersRouter);

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`NeoBank API running on http://localhost:${PORT}`);
    console.log(`API docs:           http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
