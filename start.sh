#!/bin/bash

# Claimd - Complete Application Startup Script
# This script starts all services: backends, frontends, and AI worker

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# PID file to track background processes
PID_FILE="$PROJECT_ROOT/.start_pids"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down all services...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if ps -p "$pid" > /dev/null 2>&1; then
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
}

check_command node
check_command npm
check_command python3

echo -e "${GREEN}✓ All prerequisites met${NC}\n"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name is ready${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    echo -e "${RED}✗ $service_name failed to start${NC}"
    return 1
}

# Check if dependencies need to be installed
install_deps() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ] && [ -f "$dir/package.json" ]; then
        echo -e "${YELLOW}Installing dependencies for $name...${NC}"
        cd "$dir"
        npm install
        cd "$PROJECT_ROOT"
        echo -e "${GREEN}✓ Dependencies installed for $name${NC}"
    fi
}

# Install Python dependencies for AI service
install_python_deps() {
    local dir="$PROJECT_ROOT/ai-app-processing-service"
    if [ ! -d "$dir/venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        cd "$dir"
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        cd "$PROJECT_ROOT"
        echo -e "${GREEN}✓ Python dependencies installed${NC}"
    fi
}

# Install dependencies
echo -e "\n${BLUE}Checking dependencies...${NC}"
install_deps "$PROJECT_ROOT/applicant/backend" "Applicant Backend"
install_deps "$PROJECT_ROOT/applicant/frontend" "Applicant Frontend"
install_deps "$PROJECT_ROOT/caseworker/backend" "Caseworker Backend"
install_deps "$PROJECT_ROOT/caseworker/frontend" "Caseworker Frontend"
install_deps "$PROJECT_ROOT/landing-page" "Landing Page"
install_python_deps

# Clear PID file
> "$PID_FILE"

# Start services in background
echo -e "\n${BLUE}Starting services...${NC}\n"

# 1. Applicant Backend (Port 3001)
echo -e "${BLUE}Starting Applicant Backend (port 3001)...${NC}"
cd "$PROJECT_ROOT/applicant/backend"
if check_port 3001; then
    echo -e "${YELLOW}Port 3001 is already in use${NC}"
else
    npm start > /tmp/applicant-backend.log 2>&1 &
    echo $! >> "$PID_FILE"
    echo -e "${GREEN}✓ Applicant Backend started (PID: $!)${NC}"
fi
cd "$PROJECT_ROOT"

# 2. Applicant Frontend (Port 5173)
echo -e "${BLUE}Starting Applicant Frontend (port 5173)...${NC}"
cd "$PROJECT_ROOT/applicant/frontend"
if check_port 5173; then
    echo -e "${YELLOW}Port 5173 is already in use${NC}"
else
    npm run dev > /tmp/applicant-frontend.log 2>&1 &
    echo $! >> "$PID_FILE"
    echo -e "${GREEN}✓ Applicant Frontend started (PID: $!)${NC}"
fi
cd "$PROJECT_ROOT"

# 3. Caseworker Backend (Port 3002)
echo -e "${BLUE}Starting Caseworker Backend (port 3002)...${NC}"
cd "$PROJECT_ROOT/caseworker/backend"
if check_port 3002; then
    echo -e "${YELLOW}Port 3002 is already in use${NC}"
else
    npm start > /tmp/caseworker-backend.log 2>&1 &
    echo $! >> "$PID_FILE"
    echo -e "${GREEN}✓ Caseworker Backend started (PID: $!)${NC}"
fi
cd "$PROJECT_ROOT"

# 4. Caseworker Frontend (Port 5191)
echo -e "${BLUE}Starting Caseworker Frontend (port 5191)...${NC}"
cd "$PROJECT_ROOT/caseworker/frontend"
if check_port 5191; then
    echo -e "${YELLOW}Port 5191 is already in use${NC}"
else
    npm run dev > /tmp/caseworker-frontend.log 2>&1 &
    echo $! >> "$PID_FILE"
    echo -e "${GREEN}✓ Caseworker Frontend started (PID: $!)${NC}"
fi
cd "$PROJECT_ROOT"

# 5. Landing Page (Port 5190)
echo -e "${BLUE}Starting Landing Page (port 5190)...${NC}"
cd "$PROJECT_ROOT/landing-page"
if check_port 5190; then
    echo -e "${YELLOW}Port 5190 is already in use${NC}"
else
    npm run dev > /tmp/landing-page.log 2>&1 &
    echo $! >> "$PID_FILE"
    echo -e "${GREEN}✓ Landing Page started (PID: $!)${NC}"
fi
cd "$PROJECT_ROOT"

# 6. AI Processing Service
echo -e "${BLUE}Starting AI Processing Service...${NC}"
cd "$PROJECT_ROOT/ai-app-processing-service"
if [ -d "venv" ]; then
    source venv/bin/activate
    python worker.py > /tmp/ai-worker.log 2>&1 &
    echo $! >> "$PID_FILE"
    echo -e "${GREEN}✓ AI Processing Service started (PID: $!)${NC}"
else
    echo -e "${RED}✗ Python virtual environment not found. Run the script again to create it.${NC}"
fi
cd "$PROJECT_ROOT"

# Wait for services to be ready
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Display status
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}           All services are starting up!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${BLUE}Service URLs:${NC}"
echo -e "  ${GREEN}Applicant Frontend:${NC}  http://localhost:5173"
echo -e "  ${GREEN}Applicant Backend:${NC}   http://localhost:3001"
echo -e "  ${GREEN}Caseworker Frontend:${NC} http://localhost:5191"
echo -e "  ${GREEN}Caseworker Backend:${NC}  http://localhost:3002"
echo -e "  ${GREEN}Landing Page:${NC}        http://localhost:5190"
echo -e "  ${GREEN}AI Worker:${NC}           Running in background\n"

echo -e "${YELLOW}Log files:${NC}"
echo -e "  Applicant Backend:   /tmp/applicant-backend.log"
echo -e "  Applicant Frontend:  /tmp/applicant-frontend.log"
echo -e "  Caseworker Backend:  /tmp/caseworker-backend.log"
echo -e "  Caseworker Frontend: /tmp/caseworker-frontend.log"
echo -e "  Landing Page:        /tmp/landing-page.log"
echo -e "  AI Worker:           /tmp/ai-worker.log\n"

echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Keep script running and monitor processes
while true; do
    sleep 5
    # Check if any process died
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if ! ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${RED}Warning: Process $pid has stopped${NC}"
            fi
        done < "$PID_FILE"
    fi
done

