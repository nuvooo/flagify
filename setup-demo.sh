#!/bin/bash

# Togglely Demo Setup Script

echo "🚀 Togglely Demo Setup"
echo "======================"
echo ""

# Wait for services
echo "⏳ Waiting for services..."
sleep 5

# Reset demo data
echo "🔄 Resetting demo data..."
curl -s -X POST http://localhost:4000/api/setup/reset-demo

if [ $? -eq 0 ]; then
    echo "✅ Demo data reset successfully!"
else
    echo "⚠️  Could not reset demo data (might already exist)"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Demo Credentials:"
echo "   Email: demo@togglely.io"
echo "   Password: demo123!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:4000/api"
echo ""
