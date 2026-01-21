import { prisma } from '@lib/prisma'
import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

interface TokenPayload {
	id: number
	role: string
}

// Вспомогательная функция для безопасного парсинга id
const parseId = (id: string | string[]): number => {
	return Array.isArray(id) ? parseInt(id[0]) : parseInt(id)
}

// Регистрация
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID пользователя
 *         fname:
 *           type: string
 *           description: Фамилия
 *         lname:
 *           type: string
 *           description: Имя
 *         patronymic:
 *           type: string
 *           description: Отчество
 *         email:
 *           type: string
 *           description: Email
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           description: Роль
 *         status:
 *           type: boolean
 *           description: Статус активности
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT токен
 *         user:
 *           $ref: '#/components/schemas/User'
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Сообщение об ошибке
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lname
 *               - email
 *               - password
 *             properties:
 *               fname:
 *                 type: string
 *               lname:
 *                 type: string
 *               patronymic:
 *                 type: string
 *               birthdate:
 *                 type: string
 *                 format: date-time
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Успешная регистрация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (req: express.Request, res: express.Response) => {
	const { fname, lname, patronymic, birthdate, email, password } = req.body

	if (!lname || !email || !password) {
		return res.status(400).json({ error: 'Заполни обязательные поля' })
	}

	const exist = await prisma.user.findUnique({ where: { email } })
	if (exist) {
		return res.status(400).json({ error: 'Email уже есть' })
	}

	const hash = await bcrypt.hash(password, 10)
	const user = await prisma.user.create({
		data: {
			fname,
			lname,
			patronymic,
			birthdate: new Date(birthdate),
			email,
			password: hash
		}
	})

	const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
		expiresIn: '1d'
	})
	res.json({ token, user: { id: user.id, email: user.email, role: user.role } })
}

// Авторизация
/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login = async (req: express.Request, res: express.Response) => {
	const { email, password } = req.body

	const user = await prisma.user.findUnique({ where: { email } })
	if (!user) {
		return res.status(400).json({ error: 'Неверный email или пароль' })
	}

	const ok = await bcrypt.compare(password, user.password)
	if (!ok) {
		return res.status(400).json({ error: 'Неверный email или пароль' })
	}

	const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
		expiresIn: '1d'
	})
	res.json({ token, user: { id: user.id, email: user.email, role: user.role } })
}

// Получить одного юзера
/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     fname:
 *                       type: string
 *                     lname:
 *                       type: string
 *                     patronymic:
 *                       type: string
 *                       nullable: true
 *                     birthdate:
 *                       type: string
 *                       format: date
 *                     email:
 *                       type: string
 *                       format: email
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет доступа к чужому профилю
 *       404:
 *         description: Пользователь не найден
 */
export const getUser = async (req: express.Request, res: express.Response) => {
	const id = parseId(req.params.id)
	const user = await prisma.user.findUnique({ where: { id } })

	if (!user) return res.status(404).json({ error: 'Не найден' })

	if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
		return res.status(403).json({ error: 'Нет доступа' })
	}

	res.json({
		user: {
			fname: user.fname,
			lname: user.lname,
			patronymic: user.patronymic,
			birthdate: user.birthdate.toISOString().split('T')[0],
			email: user.email
		}
	})
}

// Список всех юзеров (только админ)
/**
 * @swagger
 * /api/user/:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Требуется авторизация
 *       403:
 *         description: Нет прав администратора
 */
export const getUsers = async (req: express.Request, res: express.Response) => {
	const users = await prisma.user.findMany({
		select: {
			id: true,
			fname: true,
			lname: true,
			email: true,
			role: true,
			status: true
		}
	})
	res.json({ users })
}

// Заблокировать/разблокировать
export const toggleStatus = async (
	req: express.Request,
	res: express.Response
) => {
	const id = parseId(req.params.id)
	const { status } = await prisma.user.findFirstOrThrow({ where: { id } })
	const block = !status

	const user = await prisma.user.update({
		where: { id },
		data: { status: block }
	})

	res.json({
		user: {
			id: user.id,
			status: user.status,
			fname: user.fname,
			lname: user.lname,
			patronymic: user.patronymic
		},
		message: block ? 'Заблокирован' : 'Разблокирован'
	})
}
