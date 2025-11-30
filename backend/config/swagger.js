const swaggerJsdoc = require("swagger-jsdoc");

const PORT = Number(process.env.PORT) || 8000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Soksok Language API",
      version: "1.0.0",
      description: "REST API specification for the Soksok Language platform",
    },
    servers: [
      {
        url: SERVER_URL,
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "user_sid",
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerSpec };

