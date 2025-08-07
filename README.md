
# Dream Scholar

This is the backend server for the **Dream Scholar** project — a MERN-based Scholarship Management System.

---

## 🚀 Features

- JWT-based Authentication and Role Management
- Secure APIs for Admin, Moderator, and User operations
- Scholarship CRUD operations
- Review system
- Stripe integration for payment
- MongoDB with Mongoose for data management

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Stripe
- JSON Web Token (JWT)
- CORS
- Dotenv

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Shahadat1530/dream-scholar-server.git
cd dream-scholar-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory with the following content:

```env
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
ACCESS_TOKEN=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

> 🔒 Make sure you never share your `.env` file publicly.

### 4. Start the server

```bash
npm run dev
```

> The server should now be running on `http://localhost:5000`.

---

## 📦 API Routes

The backend supports RESTful APIs for:

- User Authentication & Roles
- Scholarships
- Reviews
- Applications
- Stripe Payments

---

## 📬 Contact

email: shahadatriad676@gmail.com

---

