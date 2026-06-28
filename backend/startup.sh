#!/bin/bash
# Azure App Service (Linux, Python) startup command.
# Azure injects the port to listen on via $PORT (defaults to 8000 for the
# Python stack). Bind to 0.0.0.0 so the platform's front end can reach us.
# Set this file as the App Service "Startup Command":  bash startup.sh
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
