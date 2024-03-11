from covfee.cli.commands.launch import make
import os
from pathlib import Path

os.chdir(Path(__file__).parent)


def create_app(no_launch: bool = True, dev: bool = True):
    if dev:
        # Dev mode
        return make.callback(
            force=True,
            dev=True,
            deploy=False,
            safe=False,
            rms=False,
            no_launch=no_launch,
            project_spec_file="continous_annotation.py",
        )
    else:
        # Deploy mode
        return make.callback(
            force=False,
            dev=False,
            deploy=True,
            safe=True,
            rms=False,
            no_launch=no_launch,
            project_spec_file="continous_annotation.py",
        )


if __name__ == "__main__":
    # When running without gunicorn, we need to launch the app with the socketio
    create_app(no_launch=False)

# To deploy with gunicorn, run the following command
# gunicorn --worker-class eventlet -w 1 'wsgi:create_app()' --bind 0.0.0.0:5000

# This comes from the flask-socketio documentation:
# https://flask-socketio.readthedocs.io/en/latest/deployment.html#gunicorn-web-server
