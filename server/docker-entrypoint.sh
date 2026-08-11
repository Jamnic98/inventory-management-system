#!/bin/sh
set -e

echo "🚀 Applying database migrations..."
npx prisma migrate deploy

echo "🌱 Running database seed..."
npx prisma db seed

echo "⚡ Starting node server..."
exec "$@"
