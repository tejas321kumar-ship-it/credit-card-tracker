# 💳 Credit Card Tracker & Security Dashboard

A secure, full-stack web application for tracking credit cards, monitoring transactions, and managing budgets. Built with **Node.js**, **Express**, **SQLite**, and **Vanilla JS**.

##  Key Features

- **Security First**: 
  - Helmet headers & CSP protection
  - Rate limiting (API & Login)
  - CSRF protection (Double Submit Cookie pattern)
  - Server-side input validation & sanitization (XSS prevention)
  - HTTP Parameter Pollution (HPP) protection
- **Interactive Dashboard**:
  - Real-time spending analytics & charts
  - 3D interactive credit card UI
  - Dark/Light mode support
- **Transaction Management**:
  - Add/Edit/Delete transactions
  - **UPI Integration**: Generate deep links for payment apps
  - Recurring payments & budget tracking
- **User System**:
  - Secure authentication (bcrypt hashing)
  - Session management with "Remember Me"
  - Demo mode for quick testing

##  Tech Stack

- **Backend**: Node.js, Express.js, SQLite3
- **Security**: Helmet, csurf (custom impl), express-rate-limit, hpp, bcrypt, validator
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Icons**: Lucide Icons

##  Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/tejas321kumar-ship-it/credit-card-tracker.git
   cd credit-card-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   The app will run at `http://localhost:3000`

##  Demo Credentials

- **Email**: `demo@example.com`
- **Password**: `demo123`

##  Security Measures implemented

- **Input Validation**: All inputs are sanitized server-side to prevent injection attacks.
- **CSRF Tokens**: Required for all state-changing requests (POST/PUT/DELETE).
- **Rate Limiting**: 50 req/15min for auth routes, 100 req/15min for API.
- **Secure Headers**: HSTS, no-sniff, frame-guard enabled via Helmet.

## 📝 License

ISC License
