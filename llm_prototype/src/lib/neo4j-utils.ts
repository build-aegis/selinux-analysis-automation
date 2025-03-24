import { Driver, Session, RecordShape, auth, driver as createDriver } from 'neo4j-driver';

export class Neo4jConnection {
  private uri: string;
  private user: string;
  private password: string;
  private driver: Driver | null = null;

  constructor() {
    this.uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    this.user = process.env.NEO4J_USER || 'neo4j';
    this.password = process.env.NEO4J_PASSWORD || 'selinux123';
    
    console.log(`Neo4j connection initialized with URI: ${this.uri}`);
  }

  /**
   * Connect to the Neo4j database
   */
  public async connect(): Promise<void> {
    try {
      console.log(`Connecting to Neo4j at ${this.uri}...`);
      this.driver = createDriver(
        this.uri,
        auth.basic(this.user, this.password)
      );
      
      // Verify connection
      await this.driver.verifyConnectivity();
      console.log("Successfully connected to Neo4j");
    } catch (error) {
      console.error(`Failed to connect to Neo4j: ${error}`);
      throw error;
    }
  }

  /**
   * Close the Neo4j connection
   */
  public close(): void {
    if (this.driver) {
      this.driver.close();
      this.driver = null;
      console.log("Neo4j connection closed");
    }
  }

  /**
   * Execute a Cypher query and return results
   */
  public async executeQuery<T extends RecordShape = Record<string, any>>(
    query: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    if (!this.driver) {
      console.log("No active connection, attempting to connect...");
      await this.connect();
    }

    if (!this.driver) {
      throw new Error("Neo4j driver is not connected");
    }

    let session: Session | null = null;
    try {
      console.log(`Executing query: ${query}`);
      console.log(`With params: ${JSON.stringify(params)}`);
      
      session = this.driver.session();
      const result = await session.run(query, params);
      
      console.log(`Query executed successfully, processing ${result.records.length} records`);
      
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj as T;
      });
    } catch (error) {
      console.error(`Error executing query: ${error}`);
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  }

  /**
   * Create necessary constraints for the SELinux policy graph
   */
  public async createConstraints(): Promise<void> {
    const constraints = [
      "CREATE CONSTRAINT IF NOT EXISTS FOR (s:Subject) REQUIRE s.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (o:Object) REQUIRE o.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Class) REQUIRE c.name IS UNIQUE"
    ];

    for (const constraint of constraints) {
      try {
        await this.executeQuery(constraint);
      } catch (error) {
        console.error(`Error creating constraint: ${error}`);
        throw error;
      }
    }
    console.log("All constraints created successfully");
  }

  /**
   * Create necessary indexes for the SELinux policy graph
   */
  public async createIndexes(): Promise<void> {
    const indexes = [
      "CREATE INDEX IF NOT EXISTS FOR (s:Subject) ON (s.type)",
      "CREATE INDEX IF NOT EXISTS FOR (o:Object) ON (o.type)",
      "CREATE INDEX IF NOT EXISTS FOR (c:Class) ON (c.type)"
    ];

    for (const index of indexes) {
      try {
        await this.executeQuery(index);
      } catch (error) {
        console.error(`Error creating index: ${error}`);
        throw error;
      }
    }
    console.log("All indexes created successfully");
  }
}

// Singleton instance
let _instance: Neo4jConnection | null = null;

/**
 * Get Neo4j connection singleton instance
 */
export function getNeo4jConnection(): Neo4jConnection {
  if (!_instance) {
    _instance = new Neo4jConnection();
  }
  return _instance;
}