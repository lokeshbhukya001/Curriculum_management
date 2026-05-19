# Production-Level Authentication & Security Setup Guide

## ✅ What Has Been Implemented

### Backend (Django)
- ✅ Custom User model with roles (Admin, Teacher, Student)
- ✅ JWT Token Authentication (access + refresh tokens)
- ✅ Role-Based Access Control (RBAC)
- ✅ Password hashing with Django's built-in system
- ✅ Secure file upload validation
- ✅ Comprehensive Audit Logging
- ✅ Curriculum Versioning for rollback
- ✅ Multi-tenant support (institution_id field)
- ✅ API endpoints with role protection

### Frontend (React)
- ✅ Login/Signup pages
- ✅ Token storage and management
- ✅ Protected routes
- ✅ Automatic token refresh
- ✅ User context in API calls
- ✅ Logout functionality
- ✅ Role-based UI visibility

---

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python manage.py makemigrations student_data
python manage.py migrate
```

### 3. Initialize Database with Roles & Demo Users

```bash
python setup_roles.py
```

This creates:
- **Admin**: admin / admin123
- **Teacher**: teacher1 / teacher123
- **Student**: student1 / student123

### 4. Start Backend Server

```bash
python manage.py runserver
```

Server runs at: `http://localhost:8000`

### 5. Start Frontend

```bash
cd Frontend/frontend
npm run dev
```

App runs at: `http://localhost:5175`

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login (returns JWT tokens)
- `POST /api/auth/signup/` - Register new user
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/refresh/` - Refresh access token

### User Management
- `GET /api/users/` - List users (admin only)
- `GET /api/users/me/` - Get current user info
- `PATCH /api/users/{id}/` - Update user
- `POST /api/users/{id}/assign_role/` - Assign role (admin only)

### Programs
- `GET /api/programs/` - List (authenticated)
- `POST /api/programs/` - Create (admin only)
- `PATCH /api/programs/{id}/` - Update (admin only)
- `DELETE /api/programs/{id}/` - Delete (admin only)

### Courses
- `GET /api/courses/` - List
- `GET /api/courses/{id}/` - Detail view
- `POST /api/courses/` - Create (admin only)
- `PATCH /api/courses/{id}/` - Update (authenticated)
- `DELETE /api/courses/{id}/` - Delete (admin only)
- `POST /api/courses/{id}/enroll/` - Enroll student
- `POST /api/courses/{id}/unenroll/` - Unenroll student

### Modules & Topics
- `GET /api/modules/` - List modules
- `POST /api/modules/` - Create (admin only)
- `GET /api/topics/` - List topics
- `POST /api/topics/` - Create (admin only)

### File Upload
- `POST /api/files/` - Upload file (with validation)
- `GET /api/files/` - List files

### Dashboard
- `GET /api/stats/` - Dashboard statistics

### Audit Logs
- `GET /api/audit-logs/` - View logs (admin only)
- `GET /api/audit-logs/my_activity/` - View personal activity

---

## 🔐 Security Features

### Password Security
- Passwords hashed with Django's PBKDF2
- Minimum 8 characters enforced
- No plain text storage

### JWT Authentication
- Access token: 1 hour validity
- Refresh token: 7 days validity
- Token blacklisting on logout
- Automatic refresh on 401 responses

### File Upload Security
- Max file size: 10MB
- Allowed types: PDF, DOCX, PPTX, XLSX, TXT
- File type validation
- Virus scan ready (add Clam AV if needed)

### API Protection
- All endpoints require authentication (except login/signup)
- Role-based endpoint access
- CORS configured for frontend domains
- CSRF protection enabled

### Audit Logging
- Tracks all user actions (create, update, delete, login, logout, upload, download)
- Records IP address, user agent, timestamp
- Immutable logs (can't edit/delete)
- Admin dashboard for monitoring

---

## 🔄 Token Flow

```
1. User logs in
   ↓
2. Backend validates credentials
   ↓
3. Backend returns: access_token + refresh_token
   ↓
4. Frontend stores tokens in localStorage
   ↓
5. Frontend adds Authorization header to every request
   ↓
6. If access_token expires (401 response)
   ↓
7. Frontend uses refresh_token to get new access_token
   ↓
8. Request retried with new token
```

---

## 📊 Database Schema

### Users
- Custom User model extending Django's AbstractUser
- Fields: username, email, password, role, institution_id, phone, is_verified
- Relationships: Many-to-One with Role

### Roles
- admin: Full system access
- teacher: Manage assigned courses
- student: View enrolled courses

### Core Models
- **Program**: Top-level curriculum structure
- **Course**: Individual courses within programs
- **Module**: Sections within courses
- **Topic**: Individual topics within modules
- **Enrollment**: Student-Course relationship
- **FileUpload**: Course materials with validation
- **CurriculumVersion**: Version history for rollback
- **AuditLog**: Complete action trail

---

## 🧪 Testing Credentials

After running `python setup_roles.py`:

```
Admin User
- Username: admin
- Password: admin123
- Email: admin@cms.local
- Role: Administrator

Teacher User
- Username: teacher1
- Password: teacher123
- Email: teacher@cms.local
- Role: Teacher

Student User
- Username: student1
- Password: student123
- Email: student@cms.local
- Role: Student
```

---

## 📝 Making API Requests

### With cURL (Login)
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### With cURL (Protected Endpoint)
```bash
curl -X GET http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### With Frontend API Service
```javascript
import { login, getStats, getCourses } from '../services/api'

// Login
const result = await login('admin', 'admin123')
console.log(result.access_token)

// Use token automatically in all requests
const stats = await getStats()
const courses = await getCourses()
```

---

## ⚙️ Configuration

### Environment Variables (Backend)
Create `.env` file in Backend directory:
```
MYSQL_DATABASE=curriculum_management
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_HOST=localhost
MYSQL_PORT=3306
DEBUG=True
SECRET_KEY=your-secret-key
```

### Environment Variables (Frontend)
Create `.env.local` in Frontend/frontend directory:
```
VITE_API_URL=http://localhost:8000/api
```

---

## 🚨 Production Checklist

- [ ] Set `DEBUG=False` in Django settings
- [ ] Update `ALLOWED_HOSTS` with production domain
- [ ] Update `CORS_ALLOWED_ORIGINS` with frontend URL
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS
- [ ] Set strong `SECRET_KEY`
- [ ] Use production database (not SQLite)
- [ ] Set up proper logging
- [ ] Enable rate limiting
- [ ] Configure file upload scanning
- [ ] Set up monitoring/alerting
- [ ] Regular database backups

---

## 📞 Support

For issues or questions, check:
1. Backend logs: `Backend/` directory
2. Frontend console: Browser DevTools
3. Database: Check MySQL logs
4. Audit logs: `http://localhost:8000/admin/student_data/auditlog/`

---

## ✨ Next Steps

1. Create more pages (Profile, Settings, Admin Dashboard)
2. Add course content management
3. Implement student submissions/grading
4. Add notifications system
5. Create analytics dashboard
6. Set up automated backups
7. Configure email notifications
8. Implement 2FA (Two-Factor Authentication)
