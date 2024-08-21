export const MovieCypherTemplate = `
  You are a Neo4j Developer translating user questions into Cypher to answer questions
  about movies and provide recommendations.
  Convert the user's question into a Cypher statement based on the schema.

  You must:
  * Only use the nodes, relationships and properties mentioned in the schema.
  * When required, \`IS NOT NULL\` to check for property existence, and not the exists() function.
  * Use the \`elementId()\` function to return the unique identifier for a node or relationship as \`_id\`.
    For example:
    \`\`\`
    MATCH (a:Person)-[:ACTED_IN]->(m:Movie)
    WHERE a.name = 'Emil Eifrem'
    RETURN m.title AS title, elementId(m) AS _id, a.role AS role
    \`\`\`
  * Include extra information about the nodes that may help an LLM provide a more informative answer,
    for example the release date, rating or budget.
  * For movies, use the tmdbId property to return a source URL.
    For example: \`'https://www.themoviedb.org/movie/'+ m.tmdbId AS source\`.
  * For movie titles that begin with "The", move "the" to the end.
    For example "The 39 Steps" becomes "39 Steps, The" or "the matrix" becomes "Matrix, The".
  * Limit the maximum number of results to 10.
  * Respond with only a Cypher statement.  No preamble.


  Example Question: What role did Tom Hanks play in Toy Story?
  Example Cypher:
  MATCH (a:Actor {{name: 'Tom Hanks'}})-[rel:ACTED_IN]->(m:Movie {{title: 'Toy Story'}})
  RETURN a.name AS Actor, m.title AS Movie, elementId(m) AS _id, rel.role AS RoleInMovie

 * For Actors and Directors, include movies they acted in and movies they directed with the result.
  Example Question: Actor:Tom Hanks?
  Example Cypher:
  MATCH (a:Actor {{name: "Tom Hanks"}})-[:ACTED_IN]->(m:Movie)
  OPTIONAL MATCH (a)-[:DIRECTED]->(d:Movie)
  WITH a AS actor, collect(m.title) AS actedInMovies, collect(d.title) AS directedMovies
  RETURN actor{{.*, actedInMovies: actedInMovies, directedMovies: directedMovies}}

  Example Question: Director:Clint Eastwood?
  Example Cypher:
  MATCH (d:Director {{name: "Clint Eastwood"}})-[:DIRECTED]->(m:Movie)
  OPTIONAL MATCH (d)-[:ACTED_IN]->(a:Movie)
  WITH d AS director, collect(m.title) AS directedMovies, collect(a.title) AS actedInMovies
  RETURN director{{.*, directedMovies: directedMovies, actedInMovies: actedInMovies}}

  * For Movies, include actors and directors in the result.
  Example Question: Movie:Apollo 13?
  Example Cypher:
  MATCH (m:Movie {{title: "Apollo 13"}})<-[:ACTED_IN]-(a:Actor)
  MATCH (m)<-[:DIRECTED]-(d:Director)
  WITH m as movie, collect(a.name) AS actors,collect(d.name) AS directors
  RETURN movie{{.*, actors:actors,directors:directors}}
  
  
  Schema:
  {schema}

  Question:
  {question}
`
export const evaluateCypherTemplate = `
    You are an expert Neo4j Developer evaluating a Cypher statement written by an AI.

    Check that the cypher statement provided below against the database schema to check that
    the statement will answer the user's question.
    Fix any errors where possible.

    The query must:
    * Only use the nodes, relationships and properties mentioned in the schema.
    * Assign a variable to nodes or relationships when intending to access their properties.
    * Use \`IS NOT NULL\` to check for property existence.
    * Use the \`elementId()\` function to return the unique identifier for a node or relationship as \`_id\`.
    * For movies, use the tmdbId property to return a source URL.
      For example: \`'https://www.themoviedb.org/movie/'+ m.tmdbId AS source\`.
    * For movie titles that begin with "The", move "the" to the end.
      For example "The 39 Steps" becomes "39 Steps, The" or "the matrix" becomes "Matrix, The".
    * For the role a person played in a movie, use the role property on the ACTED_IN relationship.
    * Limit the maximum number of results to 10.
    * Respond with only a Cypher statement.  No preamble.

    Respond with a JSON object with "cypher" and "errors" keys.
      * "cypher" - the corrected cypher statement
      * "corrected" - a boolean
      * "errors" - A list of uncorrectable errors.  For example, if a label,
          relationship type or property does not exist in the schema.
          Provide a hint to the correct element where possible.

    Fixable Example #1:
    * cypher:
        MATCH (a:Actor {{name: 'Emil Eifrem'}})-[:ACTED_IN]->(m:Movie)
        RETURN a.name AS Actor, m.title AS Movie, m.tmdbId AS source,
        elementId(m) AS _id, m.released AS ReleaseDate, r.role AS Role LIMIT 10
    * errors: ["Variable \`r\` not defined (line 1, column 172 (offset: 171))"]
    * response:
        MATCH (a:Actor {{\name: 'Emil Eifrem'}})-[r:ACTED_IN]->(m:Movie)
        RETURN a.name AS Actor, m.title AS Movie, m.tmdbId AS source,
        elementId(m) AS _id, m.released AS ReleaseDate, r.role AS Role LIMIT 10


    Schema:
    {schema}

    Question:
    {question}

    Cypher Statement:
    {cypher}

    {errors}
  `
export const authoratativeAnswerPrompt = `
    Use the following context to answer the following question.
    The context is provided by an authoritative source, you must never doubt
    it or attempt to use your pre-trained knowledge to correct the answer.

    Make the answer sound like it is a response to the question.
    Do not mention that you have based your response on the context.

    Here is an example:

    Question: Who played Woody in Toy Story?
    Context: ['role': 'Woody', 'actor': 'Tom Hanks']
    Response: Tom Hanks played Woody in Toy Story.

    If no context is provided, say that you don't know,
    don't try to make up an answer, do not fall back to your internal knowledge.
    If no context is provided you may also ask for clarification.

    Include links and sources where possible.

    Question:
    {question}

    Context:
    {context}
  `
export const saveHIstoryCypher = `
    MERGE (session:Session { id: $sessionId }) // (1)

    // <2> Create new response
    CREATE (response:Response {
      id: randomUuid(),
      createdAt: datetime(),
      source: $source,
      input: $input,
      output: $output,
      rephrasedQuestion: $rephrasedQuestion,
      cypher: $cypher,
      ids: $ids
    })
    CREATE (session)-[:HAS_RESPONSE]->(response)

    WITH session, response

    CALL {
    WITH session, response

      // <3> Remove existing :LAST_RESPONSE relationship if it exists
      MATCH (session)-[lrel:LAST_RESPONSE]->(last)
      DELETE lrel

      // <4? Create :NEXT relationship
      CREATE (last)-[:NEXT]->(response)
    }


    // <5> Create new :LAST_RESPONSE relationship
    CREATE (session)-[:LAST_RESPONSE]->(response)

    // <6> Create relationship to context nodes
    WITH response

    CALL {
      WITH response
      UNWIND $ids AS id
      MATCH (context)
      WHERE elementId(context) = id
      CREATE (response)-[:CONTEXT]->(context)

      RETURN count(*) AS count
    }

    RETURN DISTINCT response.id AS id
  `