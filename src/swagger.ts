// app.js
const swaggerJSDoc = require('swagger-jsdoc');

// Configure the app to use Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.1',
    info: {
      title: 'Analytics & Reporting APIs',
      version: '1.0.0',
      description: 'Reporting and Analytics APIs Swagger documentation',
    },
  },
  apis: ['./src/routes/*.ts'],
};
export const swaggerSpec = swaggerJSDoc(swaggerOptions);
// export default swaggerSpec;

