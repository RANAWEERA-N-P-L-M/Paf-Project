# UniCore - Smart Campus Authentication System

A full-stack campus authentication system built with Spring Boot (backend) and React + Vite (frontend), using MongoDB and Google OAuth2.

---

## Prerequisites

Make sure you have the following installed before running the project:

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 21 | https://adoptium.net |
| Node.js | 18+ | https://nodejs.org |
| Git | latest | https://git-scm.com |

> Maven is **not required** — the project includes a Maven wrapper (`mvnw`).

---

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

## 2. Configure the Backend

The `application.properties` file is **not included** in the repository for security reasons.

Create the file at:
```
src/main/resources/application.properties
```

Paste the following and fill in your own values:

```properties
spring.application.name=unicore

# MongoDB
spring.data.mongodb.uri=YOUR_MONGODB_URI

# JWT (must be at least 32 characters)
jwt.secret=YOUR_JWT_SECRET_KEY_MIN_32_CHARACTERS
jwt.expiration=86400000

# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.google.scope=email,profile

# Server
server.port=8081
```

### Getting your credentials

**MongoDB URI:**
- Create a free cluster at https://mongodb.com/atlas
- Under "Connect", choose "Drivers" and copy the connection string
- Replace `<password>` with your database user password

**Google OAuth2:**
- Go to https://console.cloud.google.com
- Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
- Application type: **Web application**
- Add Authorized redirect URI: `http://localhost:8081/login/oauth2/code/google`
- Copy the **Client ID** and **Client Secret**

---

## 3. Run the Backend

From the **root project folder**:

**Windows:**
```bash
mvnw.cmd spring-boot:run
```

**Linux / Mac:**
```bash
./mvnw spring-boot:run
```

The backend will start at: `http://localhost:8081`

---

## 4. Run the Frontend

Open a new terminal and navigate to the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at: `http://localhost:5173`

---

## Project Structure

```
unicore/
├── src/                        # Spring Boot backend
│   └── main/
│       ├── java/com/unicore/   # Java source code
│       └── resources/
│           └── application.properties  # (you create this)
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── routes/
│   └── package.json
└── pom.xml
```

---

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.3, Spring Security, JWT, OAuth2
- **Database:** MongoDB Atlas
- **Frontend:** React 19, Vite, Tailwind CSS, Axios
- **Auth:** JWT + Google OAuth2
