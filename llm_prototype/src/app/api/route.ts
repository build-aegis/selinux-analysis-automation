import { NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getNeo4jConnection } from '@/lib/neo4j-utils';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini with LangChain
const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-2.0-flash',
  temperature: 0,
});

// Define a prompt template for converting natural language to Cypher
const cypherPromptTemplate = PromptTemplate.fromTemplate(`
  You are a security analyst specializing in SELinux policies. Your task is to convert natural language queries about SELinux policy analysis into Cypher queries for Neo4j.
  
  The database has the following structure:
  - Nodes with label 'Subject' represent SELinux domains/processes with properties:
    * name: The name of the domain or type
    * type: Usually matches the domain name
    * attributes: Array of type attributes (optional)
  
  - Nodes with label 'Object' represent files, directories, or other resources with properties:
    * name: The identifier of the object
    * type: The SELinux type of the object
    * attributes: Array of attributes (optional)
  
  - Nodes with label 'Class' represent object classes with properties:
    * name: The class name (e.g., "file", "dir", "process")
    * permissions: Array of allowed permissions for this class
  
  - Relationships with type 'ACCESS' connect Subjects to Objects with properties:
    * permissions: Array of permissions granted (e.g., ["read", "write"])
    * class: The class of the object being accessed
  
  The user is particularly interested in detecting security violations, especially Separation of Duty violations where a single domain has excessive permissions.
  
  Here are some Cypher queries that YOU SHOULD USE ON OUR DATABASE which contains some separation of duty violation right now:
  
  1. Find subjects with both read and write access to specific objects:
  MATCH (s:Subject)-[r:ACCESS]->(o:Object)
  WHERE 'read' IN r.permissions AND 'write' IN r.permissions
  RETURN s.name AS SubjectName, o.name AS ObjectName, r.permissions AS Permissions
  ORDER BY s.name;
  
  2. Find all objects a specific subject can access:
  MATCH (s:Subject)-[r:ACCESS]->(o:Object)
  WHERE s.name = 'httpd_t'
  RETURN o.name AS ObjectName, o.type AS ObjectType, r.permissions AS Permissions;
  
  3. Find domains with access to both PII and financial data:
  MATCH (s:Subject)-[r1:ACCESS]->(o1:Object), (s)-[r2:ACCESS]->(o2:Object)
  WHERE o1.type = 'customer_pii_t' AND o2.type = 'financial_data_t'
  RETURN s.name AS Domain, 
         o1.name AS PII_Data, r1.permissions AS PII_Permissions,
         o2.name AS Financial_Data, r2.permissions AS Financial_Permissions;
  
  4. Find unauthorized domains with access to authentication files:
  MATCH (s:Subject)-[r:ACCESS]->(o:Object)
  WHERE o.type IN ['shadow_t', 'passwd_t'] AND s.type <> 'admin_t'
  RETURN s.name AS NonAdminDomain, o.name AS SensitiveFile, r.permissions AS Permissions;
  
  5. Find domains with excessive write permissions across different types:
  MATCH (s:Subject)-[r:ACCESS]->(o:Object)
  WHERE 'write' IN r.permissions
  WITH s, count(DISTINCT o.type) AS typeCount
  WHERE typeCount > 2
  MATCH (s)-[r:ACCESS]->(o:Object)
  WHERE 'write' IN r.permissions
  RETURN s.name AS Domain, count(DISTINCT o.type) AS DifferentTypesWithWrite, 
         collect(DISTINCT o.type) AS TypesWithWriteAccess;
  
  6. Identify potential compromised domains:
  MATCH (s:Subject)-[r1:ACCESS]->(o1:Object), (s)-[r2:ACCESS]->(o2:Object)
  WHERE (o1.type = 'passwd_t' AND 'write' IN r1.permissions)
  AND (o2.type IN ['customer_pii_t', 'financial_data_t'])
  RETURN s.name AS SuspiciousDomain, 
         collect(DISTINCT o1.type) AS PasswordAccess,
         collect(DISTINCT o2.type) AS SensitiveDataAccess;
  
  User query: {query}
  
  Generate a valid Cypher query that addresses the user's question. Your response should ONLY contain the Cypher query with no additional text or explanations.
  `);

// Define a prompt template to interpret the results
const interpretationPromptTemplate = PromptTemplate.fromTemplate(`
You are a security analyst specializing in SELinux policies. Interpret the following Neo4j query results in the context of SELinux policy analysis.

Cypher Query: {cypherQuery}

Query Results: {results}

Focus on identifying potential security violations, especially:
1. Separation of Duty violations - where a single domain has both read and write access to sensitive resources
2. Excessive permissions - where a domain has access to many different types of sensitive objects
3. Access to sensitive resources - particularly concerning combinations like both financial and customer data
4. Potential security misconfigurations - like domains with unexpected or dangerous access patterns

For each violation detected, explain:
1. What specific violation was detected
2. Why it's a security concern according to common SELinux security practices
3. How it could potentially be exploited by an attacker
4. A brief recommendation on how to fix it (e.g., separating permissions across different domains)

If no violations are found, briefly explain why the results indicate good security practices.

Provide your analysis in 3-4 paragraphs. Be specific about the domains, objects, and permissions involved in any violations.
`);

// Chain to generate Cypher query
const cypherChain = cypherPromptTemplate
  .pipe(llm)
  .pipe(new StringOutputParser());

// Chain to interpret results
const interpretationChain = interpretationPromptTemplate
  .pipe(llm)
  .pipe(new StringOutputParser());

export async function POST(request: Request) {
  console.log("POST request received");
  
  try {
    // Parse the request body
    const body = await request.json();
    console.log("Request body:", body);
    
    const { query } = body;
    
    if (!query) {
      console.log("Error: Query is required");
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Generate Cypher query using LangChain
    console.log("Generating Cypher query...");
    const cypherQuery = await cypherChain.invoke({
      query: query,
    });
    console.log("Generated Cypher query:", cypherQuery);
    
    // Connect to Neo4j and execute the query
    const neo4j = getNeo4jConnection();

    
    
    try {
      // Connect to Neo4j
      await neo4j.connect();

      console.log("Testing Neo4j connection with a simple query...");
      try {
        const testResult = await neo4j.executeQuery("RETURN 1 AS test");
        console.log("Connection test successful:", testResult);
      } catch (testError) {
        console.error("Connection test failed:", testError);
        return NextResponse.json(
          { error: 'Neo4j connection test failed', details: String(testError) },
          { status: 500 }
        );
      } 
      
      // Execute the Cypher query
      console.log("Executing Cypher query...");
      const rawResults = await neo4j.executeQuery(cypherQuery);
      console.log(`Query returned ${rawResults.length} results`);

      // Process the results to make them React-friendly
      const processedResults = rawResults.map(record => {
        const processedRecord: Record<string, any> = {};
        
        Object.entries(record).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            if ('properties' in value) {
              // For Neo4j nodes and relationships
              processedRecord[key] = value.properties;
            } else if (Array.isArray(value)) {
              // For arrays
              processedRecord[key] = value;
            } else {
              // For other objects, convert to a plain string
              processedRecord[key] = JSON.stringify(value);
            }
          } else {
            // For primitive values
            processedRecord[key] = value;
          }
        });
        
        return processedRecord;
      });

      // Interpret results using LangChain
      console.log("Interpreting results...");
      const interpretation = await interpretationChain.invoke({
        cypherQuery: cypherQuery,
        results: JSON.stringify(processedResults), // Use processed results
      });
      console.log("Interpretation complete");

      return NextResponse.json({
        cypher_query: cypherQuery,
        results: processedResults, // Send processed results to frontend
        interpretation: interpretation
      });
      
    } catch (dbError) {
      console.error('Database Error:', dbError);
      return NextResponse.json(
        { error: 'Database query failed', details: String(dbError) },
        { status: 500 }
      );
    } finally {
      // Ensure connection is closed
      neo4j.close();
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}