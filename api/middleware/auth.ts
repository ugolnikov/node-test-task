import express from 'express'
import jwt from 'jsonwebtoken'

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: number
				role: string
			}
		}
	}
}

const JWT_SECRET = process.env.JWT_SECRET as string

interface TokenPayload {
	id: number
	role: string
}

export const authenticateToken = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) => {
	const authHeader = req.headers['authorization']
	const token = authHeader?.split(' ')[1]

	if (!token) {
		return res.status(401).json({ error: 'Требуется авторизация' })
	}

	try {
		const payload = jwt.verify(token, JWT_SECRET) as unknown as TokenPayload
		req.user = payload
		next()
	} catch {
		res.status(403).json({ error: 'Недействительный токен' })
	}
}

export const requireAdmin = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) => {
	if (req.user?.role !== 'ADMIN') {
		return res.status(403).json({ error: 'Требуются права администратора' })
	}
	next()
}

export const canAccessUser = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) => {
	const userId = req.params.id
	const userIdNum = Array.isArray(userId)
		? parseInt(userId[0])
		: parseInt(userId)

	if (req.user?.role === 'ADMIN' || req.user?.id === userIdNum) {
		next()
	} else {
		res.status(403).json({ error: 'Доступ запрещён' })
	}
}

export default { authenticateToken, requireAdmin, canAccessUser }
