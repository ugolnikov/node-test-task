import {
	getUser,
	getUsers,
	login,
	register,
	toggleStatus
} from '@controllers/userController'
import {
	authenticateToken,
	canAccessUser,
	requireAdmin
} from '@middleware/auth'
import express from 'express'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/', authenticateToken, requireAdmin, getUsers)
router.get('/:id', authenticateToken, canAccessUser, getUser)
router.patch('/:id/block', authenticateToken, toggleStatus)

export default router
