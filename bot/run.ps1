# Script PowerShell pour lancer le bot avec l'environnement approprié
# Usage: .\run.ps1 development  # ou .\run.ps1 production

param(
    [ValidateSet('development', 'production')]
    [string]$Environment = 'development'
)

# Set environment variable for this process
$env:ENVIRONMENT = $Environment

Write-Host "🤖 Démarrage du bot Music Discord en mode: $Environment" -ForegroundColor Green

# Check if venv exists
if (-Not (Test-Path ".\venv")) {
    Write-Host "⚠️  Virtual environment not found! Run: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Activate venv
& ".\venv\Scripts\Activate.ps1"

# Check if required .env file exists
$envFile = ".env.$Environment"
if (-Not (Test-Path $envFile)) {
    Write-Host "❌ Configuration file not found: $envFile" -ForegroundColor Red
    Write-Host "Veuillez créer le fichier: $envFile" -ForegroundColor Yellow
    Write-Host "Voir .env.example pour les variables requises" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Utilisation de: $envFile" -ForegroundColor Green

# Run the bot
python main.py

deactivate
