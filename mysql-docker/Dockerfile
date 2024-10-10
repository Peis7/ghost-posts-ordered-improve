FROM mysql:8

# Create a new user and group with a different UID/GID
RUN groupadd -g 999 mysqluser || true && \
    useradd -u 999 -g mysqluser -m mysqluser || true

# Set the working directory
WORKDIR /var/lib/mysql

# Ensure the data directory is created and owned by the new user
RUN mkdir -p /var/lib/mysql && chown -R mysqluser:mysqluser /var/lib/mysql

# Switch to the new user
USER mysqluser

# Run MySQL server
CMD ["mysqld"]
