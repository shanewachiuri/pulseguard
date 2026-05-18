# Use a lightweight Python base image
FROM python:3.12-slim

# Grab the ultra-fast uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory
WORKDIR /app

# Copy dependencies first
COPY pyproject.toml uv.lock ./

# Install production dependencies
RUN uv sync --frozen --no-dev

# Copy the rest of your code
COPY . .

# 👇 FIX: Generate the Prisma Client using the schema you just copied 👇
RUN uv run prisma generate

# Expose the port
EXPOSE 8000

# Boot up the FastAPI server
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]