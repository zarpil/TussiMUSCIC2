
### 1. Configure the Web Dashboard

Navigate to the `web-dashboard` directory and edit the `local.env` file with your dashboard configuration.

## Production Deployment

Docker is recommended for production deployments.

Docker configuration files are included with the project.

### 3. Install and Configure NodeLink

Use the latest NodeLink release:

https://github.com/PerformanC/NodeLink

Follow the official NodeLink installation guide and update the connection details inside `config.json`.

### IMPORTANT: off the DDOS protection and Request timeout in Nodelink Configuration to ensure smooth working of controls in web

### Nginx Configuration

Production Nginx configurations can be found inside the:

```text
nginx conf/
```

directory.

Configure your domain and SSL certificates before deployment.


### Development Mode

Start the bot from the project root:

```bash
node index.js
```

Start the dashboard:

```bash
cd web-dashboard
npm run dev
```

### if you are using docker 

docker compose up --build