#!/bin/bash

# GitHub Repository Setup Script
# Run this script after creating your GitHub repository

echo "🐙 AI Chat App - GitHub Setup"
echo "=================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ This is not a Git repository. Please run this script from the project root."
    exit 1
fi

# Get GitHub repository URL from user
echo "📝 Please provide your GitHub repository details:"
echo ""
read -p "GitHub Username: " github_username
read -p "Repository Name: " repo_name

if [ -z "$github_username" ] || [ -z "$repo_name" ]; then
    echo "❌ Username and repository name are required."
    exit 1
fi

# Construct GitHub URL
github_url="https://github.com/${github_username}/${repo_name}.git"

echo ""
echo "🔗 Repository URL: $github_url"
echo ""

# Check if remote already exists
if git remote get-url origin &> /dev/null; then
    echo "📡 Remote 'origin' already exists. Updating..."
    git remote set-url origin "$github_url"
else
    echo "📡 Adding remote 'origin'..."
    git remote add origin "$github_url"
fi

# Rename branch to main (if needed)
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "🔄 Renaming branch to 'main'..."
    git branch -M main
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
if git push -u origin main; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Your repository is now available at: https://github.com/${github_username}/${repo_name}"
    echo ""
    echo "🔥 Next steps:"
    echo "1. Go to https://vercel.com and import your repository"
    echo "2. Set the root directory to 'backend'"
    echo "3. Add the environment variables from DEPLOYMENT.md"
    echo "4. Deploy and get your production URL"
    echo "5. Update mobile/src/services/api.ts with the production URL"
    echo ""
else
    echo "❌ Failed to push to GitHub. Please check:"
    echo "1. Repository exists and you have write access"
    echo "2. You're authenticated with GitHub"
    echo "3. Repository URL is correct"
    echo ""
    echo "Manual setup:"
    echo "git remote add origin $github_url"
    echo "git branch -M main"
    echo "git push -u origin main"
fi