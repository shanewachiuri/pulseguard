# Use a lightweight Python base image
FROM python:3.12-slim

# Grab the ultra-fast uv package manager from their official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory inside the container
WORKDIR /app

# Copy ONLY the dependency files first (this caches your installs so future builds are 10x faster)
COPY pyproject.toml uv.lock ./

# Install the production dependencies securely
RUN uv sync --frozen --no-dev

# Copy the rest of your backend code into the container
COPY . .

# Expose the port the API will run on
EXPOSE 8000

# Boot up the FastAPI server using uv
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]