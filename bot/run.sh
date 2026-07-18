#!/bin/bash
# Script bash pour lancer le bot avec l'environnement approprié
# Usage: ./run.sh development  ou ./run.sh production

ENVIRONMENT=${1:-development}

if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    echo "Usage: ./run.sh [development|production]"
    exit 1
fi

echo "🤖 Démarrage du bot Music Discord en mode: $ENVIRONMENT"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found! Run: python -m venv venv"
    exit 1
fi

# Activate venv
source venv/bin/activate

# Check if required .env file exists
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Configuration file not found: $ENV_FILE"
    echo "Veuillez créer le fichier: $ENV_FILE"
    echo "Voir .env.example pour les variables requises"
    exit 1
fi

echo "✅ Utilisation de: $ENV_FILE"

# Run the bot
ENVIRONMENT=$ENVIRONMENT python main.py

deactivate
