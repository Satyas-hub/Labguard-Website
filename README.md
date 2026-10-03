# LABGUARD – System Protection | Official Website & Download Portal

A complete, production-ready website and release management portal for **LABGUARD – System Protection** (Windows application), built with HTML5, CSS3, Vanilla JavaScript, and Firebase backend services.

---

## 🚀 Features

### Public Portal
- **Home Page**: Premium hero section, branding, latest release dynamic card, and 4 core feature cards (Protect Systems, Manage Users, Monitor Activity, Ensure Safety).
- **Downloads Page**: Lists all published Windows releases (`.exe`, `.zip`), file size, compatibility, and direct download buttons.
- **Release Notes Page**: Professional timeline detailing version changelogs and release notes dynamically loaded from Firebase.
- **About Page**: Information about enterprise computer laboratory protection and zero-trust security.
- **Download Tracking**: Automatically records download statistics in Firestore whenever a user downloads a build.

### Admin Portal (`/admin-login.html` & `/admin-dashboard.html`)
- **Secure Authentication**: Firebase Email/Password authentication for admin users.
- **Release Management**: Create, edit, publish, unpublish, and delete releases.
- **Single Latest Enforcement**: Automatically ensures only one release is marked as `isLatest = true`.
- **File Uploads (.EXE / .ZIP)**: Validates file formats, uploads release binaries to Firebase Storage (`/releases/`), displays upload progress, and saves metadata to Firestore (`app_versions`).
- **Download Analytics**: View total downloads and breakdown of downloads by version.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Responsive, Modern Cybersecurity Enterprise Theme, Glassmorphism).
- **Backend**: Firebase (Authentication, Cloud Firestore, Firebase Storage, Firebase Hosting).

---

## 📋 Folder Structure

```
LABGUARD-WEBSITE/
├── index.html
├── downloads.html
├── release-notes.html
├── about.html
├── admin-login.html
├── admin-dashboard.html
├── firebase.json
├── firestore.rules
├── storage.rules
│
├── css/
│   ├── style.css
│   ├── responsive.css
│   └── admin.css
│
├── js/
│   ├── firebase-config.js
│   ├── firebase-auth.js
│   ├── releases.js
│   ├── downloads.js
│   ├── admin.js
│   └── ui.js
│
├── assets/
│   └── labguard-logo.png
│
└── README.md
```

---

## ⚙️ Firebase Setup Instructions

Follow these step-by-step instructions to configure and deploy your Firebase backend:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the wizard to create your project.

### Step 2: Enable Firebase Authentication
1. In the Firebase Console, navigate to **Build** > **Authentication**.
2. Click **Get started**.
3. Under **Sign-in method**, select **Email/Password**, enable it, and click **Save**.
4. Go to the **Users** tab and click **Add user** to create your admin account (e.g., `admin@labguard.com` with a secure password).

### Step 3: Enable Cloud Firestore
1. Navigate to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a location and start in **Production mode** (security rules are already provided in `firestore.rules`).

### Step 4: Enable Firebase Storage
1. Navigate to **Build** > **Storage**.
2. Click **Get started**, choose your storage location, and set default security rules (security rules are provided in `storage.rules`).

### Step 5: Add Your Firebase Configuration
1. In Firebase Project Settings, register a new **Web App** (`</>`).
2. Copy your Firebase configuration object.
3. Open [js/firebase-config.js](file:///C:/Users/Sakshit%20Sai/Desktop/Labguard%20Website/js/firebase-config.js) and replace the placeholder values with your real credentials:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyYourActualApiKey...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

### Step 6: Configure Security Rules
- **Firestore Rules**: Ensure `firestore.rules` is deployed or pasted into the Firestore Rules tab in your Firebase Console.
- **Storage Rules**: Ensure `storage.rules` is deployed or pasted into the Storage Rules tab in your Firebase Console.

---

## 🚀 Running Locally & Deploying

### Running Locally
Because this project uses ES6 Modules (`import`/`export`), you should serve it via a local web server (such as VS Code Live Server, Python HTTP server, or Firebase Emulator) rather than opening files directly via `file://`.

Using Python:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### Deploying using Firebase Hosting
1. Install Firebase CLI (if not already installed):
```bash
npm install -g firebase-tools
```
2. Login to Firebase:
```bash
firebase login
```
3. Initialize / Connect your project (if needed):
```bash
firebase use --add
```
4. Deploy to Firebase Hosting, Firestore Rules, and Storage Rules:
```bash
firebase deploy
```
"# Labguard-Website" 
