# ServiceWala Backend

> **Full-stack service marketplace platform - Backend API**

A comprehensive Node.js/Express backend for connecting customers with local service providers (plumbers, electricians, carpenters, etc.) with real-time booking, payments, and reviews.

---

## 🚀 **Live Demo**

- **API Base URL:** https://servicewala-backend-g4b8.onrender.com
- **Frontend:** https://servicewala-frontend-psi.vercel.app
- **Status:** ✅ Production Ready

---

## ✨ **Features**

### **Core Features:**
- ✅ Dual authentication system (Users & Workers)
- ✅ Advanced worker search with filters
- ✅ Real-time booking management
- ✅ Payment integration (Razorpay + Cash)
- ✅ Reviews & ratings system
- ✅ Image upload (Cloudinary)
- ✅ Worker availability management
- ✅ Admin dashboard
- ✅ Email notifications (optional)

### **Technical Features:**
- ✅ RESTful API design
- ✅ JWT authentication
- ✅ MongoDB with Mongoose ODM
- ✅ Input validation & sanitization
- ✅ Error handling middleware
- ✅ CORS configuration
- ✅ File upload (Multer + Cloudinary)
- ✅ Payment gateway integration

---

## 🛠️ **Tech Stack**

- **Runtime:** Node.js (v17+)
- **Framework:** Express.js
- **Database:** MongoDB (Atlas)
- **ODM:** Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **File Upload:** Multer + Cloudinary
- **Payment:** Razorpay
- **Environment:** dotenv
- **CORS:** cors

---

## 📁 **Project Structure**

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary config
├── controllers/
│   ├── userAuthController.js
│   ├── workerAuthController.js
│   ├── bookingController.js
│   ├── reviewController.js
│   ├── paymentController.js
│   └── uploadController.js
├── middleware/
│   ├── auth.js            # JWT verification
│   └── upload.js          # Multer config
├── models/
│   ├── User.js
│   ├── Worker.js
│   ├── Booking.js
│   ├── Review.js
│   └── Category.js
├── routes/
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── categoryRoutes.js
│   ├── workerRoutes.js
│   ├── reviewRoutes.js
│   ├── paymentRoutes.js
│   ├── adminRoutes.js
│   └── uploadRoutes.js
├── utils/
│   └── generateToken.js
├── .env
├── .gitignore
├── package.json
└── server.js              # Entry point
```

---

## ⚙️ **Installation & Setup**

### **Prerequisites:**
- Node.js (v17 or higher)
- MongoDB Atlas account
- Cloudinary account
- Razorpay account (for payments)

### **Step 1: Clone Repository**
```bash
git clone https://github.com/arvind-pal-101/servicewala-backend.git
cd servicewala-backend
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Environment Variables**

Create `.env` file in root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### **Step 4: Run Development Server**
```bash
npm start
```

Server will run on: `http://localhost:5000`

---

## 📡 **API Endpoints**

### **Authentication**

#### User Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (Protected)

#### Worker Authentication
- `POST /api/auth/worker/register` - Register new worker
- `POST /api/auth/worker/login` - Worker login
- `GET /api/auth/worker/me` - Get worker profile (Protected)
- `PUT /api/auth/worker/availability` - Update availability (Protected)
- `PUT /api/auth/worker/profile` - Update profile (Protected)

---

### **Categories**
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

---

### **Workers**
- `GET /api/workers` - Get all workers
- `GET /api/workers/search` - Search workers with filters
- `GET /api/workers/:id` - Get worker details
- `PUT /api/workers/:id` - Update worker (Admin)
- `DELETE /api/workers/:id` - Delete worker (Admin)

---

### **Bookings**
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings (Protected)
- `GET /api/bookings/worker-bookings` - Get worker bookings (Protected)
- `GET /api/bookings/:id` - Get booking details (Protected)
- `PUT /api/bookings/:id/accept` - Accept booking (Worker)
- `PUT /api/bookings/:id/reject` - Reject booking (Worker)
- `PUT /api/bookings/:id/start` - Start service (Worker)
- `PUT /api/bookings/:id/complete` - Complete booking (Worker)
- `PUT /api/bookings/:id/cancel` - Cancel booking (User)
- `PUT /api/bookings/:id/confirm-cash` - Confirm cash payment (Worker)

---

### **Reviews**
- `POST /api/reviews` - Create review (Protected)
- `GET /api/reviews/worker/:workerId` - Get worker reviews
- `GET /api/reviews/my-reviews` - Get user reviews (Protected)
- `PUT /api/reviews/:id` - Update review (Protected)
- `DELETE /api/reviews/:id` - Delete review (Protected)
- `POST /api/reviews/:id/report` - Report review (Protected)

---

### **Payments**
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:bookingId` - Get payment details
- `POST /api/payments/refund/:bookingId` - Refund payment (Admin)

---

### **Image Upload**
- `POST /api/upload/profile` - Upload profile image (Protected)
- `POST /api/upload/portfolio` - Upload portfolio images (Protected)
- `DELETE /api/upload/profile` - Delete profile image (Protected)
- `DELETE /api/upload/portfolio/:publicId` - Delete portfolio image (Protected)

---

### **Admin**
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/workers` - Get all workers
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/workers/:id/verify` - Verify worker
- `PUT /api/admin/workers/:id/reject` - Reject worker
- `DELETE /api/admin/users/:id` - Delete user

---

## 🔐 **Authentication**

All protected routes require JWT token in header:

```javascript
Authorization: Bearer <your_jwt_token>
```

### **Token Generation:**
Tokens are automatically generated on login/register and expire in 30 days.

---

## 💾 **Database Models**

### **User Model**
```javascript
{
  name: String,
  phone: String (unique),
  email: String,
  password: String (hashed),
  location: Object,
  role: String (user/admin),
  favoriteWorkers: [ObjectId],
  profileImage: Object,
  isActive: Boolean
}
```

### **Worker Model**
```javascript
{
  name: String,
  phone: String (unique),
  email: String,
  password: String (hashed),
  category: ObjectId,
  experience: Number,
  hourlyRate: Number,
  location: Object,
  profileImage: Object,
  portfolio: [Object],
  documents: Object,
  verification: Object,
  availability: Object,
  ratings: Object,
  totalBookings: Number,
  completedBookings: Number,
  earnings: Object,
  isActive: Boolean
}
```

### **Booking Model**
```javascript
{
  customer: ObjectId,
  worker: ObjectId,
  category: ObjectId,
  scheduledDate: Date,
  scheduledTime: String,
  serviceDetails: Object,
  pricing: Object,
  payment: Object,
  status: String,
  timeline: [Object],
  isActive: Boolean
}
```

---

## 🚀 **Deployment**

### **Platform:** Render

### **Environment Variables (Production):**
Set all variables from `.env.example` in Render dashboard.

### **Deploy Command:**
```bash
npm start
```

### **Auto-Deploy:**
Connected to GitHub for automatic deployments on push to main branch.

---

## 📝 **Scripts**

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## 🐛 **Known Issues**

- Free tier Render instances sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds

---

## 🔮 **Future Enhancements**

- [ ] Real-time notifications (Socket.io)
- [ ] Email notifications (NodeMailer)
- [ ] SMS notifications (Twilio)
- [ ] Chat system between users and workers
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Worker scheduling system
- [ ] Subscription plans for workers

---

## 👨‍💻 **Developer**

**Arvind Pal**
- GitHub: [@arvind-pal-101](https://github.com/arvind-pal-101)
- Location: Ayodhya, Uttar Pradesh, India

---

## 📄 **License**

This project is private and not open for public use.

---

## 🙏 **Acknowledgments**

- MongoDB Atlas for database hosting
- Render for backend hosting
- Cloudinary for image storage
- Razorpay for payment processing

---

## 📞 **Support**

For issues or questions, please create an issue in the GitHub repository.

---

**⭐ If you found this project useful, please consider starring the repository!**
