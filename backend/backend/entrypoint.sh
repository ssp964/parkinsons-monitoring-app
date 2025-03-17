#!/bin/bash
set -e

host="$POSTGRES_HOST"
port="$POSTGRES_PORT"
user="$POSTGRES_USER"

export PGPASSWORD="$POSTGRES_PASSWORD"

# Wait for PostgreSQL to be ready
until pg_isready -h "$host" -p "$port" -U "$user"; do
  echo "Waiting for PostgreSQL at $host:$port..."
  sleep 2
done

echo "PostgreSQL is ready!"
exec "$@"