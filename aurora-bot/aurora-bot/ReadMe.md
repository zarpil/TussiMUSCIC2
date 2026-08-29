# Aurora Music Bot

Aurora is a feature-rich Discord music bot with a modern web dashboard, live synchronized lyrics, playlist support, and high-quality audio streaming powered by NodeLink.

## Features

* High-quality music playback
* Live synchronized lyrics
* Queue and playlist management
* Modern web dashboard
* Multi-server support
* Responsive dashboard UI
* Real-time playback controls
* Production-ready Docker deployment

## Requirements

Aurora requires the following external dependencies. Public links are included for marketplace review:

* Node.js 18+ - https://nodejs.org/
* MongoDB - https://www.mongodb.com/
* NodeLink Server - https://github.com/PerformanC/NodeLink
* Docker, recommended for production - https://www.docker.com/

### Node.js Package Dependencies

The project also uses Node.js packages installed from `package.json`, `package-lock.json`, `web-dashboard/package.json`, and `web-dashboard/package-lock.json`.

Bot package links:

* @discordjs/rest - https://www.npmjs.com/package/@discordjs/rest
* @discordjs/voice - https://www.npmjs.com/package/@discordjs/voice
* @distube/ytdl-core - https://www.npmjs.com/package/@distube/ytdl-core
* @napi-rs/canvas - https://www.npmjs.com/package/@napi-rs/canvas
* @top-gg/sdk - https://www.npmjs.com/package/@top-gg/sdk
* aurora-music-card - https://www.npmjs.com/package/aurora-music-card
* axios - https://www.npmjs.com/package/axios
* better-erela.js-spotify - https://www.npmjs.com/package/better-erela.js-spotify
* canvas - https://www.npmjs.com/package/canvas
* discord-api-types - https://www.npmjs.com/package/discord-api-types
* discord-hybrid-sharding - https://www.npmjs.com/package/discord-hybrid-sharding
* discord.js - https://www.npmjs.com/package/discord.js
* dotenv - https://www.npmjs.com/package/dotenv
* dynamic-music-card - https://www.npmjs.com/package/dynamic-music-card
* erela.js - https://github.com/Tomato6966/erela.js
* erela.js-spotify - https://www.npmjs.com/package/erela.js-spotify
* express - https://www.npmjs.com/package/express
* fluent-ffmpeg - https://www.npmjs.com/package/fluent-ffmpeg
* gif-frames - https://www.npmjs.com/package/gif-frames
* gifencoder - https://www.npmjs.com/package/gifencoder
* gifuct-js - https://www.npmjs.com/package/gifuct-js
* i - https://www.npmjs.com/package/i
* install - https://www.npmjs.com/package/install
* lyrics-finder - https://www.npmjs.com/package/lyrics-finder
* math - https://www.npmjs.com/package/math
* mongoose - https://www.npmjs.com/package/mongoose
* moonlink.js - https://github.com/Ecliptia/moonlink.js
* mysql2 - https://www.npmjs.com/package/mysql2
* node-fetch - https://www.npmjs.com/package/node-fetch
* npm - https://www.npmjs.com/package/npm
* react - https://www.npmjs.com/package/react
* socket.io - https://www.npmjs.com/package/socket.io
* stream-to-buffer - https://www.npmjs.com/package/stream-to-buffer
* topgg-autoposter - https://www.npmjs.com/package/topgg-autoposter
* uuid - https://www.npmjs.com/package/uuid
* video-to-gif - https://www.npmjs.com/package/video-to-gif
* yt-search - https://www.npmjs.com/package/yt-search

Dashboard package links:

* @discord/embedded-app-sdk - https://www.npmjs.com/package/@discord/embedded-app-sdk
* @dnd-kit/core - https://www.npmjs.com/package/@dnd-kit/core
* @dnd-kit/sortable - https://www.npmjs.com/package/@dnd-kit/sortable
* @dnd-kit/utilities - https://www.npmjs.com/package/@dnd-kit/utilities
* @hookform/resolvers - https://www.npmjs.com/package/@hookform/resolvers
* @radix-ui/react-accordion - https://www.npmjs.com/package/@radix-ui/react-accordion
* @radix-ui/react-alert-dialog - https://www.npmjs.com/package/@radix-ui/react-alert-dialog
* @radix-ui/react-aspect-ratio - https://www.npmjs.com/package/@radix-ui/react-aspect-ratio
* @radix-ui/react-avatar - https://www.npmjs.com/package/@radix-ui/react-avatar
* @radix-ui/react-checkbox - https://www.npmjs.com/package/@radix-ui/react-checkbox
* @radix-ui/react-collapsible - https://www.npmjs.com/package/@radix-ui/react-collapsible
* @radix-ui/react-context-menu - https://www.npmjs.com/package/@radix-ui/react-context-menu
* @radix-ui/react-dialog - https://www.npmjs.com/package/@radix-ui/react-dialog
* @radix-ui/react-dropdown-menu - https://www.npmjs.com/package/@radix-ui/react-dropdown-menu
* @radix-ui/react-hover-card - https://www.npmjs.com/package/@radix-ui/react-hover-card
* @radix-ui/react-label - https://www.npmjs.com/package/@radix-ui/react-label
* @radix-ui/react-menubar - https://www.npmjs.com/package/@radix-ui/react-menubar
* @radix-ui/react-navigation-menu - https://www.npmjs.com/package/@radix-ui/react-navigation-menu
* @radix-ui/react-popover - https://www.npmjs.com/package/@radix-ui/react-popover
* @radix-ui/react-progress - https://www.npmjs.com/package/@radix-ui/react-progress
* @radix-ui/react-radio-group - https://www.npmjs.com/package/@radix-ui/react-radio-group
* @radix-ui/react-scroll-area - https://www.npmjs.com/package/@radix-ui/react-scroll-area
* @radix-ui/react-select - https://www.npmjs.com/package/@radix-ui/react-select
* @radix-ui/react-separator - https://www.npmjs.com/package/@radix-ui/react-separator
* @radix-ui/react-slider - https://www.npmjs.com/package/@radix-ui/react-slider
* @radix-ui/react-slot - https://www.npmjs.com/package/@radix-ui/react-slot
* @radix-ui/react-switch - https://www.npmjs.com/package/@radix-ui/react-switch
* @radix-ui/react-tabs - https://www.npmjs.com/package/@radix-ui/react-tabs
* @radix-ui/react-toast - https://www.npmjs.com/package/@radix-ui/react-toast
* @radix-ui/react-toggle - https://www.npmjs.com/package/@radix-ui/react-toggle
* @radix-ui/react-toggle-group - https://www.npmjs.com/package/@radix-ui/react-toggle-group
* @radix-ui/react-tooltip - https://www.npmjs.com/package/@radix-ui/react-tooltip
* @react-three/fiber - https://www.npmjs.com/package/@react-three/fiber
* @tanstack/react-query - https://www.npmjs.com/package/@tanstack/react-query
* @types/three - https://www.npmjs.com/package/@types/three
* class-variance-authority - https://www.npmjs.com/package/class-variance-authority
* clsx - https://www.npmjs.com/package/clsx
* cmdk - https://www.npmjs.com/package/cmdk
* date-fns - https://www.npmjs.com/package/date-fns
* embla-carousel-react - https://www.npmjs.com/package/embla-carousel-react
* framer-motion - https://www.npmjs.com/package/framer-motion
* gsap - https://www.npmjs.com/package/gsap
* input-otp - https://www.npmjs.com/package/input-otp
* lucide-react - https://www.npmjs.com/package/lucide-react
* mongodb - https://www.npmjs.com/package/mongodb
* next - https://www.npmjs.com/package/next
* next-themes - https://www.npmjs.com/package/next-themes
* react - https://www.npmjs.com/package/react
* react-day-picker - https://www.npmjs.com/package/react-day-picker
* react-dom - https://www.npmjs.com/package/react-dom
* react-hook-form - https://www.npmjs.com/package/react-hook-form
* react-resizable-panels - https://www.npmjs.com/package/react-resizable-panels
* recharts - https://www.npmjs.com/package/recharts
* socket.io-client - https://www.npmjs.com/package/socket.io-client
* sonner - https://www.npmjs.com/package/sonner
* tailwind-merge - https://www.npmjs.com/package/tailwind-merge
* tailwindcss-animate - https://www.npmjs.com/package/tailwindcss-animate
* three - https://www.npmjs.com/package/three
* vaul - https://www.npmjs.com/package/vaul
* zod - https://www.npmjs.com/package/zod


## Setup

### 1. Configure Environment Variables

Edit the `.env` file in the project root and fill in all required values.   
Edit the `/emoji/emoji.js` file and paste the emoji markdown example `<:shuffle_aur:1468214974752096307>`
Run the `add-admin.js` file to set yourself as admin 

### 2. Configure Bot Settings

Edit the `config.json` file and configure your bot settings.

Aurora uses a NodeLink server for audio playback. Update the NodeLink connection details in `config.json`.

### 3. Install and Configure NodeLink

Use the latest NodeLink release:

https://github.com/PerformanC/NodeLink

Follow the official NodeLink installation guide and update the connection details inside `config.json`.

### IMPORTANT: off the DDOS protection and Request timeout in Nodelink Configuration to ensure smooth working of controls in web

## Production Deployment

Docker is recommended for production deployments.

Docker configuration files are included with the project.

### if you are using docker 

docker compose up --build


### for local development
node index.js

### Nginx Configuration

Production Nginx configurations can be found inside the:

```text
nginx conf/
```

directory.

Configure your domain and SSL certificates before deployment.

## Notes

### Windows Users

Some Windows systems may require additional Microsoft C++ Build Tools / Visual C++ Developer Packages for GIF encoding and media processing features to function correctly if you not using docker.

## Support

This project is provided as-is and can be customized or extended to fit your requirements.

##
