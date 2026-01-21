import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

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
