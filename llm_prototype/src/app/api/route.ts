import { NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
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
  * name: The name of the domain
  * type: Usually "process"
  * domain: The SELinux domain type
  * attributes: Array of attributes for this subject

- Nodes with label 'Object' represent files, directories, or other resources with properties:
  * name: The path or identifier of the object
  * type: The SELinux type of the object
  * class: The object class (e.g., "dir", "file")
  * attributes: Array of attributes that might include "sensitive", "financial", etc.

- Relationships with type 'ALLOWS' connect Subjects to Objects with properties:
  * permissions: Array of permissions granted (e.g., ["read", "write"])
  * conditions: Array of conditions (if any)

The user is particularly interested in detecting security violations, especially Separation of Duty violations where a single domain has excessive permissions.

Here are some example Cypher queries for common SELinux policy analysis tasks:

1. Find domains with both read and write access to sensitive objects:
MATCH (s:Subject)-[r:ALLOWS]->(o:Object)
WHERE 'sensitive' IN o.attributes AND 'read' IN r.permissions AND 'write' IN r.permissions
RETURN s.name AS Domain, o.name AS SensitiveObject, r.permissions AS Permissions
ORDER BY s.name;

2. Find domains with access to both financial transactions and audit data:
MATCH (s:Subject)-[r1:ALLOWS]->(o1:Object), (s)-[r2:ALLOWS]->(o2:Object)
WHERE 'financial' IN o1.attributes AND 'transactions' IN o1.attributes 
AND 'financial' IN o2.attributes AND 'audit' IN o2.attributes
RETURN s.name AS Domain, o1.name AS TransactionObject, r1.permissions AS TransactionPermissions,
o2.name AS AuditObject, r2.permissions AS AuditPermissions;

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

// Function to get mock query results
function getMockQueryResults() {
  return [
    { Domain: "payment_proc_t", SensitiveObject: "/financial/payments", Permissions: ["read", "write"] },
    { Domain: "security_t", SensitiveObject: "/var/log/secure", Permissions: ["read", "write"] },
    { Domain: "customer_data_t", SensitiveObject: "/customer/data", Permissions: ["read", "write"] }
  ];
}

// Function to execute Cypher query - Commented out for now
// In a production environment, you would connect to a Neo4j database
/*
async function executeCypherQuery(cypherQuery: string) {
  const driver = Neo4jDriver.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    Neo4jDriver.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );
  
  const session = driver.session();
  try {
    const result = await session.run(cypherQuery);
    return result.records.map(record => {
      const obj: any = {};
      record.keys.forEach(key => {
        const value = record.get(key);
        obj[key] = value;
      });
      return obj;
    });
  } finally {
    await session.close();
    driver.close();
  }
}
*/

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
    
    // Mock results instead of executing against Neo4j
    console.log("Using mock results (Neo4j execution commented out)");
    const results = getMockQueryResults();
    
    // Interpret results using LangChain
    console.log("Interpreting results...");
    const interpretation = await interpretationChain.invoke({
      cypherQuery: cypherQuery,
      results: JSON.stringify(results),
    });
    console.log("Interpretation complete");
    
    return NextResponse.json({
      cypher_query: cypherQuery,
      results: results,
      interpretation: interpretation
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}