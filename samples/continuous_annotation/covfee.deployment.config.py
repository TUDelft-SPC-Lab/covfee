BASE_URL = "https://covfee.ewi.tudelft.nl/covfee"

COVFEE_SECRET_KEY = "MY_SECRET"
ADMIN_USERNAME = "admin2"
ADMIN_PASSWORD = "admin2"

# Deploy without socket
# gunicorn --worker-class eventlet -w 4 'covfee.server.app:create_app()' --bind 0.0.0.0:5002

# Deploy with socket
# gunicorn --worker-class eventlet -w 1 --bind unix:covfee.sock -m 007 'covfee.server.app:create_app()'