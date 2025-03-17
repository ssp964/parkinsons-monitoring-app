#!/bin/bash
set -e

host="$POSTGRES_HOST"
port="$POSTGRES_PORT"
user="$POSTGRES_USER"

export PGPASSWORD="$POSTGRES_PASSWORD"

# Test PostgreSQL connection
pg_isready -h "$host" -p "$port" -U "$user" || exit 1

# Test API health
curl -f http://localhost:8000/health || exit 1