import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { authoratativeAnswerPrompt, cypherGenerationTemplate, evaluateCypherTemplate, saveHIstoryCypher } from "@/utils/templates";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
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

type GenerateAuthoritativeAnswerInput = {
    question: string;
    context: string | undefined;
};

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
    const schema = graph.getSchema()
    while (tries < 3 && errors.length > 0) {
        tries++;

        try {
            // Evaluate Cypher
            const evaluation = await evaluatorChain.invoke({
                question,
                schema ,
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
    clientId: string,
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
    const graph = await Neo4jGraph.initialize({
        url: NEO4J_URL,
        password: NEO4J_PASSWORD,
        username: NEO4J_USERNAME
    })

    const res = await graph.query<{ id: string }>(
        saveHIstoryCypher,
        {
            clientId,
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
    return { responseId: res && res.length ? res[0].id : "", initialResponseId };

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
    const answerQuestionPrompt = PromptTemplate.fromTemplate(authoratativeAnswerPrompt);
    return RunnableSequence.from<GenerateAuthoritativeAnswerInput, string>([
        RunnablePassthrough.assign({
            context: ({ context }) =>
                context == undefined || context === "" ? "I don't know" : context,
        }),
        answerQuestionPrompt,
        llm,
        new StringOutputParser(),
    ]);
}
export function initRephraseChain(llm: BaseChatModel) {
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
    const prompt = PromptTemplate.fromTemplate(evaluateCypherTemplate);

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

    const llm = new ChatOpenAI();

    const rephraseChain = initRephraseChain(llm);
    const cypherRetrievalChain = await initCypherRetrievalChain(llm, graph);

    return RunnableSequence.from([
        RunnablePassthrough.assign({
            history: async ({
                sessionId
            }: {
                sessionId: string,
                input: string,
                retry: boolean,
                initialResponseId: string,
                clientId: string
            }) => await getHistory(sessionId),
        }),
        RunnablePassthrough.assign({
            rephrasedQuestion: ({ input, history }) =>
                rephraseChain.invoke({ input, history }),
        }),
        RunnablePassthrough.assign({
            movieResponse: ({ rephrasedQuestion, sessionId, clientId, input, retry,
                initialResponseId, }) =>
                cypherRetrievalChain.invoke(
                    { input: input, rephrasedQuestion },
                    {
                        configurable: {
                            sessionId,
                            retry,
                            initialResponseId,
                            clientId
                        }
                    }
                )
        }), ({ movieResponse }) => {
            return {
                response: movieResponse.output,
                responseId: movieResponse.responseIds.responseId,
                initialResponseId: movieResponse.responseIds.initialResponseId

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
                        options?.metadata.clientId,
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
