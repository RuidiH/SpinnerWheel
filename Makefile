# Makefile for SpinnerWheel development

.PHONY: dev dev-frontend dev-backend build production install help

# Default target
help:
	@echo "SpinnerWheel Development Commands:"
	@echo "  make dev              - Start development servers (frontend + backend)"
	@echo "  make dev-frontend     - Start only React dev server (port 3000)"
	@echo "  make dev-backend      - Start only Go backend (port 8080)"
	@echo "  make build            - Build frontend for production"
	@echo "  make production       - Build and start production server"
	@echo "  make install          - Install all dependencies"
	@echo "  make clean            - Clean build files"
	@echo ""
	@echo "⚠️  IMPORTANT: For development, access http://localhost:3000 (not 8080)"

# Development mode - start both servers
dev:
	@echo "Starting development servers..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8080"
	npm run dev

# Start only React development server  
dev-frontend:
	@echo "Starting React dev server on port 3000..."
	cd frontend && npm start

# Start only Go backend server
dev-backend:
	@echo "Starting Go backend server on port 8080..."
	go run main.go

# Install all dependencies
install:
	@echo "Installing backend dependencies..."
	go mod tidy
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing root development dependencies..."
	npm install

# Build frontend for production
build:
	@echo "Building frontend for production..."
	cd frontend && npm run build
	@echo "Copying build files to static directory..."
	cp -r frontend/build/* static/

# Build and start production server
production: build
	@echo "Starting production server on port 8080..."
	@echo "Access: http://localhost:8080"
	go run main.go

# Clean build files
clean:
	@echo "Cleaning build files..."
	if exist frontend\build rmdir /S /Q frontend\build
	if exist static rmdir /S /Q static
	if exist spinner-wheel.exe del spinner-wheel.exe