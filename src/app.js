const express = require('express');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();
app.use(express.json());

app.use('/health', require('./routes/health.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/shipments', require('./routes/shipment.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
