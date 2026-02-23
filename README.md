# Welcome to My Backend Dropbox
***

## Task

Build a serverless Dropbox-like file hosting service using AWS Amplify, Lambda, and S3. The challenge is implementing file synchronization, user authentication, file versioning, and DNS/routing — all hosted in the cloud with zero server management.

## Description

We solved this by building a **serverless architecture** using AWS services:

- **Authentication**: AWS Cognito handles user sign-up, sign-in, and email verification
- **File Storage**: AWS S3 stores all uploaded files with automatic versioning enabled
- **Backend Logic**: AWS Lambda functions handle file version listing, downloading specific versions, and file deletion
- **API Layer**: API Gateway provides REST endpoints for the Lambda functions
- **Hosting & DNS**: AWS Amplify Hosting serves the React frontend with HTTPS and a public URL
- **Frontend**: React (Vite) with drag-and-drop file upload, file management table, and version history modal

**No traditional database is needed** — S3 acts as our file storage "database" and Cognito manages all user data.

### 🌐 Deployed URL

**https://dev.d3icc253xyhyba.amplifyapp.com**

### 📂 GitHub Repository

**https://github.com/Cavid0/cloudstroge**

### Architecture

```
React App (Vite) → AWS Amplify Hosting
       │
       ├── Cognito (Auth: sign up/in/out)
       ├── S3 Bucket (File storage + versioning)
       └── API Gateway → Lambda (File operations)
```

## Installation

```bash
# Clone the repository
git clone git@git.us.qwasar.io:my_backend_dropbox_205881__jx5nx/my_backend_dropbox.git
cd my_backend_dropbox

# Install dependencies
npm install

# Start development server
npm run dev
```

### AWS Deployment (requires AWS account + Amplify CLI)

```bash
# Initialize Amplify
amplify init

# Add services
amplify add auth       # Cognito authentication
amplify add storage    # S3 file storage
amplify add api        # REST API + Lambda
amplify add hosting    # Amplify Hosting

# Deploy backend
amplify push --yes

# Deploy frontend
amplify publish
```

## Usage

1. Open the deployed URL in your browser
2. **Sign Up** with your email and create a password
3. Check your email for the **confirmation code** and enter it
4. **Upload files** by dragging them into the dropzone or clicking to browse
5. **View your files** in the file table below
6. **Download** any file by clicking the download button
7. **View version history** by clicking the clock icon
8. **Delete** files with the trash icon
9. **Sign Out** from the navbar

```
https://dev.d3icc253xyhyba.amplifyapp.com
```

### The Core Team

- **Cavid Shukurov**
- **Pinar Mecidova**

<span><i>Made at <a href='https://qwasar.io'>Qwasar SV -- Software Engineering School</a></i></span>
<span><img alt='Qwasar SV -- Software Engineering School's Logo' src='https://storage.googleapis.com/qwasar-public/qwasar-logo_50x50.png' width='20px' /></span>
