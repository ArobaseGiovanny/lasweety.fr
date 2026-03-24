#!/bin/bash

set -e

echo "🚀 Déploiement lasweety.fr..."

# Pull
echo "📥 Git pull..."
git pull origin main

# Frontend
echo "🔨 Build frontend..."
cd frontend
npm install --silent
npm run build
cd ..

# Backend
echo "📦 Install backend..."
cd backend
npm install --silent
cd ..

# Restart
echo "♻️  Restart PM2..."
pm2 restart lasweety-api

echo "✅ Déployé avec succès !"
