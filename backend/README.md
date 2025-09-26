# Dreamflow Backend API

A comprehensive backend API for the Dreamflow dream journal app, built with Node.js, Express, and MySQL.

## Features

- **User Authentication**: Registration, login, password reset, profile management
- **Dream Journal**: CRUD operations for dream entries with search and statistics
- **Sleep Tracking**: Sleep session management, statistics, and quiz responses
- **Notifications**: Customizable sleep reminders and notifications
- **User Preferences**: Sleep type, SOS relief, and mentor preferences
- **Security**: JWT authentication, rate limiting, CORS protection
- **Database**: MySQL with connection pooling and automatic table creation

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=dreamflow_db
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Email Configuration (for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create MySQL database:**
   ```sql
   CREATE DATABASE dreamflow_db;
   ```

5. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will automatically create all necessary database tables on startup.

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| POST | `/change-password` | Change password (authenticated) | Yes |

### Journal Entries (`/api/journal`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all journal entries | Yes |
| GET | `/:id` | Get specific journal entry | Yes |
| POST | `/` | Create new journal entry | Yes |
| PUT | `/:id` | Update journal entry | Yes |
| DELETE | `/:id` | Delete journal entry | Yes |
| GET | `/search` | Search journal entries | Yes |
| GET | `/stats` | Get journal statistics | Yes |

### Sleep Tracking (`/api/sleep`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/sessions` | Get sleep sessions | Yes |
| GET | `/sessions/:id` | Get specific sleep session | Yes |
| POST | `/sessions/start` | Start sleep session | Yes |
| PUT | `/sessions/:id/end` | End sleep session | Yes |
| PUT | `/sessions/:id` | Update sleep session | Yes |
| DELETE | `/sessions/:id` | Delete sleep session | Yes |
| GET | `/stats` | Get sleep statistics | Yes |
| POST | `/quiz` | Save quiz response | Yes |
| GET | `/quiz` | Get quiz responses | Yes |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all notifications | Yes |
| POST | `/` | Create notification | Yes |
| PUT | `/:id` | Update notification | Yes |
| DELETE | `/:id` | Delete notification | Yes |
| PATCH | `/:id/toggle` | Toggle notification | Yes |
| GET | `/type/:type` | Get notifications by type | Yes |
| POST | `/setup-sleep` | Setup sleep notifications | Yes |

### User Preferences (`/api/preferences`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user preferences | Yes |
| PUT | `/` | Update preferences | Yes |
| PUT | `/sleep-type` | Update sleep type | Yes |
| PUT | `/sos-relief` | Update SOS relief preferences | Yes |
| PUT | `/mentor` | Update mentor preferences | Yes |
| DELETE | `/` | Reset preferences | Yes |

## Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `first_name`, `last_name`, `username`
- `avatar_url`
- `sleep_goal`, `bedtime`, `wake_time`
- `sound_enabled`, `notifications_enabled`
- `created_at`, `updated_at`

### Journal Entries Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `title`, `description`
- `mood`, `sleep_quality`
- `tags` (JSON)
- `dream_date`
- `created_at`, `updated_at`

### Sleep Sessions Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `start_time`, `end_time`
- `duration` (hours)
- `quality`, `notes`
- `created_at`, `updated_at`

### Additional Tables
- `sleep_quiz_responses`
- `notifications`
- `password_reset_tokens`
- `user_preferences`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

All API responses follow this format:

```json
{
  "success": boolean,
  "message": "string",
  "data": object (optional),
  "errors": array (optional)
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Custom rate limits can be configured in `server.js`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Helmet.js security headers
- Input validation with express-validator
- SQL injection protection with parameterized queries

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Environment Variables
Make sure to set up all required environment variables in your `.env` file before running the server.

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a production MySQL database
3. Set strong JWT secrets
4. Configure proper CORS origins
5. Use a process manager like PM2
6. Set up SSL/TLS certificates
7. Configure reverse proxy (nginx)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
