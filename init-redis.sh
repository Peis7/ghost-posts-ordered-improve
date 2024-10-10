#!/bin/bash

# Create the directory if it doesn't exist
mkdir -p /usr/local/etc/redis/

# Generate the Redis configuration
echo "requirepass $REDIS_PASSWORD" > /usr/local/etc/redis/redis.conf
echo "user $REDIS_USER on >$REDIS_PASSWORD ~* +@all" >> /usr/local/etc/redis/redis.conf
echo "bind 0.0.0.0" >> /usr/local/etc/redis/redis.conf
echo "protected-mode no" >> /usr/local/etc/redis/redis.conf

# Start Redis server with the generated configuration
exec redis-server /usr/local/etc/redis/redis.conf
