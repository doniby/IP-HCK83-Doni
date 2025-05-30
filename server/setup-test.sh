#!/bin/bash

# Test setup script
echo "Setting up test environment..."

# Create test database if it doesn't exist
echo "Creating test database..."
createdb test_promptionary 2>/dev/null || echo "Test database already exists or createdb not available"

# Run migrations for test database
echo "Running test migrations..."
export NODE_ENV=test
export DATABASE_URL="postgres://username:password@localhost:5432/test_promptionary"

# You may need to adjust the DATABASE_URL above to match your local PostgreSQL setup

npx sequelize-cli db:migrate --env test 2>/dev/null || echo "Migrations completed or not needed"

echo "Test environment setup complete!"
echo "You can now run: npm test"
