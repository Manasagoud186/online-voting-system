# 🗳️ Online Voting System with Secure Database Transactions

> A production-inspired full-stack online voting platform built with **React, Node.js, Express, and MySQL**, designed to demonstrate secure authentication, transactional database operations, concurrency control, and modern full-stack architecture.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange)

---

# 📖 Overview

The **Online Voting System** is a secure digital election platform that enables authenticated users to cast votes while ensuring **data integrity**, **transaction safety**, and **one-person-one-vote** enforcement.

The application follows a modern full-stack architecture where:

- React provides an interactive user experience.
- Express exposes RESTful APIs.
- MySQL stores election data securely.
- Database transactions guarantee vote consistency.
- Authentication protects voting operations.

The project was developed to simulate a real-world election system while demonstrating best practices in **full-stack development**, **database management**, and **secure application design**.

---

# ✨ Key Features

## 👤 Voter Features

- User Registration
- Secure Login Authentication
- View Election Status
- View Candidate Profiles
- Vote Once Only
- NOTA (None Of The Above)
- View Election Results
- User Profile Management

---

## 🛠 Admin Features

- Admin Authentication
- Dashboard Analytics
- Candidate Management
- Election Control
- View Registered Voters
- Live Election Statistics
- Election Result Management

---

## 🔒 Security Features

- Authentication using secure tokens
- Password hashing
- Protected API routes
- One Vote Per Voter validation
- Database Transactions
- ACID Compliance
- Concurrency Handling
- Row Locking during voting
- Foreign Key Constraints

---

# 🏗 System Architecture

```
                React Frontend
                       │
                REST API Requests
                       │
             Node.js + Express Server
                       │
          Business Logic & Authentication
                       │
                   MySQL Database
```

---

# 🗄 Database Design

The application uses a relational database with normalized tables.

## Tables

### Voters

Stores voter information.

- voter_id
- name
- email
- password
- has_voted

---

### Candidates

Stores candidate information.

- candidate_id
- name
- party
- biography
- experience
- policies
- vote_count

---

### Votes

Stores every vote.

- vote_id
- voter_id
- candidate_id
- vote_time

---

# 🔄 Voting Transaction Flow

One vote consists of multiple database operations.

```
START TRANSACTION

↓

Check voter eligibility

↓

Verify candidate

↓

Insert vote

↓

Increase candidate vote count

↓

Update voter status

↓

COMMIT

↓

If any operation fails

↓

ROLLBACK
```

This guarantees that partial voting operations never occur.

---

# ⚡ Concurrency Handling

The project prevents race conditions during simultaneous voting.

Techniques used:

- Database Transactions
- Row Level Locking (`SELECT ... FOR UPDATE`)
- ACID Properties
- Transaction Rollback

---

# 🧠 Tech Stack

## Frontend

- React
- React Router
- JavaScript (ES6+)
- CSS3

## Backend

- Node.js
- Express.js
- REST APIs

## Database

- MySQL
- SQL Transactions

## Tools

- Git
- GitHub
- VS Code
- Postman

---

# 📂 Project Structure

```
online-voting-system/
│
├── client/                           # React Frontend
│   ├── public/
│   │
│   ├── src/
│   │   ├── admin/                    # Admin Pages
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── AdminCandidatesPage.jsx
│   │   │   ├── AdminAddCandidatePage.jsx
│   │   │   ├── AdminElectionPage.jsx
│   │   │   ├── AdminResultsPage.jsx
│   │   │   ├── AdminStatisticsPage.jsx
│   │   │   ├── AdminVotersPage.jsx
│   │   │   ├── AdminLoginPage.jsx
│   │   │   └── AdminLayout.jsx
│   │   │
│   │   ├── components/               # Reusable Components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── VoterNav.jsx
│   │   │
│   │   ├── pages/                    # Voter Pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── VotingPage.jsx
│   │   │   ├── ResultsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SuccessPage.jsx
│   │   │
│   │   ├── styles/                   # Application Styling
│   │   │   ├── admin.css
│   │   │   ├── admin-login.css
│   │   │   ├── voter.css
│   │   │   ├── react-tweaks.css
│   │   │   └── success-extra.css
│   │   │
│   │   ├── api.js                    # API Configuration
│   │   ├── ToastContext.jsx          # Global Toast Notifications
│   │   ├── App.jsx                   # Application Routes
│   │   └── main.jsx                  # React Entry Point
│   │
│   ├── package.json
│   └── vite.config.js
│
├── database/                         # Database Schema & SQL Scripts
│   └── schema.sql
│
├── server.js                         # Express Server
├── package.json                      # Backend Dependencies
├── .env.example                      # Environment Variables Template
│
├── seed-candidates.js                # Seed Initial Candidate Data
├── setup-db.js                       # Database Initialization
├── import-voters.js                  # Import Voter Dataset
├── update-voter-dobs.js              # Update Voter DOB Records
│
├── check-voters.js                   # Verify Imported Voters
├── debug-password.js                 # Password Debug Utility
├── debug-voter-specific.js           # Individual Voter Debugging
├── debug-voters.js                   # Voter Data Validation
│
├── voters.csv                        # Sample Voter Dataset
├── voters_check.json                 # Validation Output
│
├── .gitignore
└── README.md
```

## Install Dependencies

Backend

```bash
npm install
```

Frontend

```bash
cd client
npm install
```

---

## Configure Environment

Create a `.env` file.

```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
PORT=
```

---

## Seed Database

```bash
node seed-candidates.js
```

---

## Start Backend

```bash
npm start
```

---

## Start Frontend

```bash
cd client
npm run dev
```

---

# 📸 Screenshots

## Home Page
<img width="996" height="436" alt="image" src="https://github.com/user-attachments/assets/e95e57cf-160f-40bc-951d-7fe71d008e7c" />

## Login
<img width="995" height="502" alt="image" src="https://github.com/user-attachments/assets/67b4f99a-a2e3-43fb-a62c-8ec1d51d9cfa" />

## Voting Page
<img width="975" height="697" alt="image" src="https://github.com/user-attachments/assets/9a275212-f73d-4f2b-8db1-de7ba8a9db5d" />

## Admin Dashboard
<img width="924" height="427" alt="image" src="https://github.com/user-attachments/assets/233ccceb-631d-4a75-9cc6-31439e0594ef" />

<img width="970" height="448" alt="image" src="https://github.com/user-attachments/assets/bca38f45-a802-4666-ba8c-1b9a7ed1057b" />



## Results Page
<img width="935" height="661" alt="image" src="https://github.com/user-attachments/assets/18bd9b32-4bae-4eb7-8df9-f488e0f0bde1" />

---

# 🎯 Learning Outcomes

This project strengthened my understanding of:

- Full Stack Development
- REST API Design
- React Component Architecture
- Authentication
- Database Transactions
- ACID Properties
- MySQL Relationships
- Concurrency Control
- Git & GitHub Workflow
- Real-world Software Architecture

---

# 🔮 Future Improvements

- JWT Refresh Tokens
- Email Verification
- OTP Authentication
- Blockchain-backed Voting
- Real-time Vote Analytics
- Docker Deployment
- CI/CD Pipeline
- Cloud Deployment (AWS/GCP/Azure)

---

# 👩‍💻 Author

**Varshini Gurram**

B.Tech Computer Science & Engineering (Data Science)

Passionate about Full Stack Development, Backend Systems, Databases, and Software Engineering.

LinkedIn: *https://www.linkedin.com/in/gurram-varshini-96008231a/*

GitHub: *https://github.com/Varshinigurram*

---

# ⭐ If you found this project useful, consider giving it a star!
