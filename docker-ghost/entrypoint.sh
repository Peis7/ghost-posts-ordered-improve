#!/bin/bash

# Add a new user if not already exists
if ! id "karl" &>/dev/null; then
    useradd -ms /bin/bash karl
fi

# Ensure the ghost content folder exists
mkdir -p /var/lib/ghost/content

# Change ownership of /var/lib/ghost to the new user
chown -R karl:karl /var/lib/ghost

# Start Ghost CMS as karl
exec gosu karl "$@"
