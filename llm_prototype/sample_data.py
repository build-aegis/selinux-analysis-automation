from old_neo4j_utils import Neo4jConnection


def insert_sample_data(conn: Neo4jConnection):
    """insert sample SELinux policy data into Neo4j"""

    # create sample subjects manually (will be replaced with actual data)

    subjects_query = """
    UNWIND $subjects as subject
    CREATE (s:Subject {
        name: subject.name,
        type: subject.type,
        domain: subject.domain,
        attributes: subject.attributes
    })
    """

    subjects_data = [
        {
            "name": "init_t",
            "type": "process",
            "domain": "init_t",
            "attributes": ["domain", "init_domain"]
        },
        {
            "name": "httpd_t",
            "type": "process",
            "domain": "httpd_t",
            "attributes": ["domain", "web_server_domain"]
        }
    ]

    # create sample objects manually (will be replaced with actual data)
    objects_query = """
    UNWIND $objects as object
    CREATE (o:Object {
        name: object.name,
        type: object.type,
        class: object.class,
        attributes: object.attributes
    })
    """

    objects_data = [
        {
            "name": "/var/www/html",
            "type": "directory",
            "class": "dir",
            "attributes": ["file_type", "web_content"]
        },
        {
            "name": "/var/log/httpd",
            "type": "directory",
            "class": "dir",
            "attributes": ["file_type", "log_file"]
        }
    ]

    # create sample classes manually (will be replaced with actual data)
    classes_query = """
    UNWIND $classes as class
    CREATE (c:Class {
        name: class.name,
        permissions: class.permissions,
        description: class.description
    })
    """

    classes_data = [
        {
            "name": "dir",
            "permissions": ["read", "write", "execute", "search"],
            "description": "Directory operations"
        },
        {
            "name": "file",
            "permissions": ["read", "write", "execute", "getattr", "setattr"],
            "description": "File operations"
        }
    ]

    # create relationships manually (will be replaced with actual data)
    relationships_query = """
    MATCH (s:Subject {name: $subject_name})
    MATCH (o:Object {name: $object_name})
    CREATE (s)-[:ALLOWS {
        permissions: $permissions,
        conditions: $conditions
    }]->(o)
    """

    relationships_data = [
        {
            "subject_name": "httpd_t",
            "object_name": "/var/www/html",
            "permissions": ["read", "execute", "search"],
            "conditions": []
        },
        {
            "subject_name": "httpd_t",
            "object_name": "/var/log/httpd",
            "permissions": ["read", "write"],
            "conditions": []
        }
    ]

    # execute queries

    try:
        conn.execute_query(subjects_query, {"subjects": subjects_data})
        conn.execute_query(objects_query, {"objects": objects_data})
        conn.execute_query(classes_query, {"classes": classes_data})

        for rel in relationships_data:
            conn.execute_query(relationships_query, rel)

        print("Successfully inserted sample data")
    except Exception as e:
        print(f"Error inserting sample data: {str(e)}")
        raise


def main():
    conn = Neo4jConnection()
    try:
        conn.connect()
        conn.create_constraints()
        conn.create_indexes()
        insert_sample_data(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
