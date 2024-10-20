FROM ghost:latest

# Install gosu
RUN apt-get update && apt-get install -y gosu && rm -rf /var/lib/apt/lists/*

# Copy the entrypoint script
COPY ./docker-ghost/entrypoint.sh /usr/local/bin/entrypoint.sh

# Make it executable
RUN chmod +x /usr/local/bin/entrypoint.sh

# Override the default entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
