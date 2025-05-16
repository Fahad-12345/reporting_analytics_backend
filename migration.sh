#!/bin/bash

# Navigate to the directory
cd src/database
# Run database migrations
db-migrate up --config config.js

