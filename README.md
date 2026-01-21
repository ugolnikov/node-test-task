# Тестовое задание Node.js

REST API для управления пользователями

## Технологии

- Node.js + Express
- TypeScript
- Prisma ORM (SQLite)
- JWT Auth

## Установка

```bash
npm install
```

## Настройка

.env:

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
PORT=3000
```

## Запуск

- **Разработка**: `npm run dev`
- **Проект**: `npm start`

## Конечные точки API

| Метод | URL                     | Описание                     | Нужен ли админ   |
| ----- | ----------------------- | ---------------------------- | ---------------- |
| POST  | /api/user/register      | Регистрация                  | Нет              |
| POST  | /api/user/login         | Авторизация                  | Нет              |
| GET   | /api/user/              | Список пользователей         | Да               |
| GET   | /api/user/**:id**       | Получить пользователя        | Только для чужих |
| PATCH | /api/user/**:id**/block | Заблокировать/разблокировать | Да               |
