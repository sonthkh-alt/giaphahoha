#!/bin/bash

echo "🏛️ Deploying Gia phả dòng họ Hà to GitHub Pages..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "Adding files..."
git add .

# Commit
echo "Committing changes..."
git commit -m "🏛️ Gia phả dòng họ Hà - 180 thành viên"

# Instructions for user
echo ""
echo "✅ Ready to deploy! Follow these steps:"
echo ""
echo "1. Create a new repository on GitHub (e.g., 'ha-giapha')"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/ha-giapha.git"
echo "3. Run: git push -u origin main"
echo "4. Go to GitHub → Settings → Pages → Deploy from branch 'main'"
echo "5. Your website will be available at: https://YOUR_USERNAME.github.io/ha-giapha/"
echo ""
echo "🌳 Website features:"
echo "   • 180+ family members"
echo "   • Interactive family tree"
echo "   • Search and filter"
echo "   • Mobile responsive"
echo "   • Traditional Vietnamese design"
echo "   • Root ancestors: Hà Ngọc Quán & Trịnh Thị Ngạc"