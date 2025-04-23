import csv
import os
from old_neo4j_utils import Neo4jConnection

# Define paths relative to the script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # selinux-analysis-automation
DATA_DIR = os.path.join(BASE_DIR, "llm-prototype_data", "version-1")

def read_csv(filename):
    """Read data from a CSV file and return it as a list of dictionaries"""
    # Construct full path to the CSV file
    filepath = os.path.join(DATA_DIR, filename)
    
    data = []
    try:
        with open(filepath, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Handle list fields (attributes, permissions, conditions)
                for key, value in row.items():
                    if key in ['attributes', 'permissions', 'conditions']:
                        if value and value != '[]':
                            # Convert comma-separated string to list
                            row[key] = [item.strip() for item in value.split(',')]
                        else:
                            row[key] = []
                data.append(row)
        return data
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        raise
    except Exception as e:
        print(f"Error reading {filepath}: {str(e)}")
        raise

def insert_data_from_csv(conn: Neo4jConnection):
    """Insert SELinux policy data from CSV files into Neo4j"""
    
    # Create subjects from CSV
    subjects_query = """
    UNWIND $subjects as subject
    MERGE (s:Subject {
        name: subject.name
    })
    SET s.type = subject.type,
        s.domain = subject.domain,
        s.attributes = subject.attributes
    """
    
    subjects_data = read_csv('subjects.csv')
    
    # Create objects from CSV
    objects_query = """
    UNWIND $objects as object
    MERGE (o:Object {
        name: object.name
    })
    SET o.type = object.type,
        o.class = object.class,
        o.attributes = object.attributes
    """
    
    objects_data = read_csv('objects.csv')
    
    # Create classes from CSV
    classes_query = """
    UNWIND $classes as class
    MERGE (c:Class {
        name: class.name
    })
    SET c.permissions = class.permissions,
        c.description = class.description
    """
    
    classes_data = read_csv('classes.csv')
    
    # Create relationships from CSV
    relationships_query = """
    MATCH (s:Subject {name: $subject_name})
    MATCH (o:Object {name: $object_name})
    MERGE (s)-[r:ALLOWS]->(o)
    SET r.permissions = $permissions,
        r.conditions = $conditions
    """
    
    relationships_data = read_csv('relationships.csv')

    # Execute queries
    try:
        print(f"Importing {len(subjects_data)} subjects...")
        conn.execute_query(subjects_query, {"subjects": subjects_data})
        
        print(f"Importing {len(objects_data)} objects...")
        conn.execute_query(objects_query, {"objects": objects_data})
        
        print(f"Importing {len(classes_data)} classes...")
        conn.execute_query(classes_query, {"classes": classes_data})
        
        print(f"Importing {len(relationships_data)} relationships...")
        for rel in relationships_data:
            conn.execute_query(relationships_query, rel)
        
        print("Successfully imported data from CSV files")
    except Exception as e:
        print(f"Error importing data: {str(e)}")
        raise

def main():
    # Print working directory and data directory for debugging
    print(f"Current working directory: {os.getcwd()}")
    print(f"Data directory: {DATA_DIR}")
    
    conn = Neo4jConnection()
    try:
        print("Connecting to Neo4j database...")
        conn.connect()
        
        print("Creating constraints...")
        conn.create_constraints()
        
        print("Creating indexes...")
        conn.create_indexes()
        
        print("Importing data from CSV files...")
        insert_data_from_csv(conn)
        
        print("Data import completed successfully")
    except Exception as e:
        print(f"Error in main execution: {str(e)}")
    finally:
        print("Closing database connection...")
        conn.close()

if __name__ == "__main__":
    main()