# Home Assistant Custom Card - Dev Container Setup

This directory contains the development container configuration for building and testing the boilerplate-card custom card for Home Assistant.

## Setup Instructions

### Option 1: Simple Dev Container (Recommended for Card Development Only)

This is the simplest setup if you just want to develop the custom card.

1. **Install Docker & VS Code Remote Containers**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [VS Code Extension: Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in Dev Container**
   - Open the project folder in VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Remote-Containers: Reopen in Container"
   - Wait for the container to build (first time takes ~2-3 minutes)

3. **Build the Card**
   ```bash
   npm run build      # Lint and build
   npm run dev        # Start dev server with hot reload (port 5000)
   npm run lint       # Check code quality
   npm run rollup     # Production build
   ```

4. **Access the Built Card**
   - Build output: `./dist/boilerplate-card.js`
   - Copy to Home Assistant: `config/www/boilerplate-card.js`

### Option 2: Full Stack with Home Assistant (Complete Testing)

Run this if you want to test the card in a real Home Assistant environment alongside your dev container.

1. **Start the Full Stack**
   ```bash
   docker-compose -f .devcontainer/docker-compose.yml up
   ```

2. **Access Services**
   - **Dev Container**: Terminal in VS Code (automatic)
   - **Home Assistant**: http://localhost:8123
   - **Rollup Dev Server**: http://localhost:5000

3. **Configure Home Assistant to Use Your Card**
   - In Home Assistant, go to Settings > Dashboards
   - Edit a dashboard in raw YAML mode
   - Add your custom card:
   ```yaml
   - type: custom:boilerplate-card
     name: "My Test Card"
   ```

4. **Hot Reload Development**
   - Run `npm start` in the dev container
   - Changes to source files automatically rebuild
   - Refresh Home Assistant UI to see updates

## File Structure

```
.devcontainer/
├── Dockerfile           # Docker image definition
├── devcontainer.json    # VS Code dev container config
├── docker-compose.yml   # Optional full-stack setup
├── .gitignore          # Ignore HA data
└── README.md           # This file
```

## Development Workflow

### Building the Card

```bash
# One-time setup (automatic on container creation)
npm install

# Development with hot reload
npm start              # Runs Rollup in watch mode on port 5000

# Quality checks
npm run lint           # ESLint check
npm run build          # Full build pipeline (lint + rollup)

# Production build
npm run rollup         # Create optimized dist files
```

### File Locations

- **Source Code**: `src/`
- **Built Output**: `dist/` (inside container)
- **Configuration**: Root directory (`tsconfig.json`, `rollup.config.js`, etc.)

## Using Your Custom Card in Home Assistant

### Quick Testing (with docker-compose)

The `docker-compose.yml` automatically mounts your built card:
- `../dist` → `/config/www/boilerplate-card`

In Home Assistant UI:
1. Go to Settings > Dashboards
2. Click "Create Dashboard"
3. Switch to raw YAML mode
4. Add:
```yaml
title: Test
views:
  - title: Cards
    cards:
      - type: custom:boilerplate-card
        name: "Test Card"
        entity: sensor.temperature
```

### Production Deployment

1. **Build the card** in the dev container:
   ```bash
   npm run build
   ```

2. **Copy the output**:
   ```bash
   cp dist/boilerplate-card.js /path/to/homeassistant/config/www/boilerplate-card.js
   ```

3. **Add to Home Assistant interface** or `configuration.yaml`:
   ```yaml
   lovelace:
     resources:
       - url: /local/boilerplate-card.js
         type: module
   ```

## Troubleshooting

### Container Won't Start
```bash
# Rebuild the container
ctrl+shift+p → "Remote: Rebuild Container"
```

### Port Already in Use
```bash
# Find what's using port 5000 or 8123
lsof -i :5000
lsof -i :8123

# Stop and remove containers
docker-compose -f .devcontainer/docker-compose.yml down
```

### Home Assistant Data Persists on Rebuild
The Home Assistant data is stored in a Docker volume called `homeassistant`. To reset:
```bash
docker volume rm homeassistant_homeassistant
```

### Node Modules Issues
```bash
# Clear and reinstall dependencies
rm -rf node_modules
npm install
```

## Additional Resources

- [Home Assistant Custom Card Development](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- [VS Code Dev Containers Docs](https://code.visualstudio.com/docs/remote/containers)
- [Lit Documentation](https://lit.dev/)
- [Material Design Web Components](https://github.com/material-components/material-web)

## Environment Details

- **Node.js**: 20 LTS
- **TypeScript**: 5.9.3
- **Build Tool**: Rollup 4.20
- **Linter**: ESLint 8.57 + TypeScript Support
- **Code Formatter**: Prettier 3.8
- **Web Framework**: Lit 3.2
- **Home Assistant Image**: Latest (optional)

## Notes

- The container runs as non-root user `nodejs` for security
- Volume mounts use `cached` consistency mode for better performance on Mac/Windows
- All npm commands run inside the container automatically
- VS Code extensions are configured for TypeScript and YAML development
