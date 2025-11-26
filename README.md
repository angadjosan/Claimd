# Claimd

**Accelerating Social Security Disability Insurance (SSDI) claim processing with AI-powered document analysis**

---

## Table of Contents

- [Overview](#overview)
  - [The Problem](#the-problem)
  - [Our Solution](#our-solution)
- [Features](#features)
  - [User Portal](#user-portal)
  - [Admin Dashboard](#admin-dashboard)
  - [AI Processing Engine](#ai-processing-engine)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
  - [Access Points](#access-points)
  - [Stopping the Servers](#stopping-the-servers)
- [Admin Access](#admin-access)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
  - [Current (MVP)](#current-mvp)
  - [Future Enhancements](#future-enhancements)
- [Impact](#impact)
- [Demo & Pitch](#demo--pitch)
- [Important Notes](#important-notes)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Overview

Claimd is an AI-powered platform that dramatically reduces SSDI application processing time from **7 months to 1-2 days**. By automating document review and validation, we help 940,000 Americans waiting for disability benefits get faster decisions while giving SSA officers powerful AI assistance to review claims **20x faster**.

### The Problem

- **940,000 Americans** are currently waiting for SSDI claim decisions
- **6-8 month average wait time** nationally due to SSA understaffing (25-year staffing low)
- SSA officers must manually review **34+ document fields** across multiple PDFs, taking **8-10 minutes per claim**
- Critical financial support is delayed for disabled individuals who can no longer work

### Our Solution

Instead of humans reading through dozens of documents and fields, Claimd provides:
- **AI-powered document extraction & validation** from medical records, financial documents, and personal information
- **Intelligent decision recommendations** (approve, reject, or further review) with confidence levels
- **30-second AI summaries** replacing 10-minute manual reviews
- **Human-in-the-loop verification** ensuring accuracy and accountability

---

## Features

### User Portal
- **Streamlined application flow** mirroring SSA's official process
- **Document upload system** for medical records, financial proof, and personal information
- **Application status tracking** with real-time updates
- **Clear next steps** for approved or rejected claims, including SSDI payment calculations

### Admin Dashboard
- **Application queue** with AI recommendation tags (approve/reject/further review)
- **Detailed AI analysis** for each claim including:
  - Decision recommendation with confidence level (color-coded: green/yellow/red)
  - AI-generated summary explaining the decision
  - SSDI payment calculation with adjustable amounts
  - Supporting document excerpts and validation
- **One-click approval/rejection** with automatic database updates

### AI Processing Engine
- **Structured output validation** with fact-checking against source documents
- **Multi-document analysis** extracting and cross-referencing information
- **Confidence scoring** (0-1 probability scale) for decision transparency
- **RAG-powered context** using ChromaDB for intelligent document retrieval

---

## Tech Stack

**Frontend:** React, Vite  
**Backend:** FastAPI, Python 3.x  
**AI/ML:** Claude API, ChromaDB (vector embeddings)  
**Storage:** S3 buckets, PostgreSQL/SQLite  
**Document Processing:** PDF extraction, structured data validation

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.x
- Node.js & npm
- pip (Python package manager)
- Claude API key (sign up at [Anthropic](https://console.anthropic.com/))

### Installation

Follow these steps to set up and run the application:

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd calhacksy1
```

#### 2. Backend Setup

Navigate to the backend directory and set up the Python environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

### Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
echo "CLAUDE_API_KEY=your_claude_api_key_here" > .env
```

Or manually create `backend/.env` with:
```
CLAUDE_API_KEY=your_claude_api_key_here
```

#### Frontend Environment Variables

No environment variables are required for the frontend in development mode. The frontend will automatically connect to the backend API running on `http://localhost:8000`.

### Running the Application

You need **TWO terminals** to run both backend and frontend simultaneously.

#### Terminal 1 - Backend Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

The backend will be available at: **`http://127.0.0.1:8000`**

#### Terminal 2 - Frontend Server

```bash
cd frontend
npm run dev
```

The frontend will be available at: **`http://localhost:5173`**

### Access Points

Once both servers are running, you can access:

- **User Portal:** `http://localhost:5173/user`
- **Admin Dashboard:** `http://localhost:5173/admin`
- **API Documentation:** `http://127.0.0.1:8000/docs` (interactive Swagger UI)
- **Alternative API Docs:** `http://127.0.0.1:8000/redoc`

### Stopping the Servers

- Press `Ctrl+C` in each terminal to stop the respective servers
- Make sure to stop both backend and frontend servers when done
- Deactivate the Python virtual environment: `deactivate`

---

**Important Notes:**
- File location: `.env.local` goes in the `frontend/` directory
- Variable name: Must start with `VITE_` to be accessible in the browser
- Restart required: Restart your dev server after creating the file
- Git ignore: `.env.local` should be in `.gitignore` (don't commit secrets)
---

## Impact

### For Applicants
- Reduce wait time from **7 months → 1-2 days**
- Clear, transparent decision-making process
- Faster access to critical financial support
- Better understanding of application status

### For SSA Officers
- **20x efficiency improvement** (10 minutes → 30 seconds per claim)
- AI-assisted decision-making with confidence scoring
- Focus on complex cases requiring human judgment
- Reduced administrative burden

### At Scale
- Help process backlog of **940,000 pending claims**
- Reduce burden on understaffed SSA offices
- Improve outcomes for disabled Americans in need
- Save taxpayer dollars through increased efficiency

---