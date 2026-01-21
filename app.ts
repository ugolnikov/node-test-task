import 'dotenv/config'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './api/lib/swagger'
import userRoutes from './api/routes/userRoutes'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/api/user', userRoutes)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`)
	console.log(`Документация: http://localhost:${PORT}/api-docs`)
})

export default app
