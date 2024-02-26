# How to deploy covfee using gunicorn and nginx.

- Install conda / venv or any other environment manager and create a new environment for covfee
- Install all the dependencies including gunicorn: `pip install gunicorn`
- Create a systemd service to start the app with several workers and fault tolerance at `/etc/systemd/system/covfee.service`

```
[Unit]
Description=Gunicorn instance to serve covfee
After=network.target

[Service]
User=<YOUR USER>
Group=www-data
WorkingDirectory=/home/<YOUR USER>/covfee
Environment="PATH=/home/<YOUR USER>/miniconda3/envs/covfee_env/bin"
ExecStart=/home/<YOUR USER>/miniconda3/envs/covfee_env/bin/gunicorn --workers 3 --bind unix:covfee.sock -m 007 launch:create_app()

[Install]
WantedBy=multi-user.target
```

- Start the service: `sudo systemctl start covfee`
- Install nginx: `sudo apt install nginx`
- Add a nginx config file for covfee in `/etc/nginx/sites-available/covfee`

```
server {
    listen 80;
    server_name your_domain www.your_domain;

	# Redirect all connections to the https version of the site
    return 301 https://your_domain$request_uri;
}

server{
    listen 443 ssl;
    ssl_certificate <your certificate>.pem;
    ssl_certificate_key <your key>.key;

    # Show the default nginx website at www.your_domain
    location / {
        root /var/www/html;
        index index.nginx-debian.html;
    }

    # Show the the app at www.your_domain/covfee
    location /covfee {
        rewrite ^/covfee/(.*)$ /$1 break; # Remove the /covfee from the URL before passing it to the proxy_pass below
        include proxy_params; # Add the proxy configuration from the proxy_params file from the parent folder
        proxy_pass http://unix:/home/<YOUR USER>/covfee/covfee.sock; # Connect to the socket that was created by gunicorn
    }
}
```

- Activate the website `sudo ln -s /etc/nginx/sites-available/covfee /etc/nginx/sites-enabled`
- Reload nginx: `sudo systemctl restart nginx`
- Check that everything works at `your_domain/covfee`

More information can be found in [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-ubuntu-18-04).
