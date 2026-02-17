# 📋 Todo & Expense Management App

A full-stack application for managing todos, expenses, and folders with user authentication, role-based access control, and real-time updates.

## ✨ Features

- 📝 **Todo Management** - Create, update, delete, and track todo tasks
- 💰 **Expense Tracking** - Manage and monitor expenses with categorization
- 📁 **Folder Organization** - Organize tasks and expenses into folders
- 👥 **User Management** - Admin panel for managing users and roles
- 🔐 **Authentication** - Secure JWT-based authentication with role-based access control
- 📊 **Dashboard** - Overview of today's todos and expense summary
- 🎨 **Responsive UI** - Modern interface built with PrimeReact and TailwindCSS
- 🔑 **Forgate Password** - reset password Usein link in mail 

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite (Build tool)
- Redux Toolkit (State management)
- PrimeReact (UI Components)
- TailwindCSS (Styling)
- js-cookie (Cookie management)

**Backend:**
- Node.js & Express
- Sequelize (ORM)
- JWT (Authentication)
- MySQL (Database)

## 📦 Installation

### Frontend Setup
```bash
cd Client
npm install
npm run dev
```

### Backend Setup
```bash
cd Server
npm install
npm start
```

The frontend runs on `http://localhost:5173` and backend on `http://localhost:5000`.

## 📄 Project Structure

```
Client/
├── src/
│   ├── Pages/           # Page components (Login, Dashboard, Todo, etc.)
│   ├── components/      # Reusable components (ProtectedRoute, Navbar)
│   ├── store/          # Redux slices (auth, todo, expense, folder)
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point

Server/
├── controllers/        # Business logic
├── routes/            # API endpoints
├── models/            # Database models
├── middleware/        # Auth middleware
├── config/            # Database configuration
└── server.js          # Server entry point
```

## 🖼️ Main Pages

- **Login/Register** - User authentication
- **Dashboard** - Quick overview of today's todos and expense summary
- **Todo** - Full todo management interface with DataTable
- **Expense** - Expense tracking with categorization
- **Folder Structure** - Organize items into custom folders
- **Users** - Admin panel for user management
- **Profile** - User profile settings

## 🔒 User Roles

- **Admin** - Full access to all features, user management
- **User** - Standard access to personal todos and expenses

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies for both Client and Server
3. Configure database in `Server/config/db.js`
4. Run migrations (if applicable)
5. Start the backend server: `npm start`
6. Start the frontend dev server: `npm run dev`
7. Login with your credentials or register a new account

## 📝 License

This project is open source and available under the MIT License.
