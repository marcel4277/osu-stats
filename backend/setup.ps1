#!/usr/bin/env powershell
# Quick Setup Script for osu! Gameplay Analyzer Backend
# Copy-paste this into PowerShell to set up everything quickly

Write-Host "================================" -ForegroundColor Cyan
Write-Host "osu! Analyzer Backend Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend folder
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found" -ForegroundColor Red
    Write-Host "Please run this from the 'backend' folder" -ForegroundColor Yellow
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 TODO: Edit .env and add your osu! API credentials:" -ForegroundColor Yellow
    Write-Host "   - OSU_API_ID: Get from https://osu.ppy.sh/home/account/edit" -ForegroundColor Yellow
    Write-Host "   - OSU_API_SECRET: Get from https://osu.ppy.sh/home/account/edit" -ForegroundColor Yellow
    Write-Host ""
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host ""
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your osu! API credentials" -ForegroundColor Cyan
Write-Host "2. Run: npm run dev" -ForegroundColor Cyan
Write-Host "3. Test: curl http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
