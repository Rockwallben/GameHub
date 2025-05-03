# Ragdoll Hit Game Site

A simple web application that embeds the popular Ragdoll Hit game for easy access.

## Features

- Embedded Ragdoll Hit game that can be played directly on the site
- Clean, responsive interface
- Game instructions
- High scores tracking

## Deployment Instructions for Render.com (Free Tier)

1. Sign up for a free account at [Render.com](https://render.com)
2. From your Render dashboard, click "New" and select "Blueprint" 
3. Connect your GitHub/GitLab account and select this repository
4. Render will automatically detect the `render.yaml` file and set up your service
5. Click "Apply" to begin the deployment process
6. Wait for the build and deployment to complete (this may take a few minutes)
7. Once deployed, you can access your site at the URL provided by Render

## Manual Deployment on Render

If the Blueprint option doesn't work:

1. From your Render dashboard, click "New" and select "Web Service"
2. Connect your repository
3. Use the following settings:
   - Name: ragdoll-hit-game (or any name you prefer)
   - Environment: Node
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. Select the Free plan
5. Click "Create Web Service"

## Development

To run this project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5000 in your browser to see the application.