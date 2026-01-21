import swaggerJSDoc from 'swagger-jsdoc'

const PORT = process.env.PORT || 3000
export const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'User API',
			version: '1.0.0',
			description: 'REST API для управления пользователями с авторизацией JWT',
			contact: {
				name: 'Developer'
			}
		},
		servers: [
			{
				url: `http://localhost:${PORT}`,
				description: 'Development server'
			}
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			}
		},
		security: [{ bearerAuth: [] }]
	},
	apis: ['./api/routes/*.ts', './api/controllers/*.ts']
}

export const swaggerSpec = swaggerJSDoc(swaggerOptions)
