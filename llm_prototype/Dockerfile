FROM docker.io/neo4j:latest

ENV NEO4J_AUTH=neo4j/selinux123
ENV NEO4J_dbms_memory_pagecache_size=1G
ENV NEO4J_dbms_memory_heap_initial__size=1G
ENV NEO4J_dbms_memory_heap_max__size=1G

# expose ports
EXPOSE 7474 7473 7687

# health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7474 || exit 1 
