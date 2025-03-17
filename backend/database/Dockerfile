FROM postgres:13-alpine

# Set environment variables for locale and data directory
ENV LANG en_US.utf8
ENV PGDATA /var/lib/postgresql/data/pgdata

# Copy SQL initialization script
COPY ./init.sql /docker-entrypoint-initdb.d/

# Install necessary network tools
RUN apk add --no-cache \
    iputils \
    curl \
    netcat-openbsd

# Ensure proper permissions and create PGDATA directory
RUN mkdir -p "$PGDATA" && \
    chown -R postgres:postgres "$PGDATA" && \
    chmod 700 "$PGDATA"

# Configure PostgreSQL for external access
RUN echo "listen_addresses = '*'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "max_connections = 100" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "shared_buffers = 128MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "password_encryption = md5" >> /usr/local/share/postgresql/postgresql.conf.sample

# Configure authentication for external connections with md5
RUN echo "# IPv4 remote connections:" >> /usr/local/share/postgresql/pg_hba.conf.sample && \
    echo "host all all 0.0.0.0/0 md5" >> /usr/local/share/postgresql/pg_hba.conf.sample && \
    echo "host all all 10.0.0.0/8 md5" >> /usr/local/share/postgresql/pg_hba.conf.sample

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD pg_isready -U admin -d parkinsons -h localhost || exit 1
