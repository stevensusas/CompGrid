# Use a base image with Python
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Copy the pyproject.toml and poetry.lock files into the container
COPY pyproject.toml poetry.lock /app/

# Install Poetry
RUN pip install poetry

# Install project dependencies
RUN poetry install --no-root

# Copy the rest of the application code into the container
COPY . /app

# Expose the port that Flask will run on
EXPOSE 5000

# Define the environment variable for Flask to run
ENV FLASK_APP=cluster.py

# Run the Flask server
CMD ["poetry", "run", "flask", "run", "--host=0.0.0.0"]
