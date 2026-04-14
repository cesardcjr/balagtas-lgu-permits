# Balagtas e-Permit System

## Municipality of Balagtas — Engineering Office
### Online Permit Application System

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Git

---

## 📦 Installation

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/balagtas_permits
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:3000
```

**Frontend** — create `frontend/.env`:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> 📝 **Google Maps API Key**: Get one from [Google Cloud Console](https://console.cloud.google.com). Enable the **Maps JavaScript API**. Without this, a manual lat/lng input will be shown instead.

### 3. Seed Admin Account

Start the backend, then run:
```bash
curl -X POST http://localhost:5000/api/admin/seed
```

Or visit: `http://localhost:5000/api/admin/seed` (POST)

**Admin credentials:**
- Email: `admin@balagtas.gov.ph`
- Password: `admin123456`

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev   # or: npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

Visit: **http://localhost:3000**

---

## 🔑 Features

### User Portal
- ✅ **Registration & Login** — Full name, address, contact, email, password
- ✅ **7 Permit Types** — Building, Electrical, CFEI, Mechanical, Sanitary, Fencing, Demolition
- ✅ **6-Step Application Form** — Type selection, applicant info, property details, construction details, file upload, review
- ✅ **Google Maps Integration** — Pin exact property location (default view: Balagtas, Bulacan)
- ✅ **File Upload** — Plans, documents (PDF, images, DWG)
- ✅ **Transaction Tracking** — Real-time status with numbered transactions
- ✅ **Status Timeline** — Full history of status changes
- ✅ **PDF Download** — Pre-filled permit application form in PDF
- ✅ **Messaging** — Direct communication with Engineering Office

### Admin Portal
- ✅ **Dashboard** — Statistics: total, pending, approved, revenue
- ✅ **Application Management** — Filter, search, process all applications
- ✅ **Status Workflow** — pending → under_review → for_payment → approved → released
- ✅ **Fee Assessment** — Set assessed fees, record OR numbers
- ✅ **PDF Generation** — Print official permit forms
- ✅ **Messaging** — Reply to applicants per application
- ✅ **Admin Inbox** — Centralized message management

---

## 🗃️ Transaction Number Format

| Permit Type | Prefix | Example |
|---|---|---|
| Building Permit | BP | BP-000001 |
| Electrical Permit | EP | EP-000001 |
| CFEI | CFEI | CFEI-000001 |
| Mechanical Permit | MP | MP-000001 |
| Sanitary Permit | SP | SP-000001 |
| Fencing Permit | FP | FP-000001 |
| Demolition Permit | DP | DP-000001 |

---

## 📋 Permit Requirements (per NBC PD 1096 & LGU guidelines)

### Building Permit
- Accomplished application form
- Certified TCT/OCT, Tax Declaration, Tax Clearance
- Architectural, Structural, Electrical, Sanitary Plans (5 sets each)
- Bill of Materials, Specifications
- Barangay Clearance

### Electrical Permit
- Accomplished form, land documents
- Electrical Plans, Single Line Diagram
- PRC ID & PTR of Electrical Engineer

### CFEI (Certificate of Final Electrical Inspection)
- Letter of request, As-built plans
- Previous permits and PRC documents

---

## 🏛️ Office Information

**Municipality of Balagtas — Engineering Office**  
Municipal Hall, Balagtas, Bulacan 3016  
Province of Bulacan, Philippines  
GPS: 14.8140° N, 120.9065° E

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer |
| Maps | @react-google-maps/api |
| PDF | jsPDF + jspdf-autotable |
| Notifications | react-toastify |

---

## 📁 Project Structure

```
balagtas-permits/
├── backend/
│   ├── models/         # User, Permit, Message, Counter
│   ├── routes/         # auth, permits, messages, admin
│   ├── middleware/     # JWT auth, admin check
│   ├── uploads/        # Uploaded files (gitignored)
│   └── server.js
└── frontend/
    └── src/
        ├── pages/      # All page components
        ├── components/ # Sidebar, MapPicker
        ├── context/    # AuthContext
        └── utils/      # PDF generator
```
