// File: src/llm/movieQAChain.ts

import { ChatOpenAI } from "@langchain/openai";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

const NEO4J_URL = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

// Updated Cypher generation prompt template
const cypherGenerationTemplate = `
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
* Respond with only a Cypher statement. No preamble.

* For Actors and Directors, include movies they acted in and movies they directed with the result.
* For Movies, include actors and directors in the result.

Example Question: What role did Tom Hanks play in Toy Story?
Example Cypher:
MATCH (a:Actor {name: 'Tom Hanks'})-[rel:ACTED_IN]->(m:Movie {title: 'Toy Story'})
RETURN a.name AS Actor, m.title AS Movie, elementId(m) AS _id, rel.role AS RoleInMovie,
       m.released AS ReleaseDate, m.imdbRating AS Rating, 'https://www.themoviedb.org/movie/'+ m.tmdbId AS source

Example Question: Actor:Tom Hanks?
Example Cypher:
MATCH (a:Actor {name: "Tom Hanks"})-[:ACTED_IN]->(m:Movie)
OPTIONAL MATCH (a)-[:DIRECTED]->(d:Movie)
WITH a AS actor, collect(m.title) AS actedInMovies, collect(d.title) AS directedMovies
RETURN actor{.*, actedInMovies: actedInMovies, directedMovies: directedMovies, _id: elementId(actor)}

Example Question: Director:Clint Eastwood?
Example Cypher:
MATCH (d:Director {name: "Clint Eastwood"})-[:DIRECTED]->(m:Movie)
OPTIONAL MATCH (d)-[:ACTED_IN]->(a:Movie)
WITH d AS director, collect(m.title) AS directedMovies, collect(a.title) AS actedInMovies
RETURN director{.*, directedMovies: directedMovies, actedInMovies: actedInMovies, _id: elementId(director)}

Example Question: Movie:Apollo 13?
Example Cypher:
MATCH (m:Movie {title: "Apollo 13"})<-[:ACTED_IN]-(a:Actor)
MATCH (m)<-[:DIRECTED]-(d:Director)
WITH m as movie, collect(a.name) AS actors, collect(d.name) AS directors
RETURN movie{.*, actors: actors, directors: directors, _id: elementId(movie),
             source: 'https://www.themoviedb.org/movie/'+ movie.tmdbId}

Schema:
{schema}

Question:
{question}
`;

// Updated answer generation prompt template
const answerGenerationTemplate = `
Use the following context to answer the question. The context is authoritative; do not use pre-trained knowledge to modify the answer.
Make the answer sound like a response to the question. Do not mention the use of context.

For actors and directors, provide a summary of their work, including notable movies they've acted in or directed.
For movies, provide a summary including the plot, main actors, directors, and any other relevant information like release date or ratings.

Question: {question}

Context: {context}

If no context is provided, say you don't know and ask for clarification.
Include links and sources where possible.
`;

export async function createMovieQAChain() {
    if (!NEO4J_URL || !NEO4J_PASSWORD || !NEO4J_USERNAME) {
        throw new Error("NEO4J CREDENTIALS NOT PROVIDED");
    }

    const graph = await Neo4jGraph.initialize({
        url: NEO4J_URL,
        username: NEO4J_USERNAME,
        password: NEO4J_PASSWORD,
    });

    await graph.refreshSchema();

    const llm = new ChatOpenAI();

    const cypherGenerationChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(cypherGenerationTemplate),
        llm,
        new StringOutputParser(),
    ]);

    const answerGenerationChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(answerGenerationTemplate),
        llm,
        new StringOutputParser(),
    ]);

    const movieQAChain = RunnableSequence.from([
        {
            question: new RunnablePassthrough(),
            schema: async () => await graph.getSchema(),
        },
        {
            question: ({ question }) => question,
            cypher: cypherGenerationChain,
        },
        {
            question: ({ question }) => question,
            context: async ({ cypher }) => {
                const results = await graph.query(cypher);
                return JSON.stringify(results);
            },
        },
        answerGenerationChain,
    ]);

    return movieQAChain;
}

// Usage example:
// const movieQAChain = await createMovieQAChain();
// const response = await movieQAChain.invoke("Who directed Inception?");
// console.log(response);