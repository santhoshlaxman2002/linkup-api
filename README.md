# Linkup API

A clean, extensible skeleton for a social media backend API built with Node.js, TypeScript, Express, and PostgreSQL, following Object-Oriented Programming (OOP) principles.

---

## 🛠 Technology Stack

- **Backend:** Node.js, TypeScript, Express.js
- **Database:** PostgreSQL (via `pg` driver)
- **Architecture:** Class-based, OOP (Encapsulation, Inheritance, Abstraction, Polymorphism)
- **Authentication:** JWT (ready for implementation)
- **Logging:** Winston-based, with environment-aware configuration

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v6.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12.0.0 or higher)
- [Docker](https://www.docker.com/) (optional, for containerized setup)

---

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd linkup-api
```

### 2. Environment Configuration

Create a `.env` file in the root directory by copying the example:

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=linkup_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Docker DB env Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=linkup_db
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

#### Option A: Local PostgreSQL Installation

1. Install PostgreSQL on your system
2. Create a database named `linkup_db`
3. Update the database credentials in your `.env` file

#### Option B: Docker Database (Recommended)

Start only the database service:

```bash
docker-compose up db -d
```

This will start PostgreSQL in a Docker container with the following default settings:
- **Host:** localhost
- **Port:** 5432
- **Database:** linkup_db
- **Username:** postgres
- **Password:** postgres

### 5. Build and Run

#### Development Mode

```bash
npm run dev
```

This will start the server with hot reload using nodemon.

#### Production Mode

```bash
npm run build
npm start
```

### 6. Verify Installation

Visit `http://localhost:5000/health` to check if the API is running correctly. You should see:

```json
{
  "status": "ok"
}
```

---

## 🐳 Docker Setup (Alternative)

For a complete containerized setup:

### 1. Build and Run with Docker Compose

```bash
docker-compose up -d
```

This will:
- Build the Node.js application
- Start PostgreSQL database
- Run the API server on port 5000

### 2. Access the Application

- **API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

### 3. Stop the Services

```bash
docker-compose down
```

---

## 🛠 Development Workflow

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Remove compiled files
- `npm run prebuild` - Clean before building

### Project Structure

```
src/
├── controllers/     # API route controllers
├── database/        # Database connection and models
├── routes/          # Express route definitions
├── server.ts        # Main server entry point
└── utils/           # Utility functions and logging
```

### Adding New Features

1. Create controllers in `src/controllers/`
2. Define routes in `src/routes/`
3. Add database models in `src/database/`
4. Update `src/routes/baseRouter.ts` to include new routes

---

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Port Already in Use**
   - Change the `PORT` in `.env` file
   - Kill existing processes using the port

3. **Docker Issues**
   - Ensure Docker is running
   - Try `docker-compose down` then `docker-compose up --build`

### Logs

Application logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `http.log` - HTTP request logs

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Available Endpoints

#### Health Check
- **GET** `/health`
- **Description:** Check if the API is running
- **Response:**
  ```json
  {
    "status": "ok"
  }
  ```

### Authentication
The API is configured for JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Error Handling
The API returns standardized error responses:
```json
{
  "error": "Error message",
  "status": "error"
}
```

---

## 🚀 Quick Start

For the fastest setup:

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd linkup-api
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Start database:**
   ```bash
   docker-compose up db -d
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   curl http://localhost:5000/health
   ```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.