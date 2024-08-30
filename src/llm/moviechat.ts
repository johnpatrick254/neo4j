import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { cypherGenerationTemplate } from "@/utils/templates";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { randomUUID } from "crypto";
import { ChatbotResponse, CypherEvaluationChainInput, CypherEvaluationChainOutput, CypherRetrievalThroughput, RephraseQuestionInput } from "@/utils/types";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

const NEO4J_URL = process.env.NEO4J_URI
const NEO4J_USERNAME = process.env.NEO4J_USERNAME
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD



export async function initCypherGenerationChain(
    graph: Neo4jGraph,
    llm: BaseLanguageModel
) {
    // TODO: Create Prompt Template
    const cypherPrompt = PromptTemplate.fromTemplate(cypherGenerationTemplate)
    // TODO: Create the runnable sequence
    return RunnableSequence.from<string, string>([
        {
            // Take the input and assign it to the question key
            question: new RunnablePassthrough(),
            // Get the schema
            schema: () => graph.getSchema(),
        },
        cypherPrompt,
        llm,
        new StringOutputParser(),
    ]);
}






// tag::interface[]
export type GenerateAuthoritativeAnswerInput = {
    question: string;
    context: string | undefined;
};
// end::interface[]



export async function recursivelyEvaluate(
    graph: Neo4jGraph,
    llm: BaseLanguageModel,
    question: string
): Promise<string> {
    // TODO: Create Cypher Generation Chain
    const generationChain = await initCypherGenerationChain(graph, llm)
    // TODO: Create Cypher Evaluation Chain
    const evaluatorChain = await initCypherEvaluationChain(llm)
    // TODO: Generate Initial cypher
    let cypher = await generationChain.invoke(question)
    // TODO: Recursively evaluate the cypher until there are no errors
    // tag::evaluatereturn[]
    // Bug fix: GPT-4 is adamant that it should use id() regardless of
    // the instructions in the prompt.  As a quick fix, replace it here
    // cypher = cypher.replace(/\sid\(([^)]+)\)/g, " elementId($1)");
    // return cypher;
    let errors = ["N/A"];
    let tries = 0;

    while (tries < 5 && errors.length > 0) {
        tries++;

        try {
            // Evaluate Cypher
            const evaluation = await evaluatorChain.invoke({
                question,
                schema: graph.getSchema(),
                cypher,
                errors,
            });

            errors = evaluation.errors;
            cypher = evaluation.cypher;
        } catch (e: unknown) { }
    }
    cypher = cypher.replace(/\sid\(([^)]+)\)/g, " elementId($1)");
    console.log(cypher)
    return cypher;
    // end::evaluatereturn[]
}

export async function getResults(
    graph: Neo4jGraph,
    llm: BaseLanguageModel,
    input: { question: string; cypher: string }
): Promise<any | undefined> {
    let results;
    let retries = 0;
    let cypher = input.cypher;

    // Evaluation chain if an error is thrown by Neo4j
    const evaluationChain = await initCypherEvaluationChain(llm);
    while (results === undefined && retries < 5) {
        try {
            results = await graph.query(cypher);
            return results;
        } catch (e: any) {
            retries++;

            const evaluation = await evaluationChain.invoke({
                cypher,
                question: input.question,
                schema: graph.getSchema(),
                errors: [e.message],
            });

            cypher = evaluation?.cypher;
        }
    }

    return results;
}

export function extractIds(input: any): string[] {
    let output: string[] = [];

    // Function to handle an object
    const handleObject = (item: any) => {
        for (const key in item) {
            if (key === "_id") {
                if (!output.includes(item[key])) {
                    output.push(item[key]);
                }
            } else if (typeof item[key] === "object" && item[key] !== null) {
                // Recurse into the object if it is not null
                output = output.concat(extractIds(item[key]));
            }
        }
    };

    if (Array.isArray(input)) {
        // If the input is an array, iterate over each element
        input.forEach((item) => {
            if (typeof item === "object" && item !== null) {
                handleObject(item);
            }
        });
    } else if (typeof input === "object" && input !== null) {
        // If the input is an object, handle it directly
        handleObject(input);
    }

    return output;
}

export async function saveHistory(
    sessionId: string,
    source: string,
    input: string,
    rephrasedQuestion: string,
    output: string,
    retry: boolean,
    initialResponseId: string,
    ids: string[],
    cypher: string | null = null
): Promise<{ responseId: string; initialResponseId: string; }> {
    // TODO: Execute the Cypher statement from /cypher/save-response.cypher in a write transaction
    const graph = await Neo4jGraph.initialize({
        url: NEO4J_URL,
        password: NEO4J_PASSWORD,
        username: NEO4J_USERNAME
    })

    await graph.refreshSchema()
    const saveHistoryCypher = `
        MERGE (session:Session { id: $sessionId }) // (1)

        // <2> Create new response
        CREATE (response:Response {
        id: randomUuid(),
        createdAt: datetime(),
        source: $source,
        input: $input,
        output: $output,
        retry:$retry,
        initialResponseId:$initialResponseId,
        rephrasedQuestion: $rephrasedQuestion,
        cypher: $cypher
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

        RETURN DISTINCT response.id AS id`;
    const res = await graph.query<{ id: string }>(
        saveHistoryCypher,
        {
            sessionId,
            source,
            input,
            rephrasedQuestion,
            output,
            ids,
            cypher,
            retry,
            initialResponseId
        },
        "WRITE")
    console.log(res ?? res)
    return {responseId:res && res.length ? res[0].id : "",initialResponseId};

}
export async function getHistory(
    sessionId: string,
    limit: number = 5
): Promise<ChatbotResponse[]> {
    const graph = await Neo4jGraph.initialize({
        url: NEO4J_URL,
        password: NEO4J_PASSWORD,
        username: NEO4J_USERNAME
    })
    const res = await graph.query<ChatbotResponse>(
        `
      MATCH (:Session {id: $sessionId})-[:LAST_RESPONSE]->(last)
      MATCH path = (start)-[:NEXT*0..${limit}]->(last)
      WHERE length(path) = 5 OR NOT EXISTS { ()-[:NEXT]->(start) }
      UNWIND nodes(path) AS response
      RETURN response.id AS id,
        response.input AS input,
        response.rephrasedQuestion AS rephrasedQuestion,
        response.output AS output,
        response.cypher AS cypher,
        response.createdAt AS createdAt,
        [ (response)-[:CONTEXT]->(n) | elementId(n) ] AS context
    `,
        { sessionId },
        "READ"
    );

    return res as ChatbotResponse[];
}
export function initGenerateAuthoritativeAnswerChain(
    llm: BaseLanguageModel
): RunnableSequence<GenerateAuthoritativeAnswerInput, string> {
    // tag::prompt[]
    const answerQuestionPrompt = PromptTemplate.fromTemplate(`
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
  `);
    // end::prompt[]

    // tag::sequence[]
    return RunnableSequence.from<GenerateAuthoritativeAnswerInput, string>([
        RunnablePassthrough.assign({
            context: ({ context }) =>
                context == undefined || context === "" ? "I don't know" : context,
        }),
        answerQuestionPrompt,
        llm,
        new StringOutputParser(),
    ]);
    // end::sequence[]
}
export function initRephraseChain(llm: BaseChatModel) {
    // TODO: Create Prompt template
    const rephraseQuestionCypher = `
    Given the following conversation and a question,
    rephrase the follow-up question to be a standalone question about the
    subject of the conversation history.

    If you do not have the required information required to construct
    a standalone question, ask for clarification.

    Always include the subject of the history in the question.

    History:
    {history}

    Question:
    {input}
`;

    const rephraseQuestionChainPrompt = PromptTemplate.fromTemplate<
        RephraseQuestionInput,
        string
    >(rephraseQuestionCypher);
    // TODO: Create Runnable Sequence
    return RunnableSequence.from<RephraseQuestionInput, string>([
        // <1> Convert message history to a string
        RunnablePassthrough.assign({
            history: ({ history }): string => {
                if (history.length == 0) {
                    return "No history";
                }
                return history
                    .map(
                        (response: ChatbotResponse) =>
                            `Human: ${response.input}\nAI: ${response.output}`
                    )
                    .join("\n");
            },
        }),
        // <2> Use the input and formatted history to format the prompt
        rephraseQuestionChainPrompt,
        // <3> Pass the formatted prompt to the LLM
        llm,
        // <4> Coerce the output into a string
        new StringOutputParser(),
    ]);
}
export async function initCypherEvaluationChain(
    llm: BaseLanguageModel
) {
    // Prompt template
    const prompt = PromptTemplate.fromTemplate(`
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
  `);

    return RunnableSequence.from<
        CypherEvaluationChainInput,
        CypherEvaluationChainOutput
    >([
        RunnablePassthrough.assign({
            // Convert errors into an LLM-friendly list
            errors: ({ errors }) => {
                if (
                    errors === undefined ||
                    (Array.isArray(errors) && errors.length === 0)
                ) {
                    return "";
                }

                return `Errors: * ${Array.isArray(errors) ? errors?.join("\n* ") : errors
                    }`;
            },
        }),
        prompt,
        llm,
        new JsonOutputParser<CypherEvaluationChainOutput>(),
    ]);
}
export async function createMovieQueryAndHistoryChain() {
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

    const rephraseChain = initRephraseChain(llm);
    const cypherRetrievalChain = await initCypherRetrievalChain(llm, graph);

    return RunnableSequence.from([
        RunnablePassthrough.assign({
            history: async ({
                sessionId,
                retry,
                initialResponseId
            }: {
                sessionId: string,
                input: string,
                retry: boolean,
                initialResponseId: string
            }) => await getHistory(sessionId),
        }),
        RunnablePassthrough.assign({
            rephrasedQuestion: ({ input, history }) =>
                rephraseChain.invoke({ input, history }),
        }),
        RunnablePassthrough.assign({
            movieResponse: ({ rephrasedQuestion, sessionId, input, retry,
                initialResponseId, }) =>
                cypherRetrievalChain.invoke(
                    { input: input, rephrasedQuestion },
                    {
                        configurable: {
                            sessionId,
                            retry,
                            initialResponseId
                        }
                    }
                )
        }), ({ movieResponse}) => {
            return {
            response: movieResponse.output,
            responseId: movieResponse.responseIds.responseId,
            initialResponseId:movieResponse.responseIds.initialResponseId

        }
    }

    ]);
}
export default async function initCypherRetrievalChain(
    llm: BaseLanguageModel,
    graph: Neo4jGraph
) {
    const answerGeneration = await initGenerateAuthoritativeAnswerChain(llm);

    return (
        RunnablePassthrough
            // Generate and evaluate the Cypher statement
            .assign({
                cypher: (input: { rephrasedQuestion: string }) =>
                    recursivelyEvaluate(graph, llm, input.rephrasedQuestion),
            })

            // Get results from database
            .assign({
                results: (input: { cypher: string; question: string }) =>
                    getResults(graph, llm, input),
            })

            // Extract information
            .assign({
                // Extract _id fields
                ids: (input: Omit<CypherRetrievalThroughput, "ids">) =>
                    extractIds(input.results),
                // Convert results to JSON output
                context: ({ results }: Omit<CypherRetrievalThroughput, "ids">) =>
                    Array.isArray(results) && results.length == 1
                        ? JSON.stringify(results[0])
                        : JSON.stringify(results),
            })

            // Generate Output
            .assign({
                output: (input: CypherRetrievalThroughput) =>
                    answerGeneration.invoke({
                        question: input.rephrasedQuestion,
                        context: input.context,
                    }),
            })

            // Save response to database
            .assign({
                responseIds: async (input: CypherRetrievalThroughput, options) => {
                    return saveHistory(
                        options?.metadata.sessionId,
                        "cypher",
                        input.input,
                        input.rephrasedQuestion,
                        input.output,
                        options?.metadata.retry,
                        options?.metadata.initialResponseId,
                        input.ids,
                        input.cypher,
                    );
                },
            })
            // Return the output
            .pick(["output", "responseIds"])
    );
}
