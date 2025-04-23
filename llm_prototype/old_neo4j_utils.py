from neo4j import GraphDatabase
from typing import List, Dict, Any
import os
from dotenv import load_dotenv


class Neo4jConnection:
    # def __init__(self):
    #     load_dotenv()
    #     self.uri = os.getenv("NEO4J_URI", "neo4j+s://bc5d66db.databases.neo4j.io")
    #     self.user = os.getenv("NEO4J_USER", "neo4j")
    #     self.password = os.getenv("NEO4J_PASSWORD", "password")
    #     self.driver = None

    def connect(self):
        """Establish connection to Neo4j database"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password)
            )
            # Verify connection
            self.driver.verify_connectivity()
            print("Successfully connected to Neo4j")
        except Exception as e:
            print(f"Failed to connect to Neo4j: {str(e)}")
            raise

    def close(self):
        """Close the Neo4j connection"""
        if self.driver:
            self.driver.close()

    def execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Execute a Cypher query and return results"""
        if not self.driver:
            self.connect()

        try:
            with self.driver.session() as session:
                result = session.run(query, params or {})
                return [dict(record) for record in result]
        except Exception as e:
            print(f"Error executing query: {str(e)}")
            raise

    def create_constraints(self):
        """Create necessary constraints for the SELinux policy graph"""
        constraints = [
            "CREATE CONSTRAINT subject_name IF NOT EXISTS FOR (s:Subject) REQUIRE s.name IS UNIQUE",
            "CREATE CONSTRAINT object_name IF NOT EXISTS FOR (o:Object) REQUIRE o.name IS UNIQUE",
            "CREATE CONSTRAINT class_name IF NOT EXISTS FOR (c:Class) REQUIRE c.name IS UNIQUE"
        ]

        for constraint in constraints:
            try:
                self.execute_query(constraint)
            except Exception as e:
                print(f"Error creating constraint: {str(e)}")
                raise

    def create_indexes(self):
        """Create necessary indexes for the SELinux policy graph"""
        indexes = [
            "CREATE INDEX subject_type IF NOT EXISTS FOR (s:Subject) ON (s.type)",
            "CREATE INDEX object_type IF NOT EXISTS FOR (o:Object) ON (o.type)",
            "CREATE INDEX class_type IF NOT EXISTS FOR (c:Class) ON (c.type)"
        ]

        for index in indexes:
            try:
                self.execute_query(index)
            except Exception as e:
                print(f"Error creating index: {str(e)}")
                raise
