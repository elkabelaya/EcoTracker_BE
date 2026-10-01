# API Examples for EcoTracker Backend

## Authentication

### Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Refresh Access Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

### Get User Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Habits

### Create Habit
Categories: 0=TRANSPORT, 1=WASTE, 2=WATER, 3=PLASTIC

```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Use public transport",
    "category": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }'
```

Response:
```json
{
  "id": 1,
  "title": "Use public transport",
  "category": 0,
  "isCompleted": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "syncVersion": 1,
  "isDeleted": false,
  "userId": "user-uuid"
}
```

### Get All Habits
```bash
curl -X GET http://localhost:3000/api/habits \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Habits by Category
```bash
curl -X GET http://localhost:3000/api/habits/category/0 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Single Habit
```bash
curl -X GET http://localhost:3000/api/habits/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Habit
```bash
curl -X PUT http://localhost:3000/api/habits/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "isCompleted": true,
    "updatedAt": "2024-01-15T14:00:00Z"
  }'
```

### Delete Habit
```bash
curl -X DELETE http://localhost:3000/api/habits/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Sync

### Get Changes Since Last Sync
```bash
curl -X GET "http://localhost:3000/api/sync?lastSyncAt=2024-01-15T10:00:00Z" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Full Sync (Send Changes + Get Updates)
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "lastSyncAt": "2024-01-15T10:00:00Z",
    "changes": [
      {
        "title": "New habit from mobile",
        "category": 1,
        "isCompleted": false,
        "createdAt": "2024-01-15T12:00:00Z",
        "updatedAt": "2024-01-15T12:00:00Z"
      },
      {
        "id": 2,
        "title": "Updated habit",
        "category": 0,
        "isCompleted": true,
        "createdAt": "2024-01-15T08:00:00Z",
        "updatedAt": "2024-01-15T13:00:00Z"
      },
      {
        "id": 3,
        "deleted": true
      }
    ]
  }'
```

Response:
```json
{
  "habits": [
    {
      "id": 1,
      "title": "Use public transport",
      "category": 0,
      "isCompleted": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "syncVersion": 1,
      "isDeleted": false,
      "userId": "user-uuid"
    },
    {
      "id": 4,
      "title": "New habit from mobile",
      "category": 1,
      "isCompleted": false,
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z",
      "syncVersion": 1,
      "isDeleted": false,
      "userId": "user-uuid"
    }
  ],
  "lastSyncAt": "2024-01-15T14:30:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{ "error": "Email and password are required" }
```

### 401 Unauthorized
```json
{ "error": "Invalid or expired access token" }
```

### 404 Not Found
```json
{ "error": "Habit not found" }
```

### 409 Conflict
```json
{ "error": "Habit with this title and category already exists" }
```

### 500 Internal Server Error
```json
{ "error": "Internal server error" }
```
