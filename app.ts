import 'dotenv/config'
import express from 'express'
import userRoutes from './api/routes/userRoutes'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/api/user', userRoutes)

app.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`)
})
