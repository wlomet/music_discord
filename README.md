# 🎵 Music Discord Bot

Un bot Discord complet pour contrôler la musique dans vos serveurs, avec un dashboard web intuitif pour gérer votre expérience musicale.

## 📋 À Propos

**Music Discord Bot** est une application full-stack qui permet aux utilisateurs de :
- Écouter de la musique depuis YouTube dans les canaux vocaux Discord
- Contrôler la lecture (play, pause, skip, stop, volume)
- Gérer les files d'attente musicales
- Visualiser l'historique et les statistiques via un dashboard web
- Afficher les logs en temps réel de l'activité du bot

## 🛠️ Technologies

### Backend
- **Python 3.x** - Langage principal
- **discord.py** - Bibliothèque Discord officielle avec support voice
- **FastAPI** - Framework web moderne pour l'API REST
- **Uvicorn** - Serveur ASGI performant
- **yt-dlp** - Téléchargement et streaming YouTube
- **FFmpeg** - Traitement audio (dépendance système requise)
- **Pydantic** - Validation de données
- **Python-dotenv** - Gestion des variables d'environnement

### Frontend
- **React 18** - Bibliothèque UI avec TypeScript
- **Vite** - Build tool ultra-rapide
- **TypeScript** - Typage statique JavaScript
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Composants UI primitifs et accessibles
- **TanStack Query (React Query)** - Gestion du cache et des données
- **Shadcn/ui** - Composants pré-stylisés

### Infrastructure
- **Nginx** - Reverse proxy et serveur web
- **Systemd** - Gestion des services Linux
- **Gunicorn** - Serveur WSGI Python (production)

## 📦 Installation

### Prérequis
- Python 3.9+
- Node.js 16+
- FFmpeg installé sur le système
  - **Ubuntu/Debian** : `sudo apt install ffmpeg`
  - **macOS** : `brew install ffmpeg`
  - **Windows** : [Télécharger ici](https://ffmpeg.org/download.html)

### Configuration

1. **Clone le repository**
```bash
git clone <repository-url>
cd music_discord
```

2. **Configure les variables d'environnement**
```bash
cp .env.example .env
# Édite .env avec tes credentials Discord et tokens
```

3. **Installe les dépendances Python**
```bash
cd bot
python -m venv venv
# Activation du venv:
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
```

4. **Installe les dépendances Node.js**
```bash
cd ..
npm install
```

## 🚀 Démarrage

### Mode Développement
```bash
npm run dev  # Dashboard frontend
cd bot && python main.py  # Bot + API backend
```

Ou utilise la tâche VS Code pour tout lancer:
- `🚀 Launch Everything` - Lance bot et dashboard ensemble

### Mode Production
Voir [DEPLOYMENT.md](deploy/DEPLOYMENT.md) pour les instructions de déploiement en production.

## 📁 Structure du Projet

```
├── bot/                    # Backend Python
│   ├── main.py            # Point d'entrée principal
│   ├── bot.py             # Logique du bot Discord
│   ├── api.py             # API REST FastAPI
│   ├── requirements.txt    # Dépendances Python
│   └── Instruction/       # Documentation setup
├── src/                   # Frontend React
│   ├── components/        # Composants React
│   ├── lib/              # Utilitaires et types
│   ├── hooks/            # Custom React hooks
│   └── App.tsx           # Composant racine
├── deploy/               # Configuration déploiement
│   ├── nginx/            # Configuration Nginx
│   ├── systemd/          # Services systemd
│   └── scripts/          # Scripts de déploiement
└── package.json          # Configuration npm
```

## 📚 Documentation

- [Quick Setup Guide](bot/Instruction/QUICK_SETUP.md) - Mise en place rapide
- [Architecture](deploy/ARCHITECTURE.md) - Architecture système
- [Deployment Guide](deploy/DEPLOYMENT.md) - Guide de déploiement
- [Security](SECURITY.md) - Politique de sécurité

## 🔧 Commandes Disponibles

### npm
- `npm run dev` - Démarre le serveur de développement Vite
- `npm run build` - Build pour la production
- `npm run lint` - Lint avec ESLint
- `npm run preview` - Prévisualise la version buildée

### Python
```bash
python main.py              # Démarre bot + API
ENVIRONMENT=production python main.py  # Mode production
```

## 📊 Gestion des Services (Linux)

```bash
# Démarrer les services
sudo systemctl start music-discord-bot.service
sudo systemctl start music-discord-dashboard.service

# Arrêter les services
sudo systemctl stop music-discord-bot.service
sudo systemctl stop music-discord-dashboard.service

# Statut des services
sudo systemctl status music-discord-bot.service
sudo systemctl status music-discord-dashboard.service
```

## 🐛 Troubleshooting

### FFmpeg non trouvé
Vérifie que FFmpeg est installé et dans le PATH système

### Erreur de connexion Discord
Vérifiez votre token Discord dans le fichier `.env`

### Port déjà utilisé
Modifiez les ports dans la configuration appropriée

## 📄 License

[Consulter le fichier LICENSE](LICENSE)

## 🤝 Contribution

Les contributions sont bienvenues ! Veuillez consulter [SECURITY.md](SECURITY.md) avant de soumettre des pull requests.
