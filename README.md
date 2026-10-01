# EcoTracker Backend

REST API для синхронизации базы данных привычек с PostgreSQL и JWT аутентификацией.

## Технологии

- **Node.js** + TypeScript
- **PostgreSQL** - база данных
- **Prisma ORM** - работа с БД
- **JWT** (Access/Refresh tokens) - аутентификация
- **Express.js** - веб фреймворк

## Локальный запуск

### 1. Требования

- Node.js >= 18
- PostgreSQL >= 14
- npm или yarn

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка PostgreSQL

Создайте базу данных:

```bash
createdb ecotracker
# или через psql:
# CREATE DATABASE ecotracker;
```

### 4. Настройка переменных окружения

Скопируйте пример конфигурации:

```bash
cp .env.example .env
```

Отредактируйте `.env` с вашими настройками PostgreSQL:

```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ecotracker?schema=public"
```

### 5. Инициализация базы данных

```bash
npm run prisma:push
# или для миграций:
npm run prisma:migrate
```

### 6. Запуск сервера

Разработка (с авто-перезагрузкой):

```bash
npm run dev
```

Продакшн:

```bash
npm run build
npm start
```

Сервер запустится на `http://localhost:3000`

## API Endpoints

### Аутентификация

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация пользователя |
| POST | `/api/auth/login` | Вход в систему |
| POST | `/api/auth/refresh-token` | Обновление access token |
| POST | `/api/auth/logout` | Выход из системы |
| GET | `/api/auth/profile` | Получение профиля пользователя |

### Привычки (требуется авторизация)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/habits` | Получить все привычки пользователя |
| GET | `/api/habits/category/:category` | Привычки по категории (0-3) |
| GET | `/api/habits/:id` | Получить одну привычку |
| POST | `/api/habits` | Создать новую привычку |
| PUT | `/api/habits/:id` | Обновить привычку |
| DELETE | `/api/habits/:id` | Удалить привычку |

### Синхронизация (требуется авторизация)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/sync` | Получить изменения с lastSyncAt |
| POST | `/api/sync` | Отправить локальные изменения |

## Примеры запросов

### Регистрация

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securePassword123"}'
```

### Вход

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securePassword123"}'
```

### Создание привычки

```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title": "Использовать общественный транспорт", "category": 0, "createdAt": "2024-01-01T10:00:00Z"}'
```

### Синхронизация

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"lastSyncAt": "2024-01-01T10:00:00Z", "changes": [...]}'
```

## Развертывание на сервере

### Docker (рекомендуется)

Создайте `Dockerfile` в корне проекта:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

Создайте `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/ecotracker?schema=public
      - JWT_ACCESS_SECRET=your-production-access-secret
      - JWT_REFRESH_SECRET=your-production-refresh-secret
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=ecotracker

volumes:
  postgres_data:
```

Запуск:

```bash
docker-compose up -d
```

### Heroku

1. Установите Heroku CLI
2. Создайте приложение: `heroku create ecotracker-api`
3. Настройте переменные окружения:

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET="your-secret"
heroku config:set JWT_REFRESH_SECRET="your-secret"
```

4. Подключите PostgreSQL аддон:

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

5. Запустите миграции:

```bash
heroku run npx prisma migrate deploy
heroku run npx prisma generate
```

6. Деплой:

```bash
git push heroku main
```

### Railway / Render

1. Подключите репозиторий GitHub
2. Настройте переменные окружения в панели управления
3. Укажите build command: `npm install && npm run build`
4. Укажите start command: `npm start`

### Vercel

**Важно:** Vercel оптимизирован для serverless функций. Для Express.js приложения требуется специальная настройка.

#### 1. Создайте `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

#### 2. Настройте проект в Vercel

1. Установите Vercel CLI или используйте веб-интерфейс
2. Подключите GitHub репозиторий
3. В настройках проекта укажите:
   - **Framework Preset**: Other
   - **Build Command**: `npm install && npx prisma generate`
   - **Output Directory**: `.vercel/output`

#### 3. Настройте переменные окружения

В панели Vercel (Settings → Environment Variables) добавьте:

```
DATABASE_URL=postgresql://user:password@host:5432/ecotracker?schema=public
JWT_ACCESS_SECRET=your-production-access-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
NODE_ENV=production
```

#### 4. Подключите PostgreSQL

Используйте один из вариантов:

**Vercel Postgres (рекомендуется):**
```bash
vercel postgres create
# Скопируйте DATABASE_URL из ответа
```

**Neon (бесплатно):**
1. Создайте проект на https://neon.tech
2. Получите connection string
3. Добавьте как DATABASE_URL в Vercel

**Supabase (бесплатно):**
1. Создайте проект на https://supabase.com
2. Получите connection string из Project Settings → Database
3. Добавьте как DATABASE_URL в Vercel

#### 5. Деплой

Через CLI:
```bash
vercel deploy --prod
```

Или через GitHub - автоматический деплой при пуше в main ветку.

#### 6. Примените миграции

После первого деплоя выполните:
```bash
vercel run npx prisma db push
# или через Vercel CLI в production:
vercel exec your-app-name "npx prisma db push"
```

#### Ограничения Vercel

- Serverless функции имеют лимит времени выполнения (4s на free, 60s на Pro)
- Долгие операции синхронизации могут прерываться
- Для production с активными пользователями рассмотрите Railway/Render/Docker

## Безопасность

⚠️ **Важно для продакшена:**

1. Измените `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` на случайные строки
2. Используйте HTTPS в продакшене
3. Настройте CORS для ваших доменов
4. Добавьте rate limiting
5. Используйте сильные пароли для PostgreSQL

## Лицензия

MIT
