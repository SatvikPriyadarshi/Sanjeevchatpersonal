#!/bin/bash

echo "🚀 Preparing Chat App for Production Deployment"

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Test backend
echo "🔧 Testing backend..."
cd backend
npm install
echo "✅ Backend dependencies installed"
cd ..

echo "🎉 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Go to render.com and create two web services"
echo "3. Deploy backend first, then frontend"
echo "4. Update environment variables with actual URLs"
echo ""
echo "📖 See deployment-guide.md for detailed instructions"