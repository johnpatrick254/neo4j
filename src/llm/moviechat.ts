// import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
// import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
// import { JsonOutputFunctionsParser } from "langchain/output_parsers";
// import { createRetrievalChain } from "langchain/chains/retrieval";
// import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
// import { GraphCypherQAChain } from "@langchain/community/chains/graph_qa/cypher";
// import { BaseLanguageModel } from "@langchain/core/language_models/base";
// import { authoratativeAnswerPrompt, evaluateCypherTemplate, MovieCypherTemplate, saveHIstoryCypher } from "@/utils/templates";
// import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
// import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
// import { randomUUID } from "crypto";

// const NEO4J_URL = process.env.NEO4J_URI
// const NEO4J_USERNAME = process.env.NEO4J_USERNAME
// const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD

// const sessionId = randomUUID()
// export const movieChat = async (query: string) => {
//     if (!NEO4J_URL || !NEO4J_PASSWORD || !NEO4J_USERNAME) {
//         throw new Error("PLEASE PROVIDE AURO CREDENTIALS")
//     }
 
//     const graph = await Neo4jGraph.initialize({
//         url:NEO4J_URL,
//         password:NEO4J_PASSWORD,
//         username:NEO4J_USERNAME
//     })

//     await graph.refreshSchema()
    
//     const llm = new ChatOpenAI()
//     const chain = await initCypherGenerationChain( graph,llm);
//     const input = "Movie: Changeling";

//     const output = await chain.invoke(input);

//     console.log(output)


// }
// export async function initCypherGenerationChain(
//     graph: Neo4jGraph,
//     llm: BaseLanguageModel
// ) {
//     const cypherPrompt = PromptTemplate.fromTemplate(MovieCypherTemplate);
//     return RunnableSequence.from<string, string>([
//         {
//             question: new RunnablePassthrough(),
//             schema: () => graph.getSchema(),
//         },
//         cypherPrompt,
//         llm,
//         new StringOutputParser(),
//     ]);
// }

// export  async function initCypherEvaluationChain(
//     llm: BaseLanguageModel
// ) {
//     const prompt = PromptTemplate.fromTemplate(evaluateCypherTemplate);

//     return RunnableSequence.from([
//         RunnablePassthrough.assign({
//             // Convert errors into an LLM-friendly list
//             errors: ({ errors }) => {
//                 if (
//                     errors === undefined ||
//                     (Array.isArray(errors) && errors.length === 0)
//                 ) {
//                     return "";
//                 }

//                 return `Errors: * ${Array.isArray(errors) ? errors?.join("\n* ") : errors
//                     }`;
//             },
//         }),
//         prompt,
//         llm,
//         new JsonOutputParser(),
//     ]);
// }

// export  async function initCypherRetrievalChain(
//     llm: BaseLanguageModel,
//     graph: Neo4jGraph
// ) {
//     const answerGeneration = await initGenerateAuthoritativeAnswerChain(llm);

//     return (
//         RunnablePassthrough
//             // Generate and evaluate the Cypher statement
//             // Get results from database
//             .assign({
//                 results: (input: { cypher: string; question: string }) =>
//                     getResults(graph, llm, input),
//             })

//             // Extract information
//             .assign({
//                 // Extract _id fields
//                 ids: (input: Omit<CypherRetrievalThroughput, "ids">) =>
//                     extractIds(input.results),
//                 // Convert results to JSON output
//                 context: ({ results }: Omit<CypherRetrievalThroughput, "ids">) =>
//                     Array.isArray(results) && results.length == 1
//                         ? JSON.stringify(results[0])
//                         : JSON.stringify(results),
//             })

//             // Generate Output
//             .assign({
//                 output: (input: CypherRetrievalThroughput) =>
//                     answerGeneration.invoke({
//                         question: input.rephrasedQuestion,
//                         context: input.context,
//                     }),
//             })

//             // Save response to database
//             .assign({
//                 responseId: async (input: CypherRetrievalThroughput, options) => {
//                     saveHistory(
//                         options?.configurable.sessionId,
//                         "cypher",
//                         input.input,
//                         input.rephrasedQuestion,
//                         input.output,
//                         input.ids,
//                         input.cypher
//                     );
//                 },
//             })
//             // Return the output
//             .pick("output")
//     );
// }



// // tag::interface[]
// export type GenerateAuthoritativeAnswerInput = {
//     question: string;
//     context: string | undefined;
// };
// // end::interface[]

// export default  function initGenerateAuthoritativeAnswerChain(
//     llm: BaseLanguageModel
// ): RunnableSequence<GenerateAuthoritativeAnswerInput, string> {
//     // tag::prompt[]
//     const answerQuestionPrompt = PromptTemplate.fromTemplate(authoratativeAnswerPrompt);
//     // end::prompt[]

//     // tag::sequence[]
//     return RunnableSequence.from<GenerateAuthoritativeAnswerInput, string>([
//         RunnablePassthrough.assign({
//             context: ({ context }) =>
//                 context == undefined || context === "" ? "I don't know" : context,
//         }),
//         answerQuestionPrompt,
//         llm,
//         new StringOutputParser(),
//     ]);
//     // end::sequence[]
// }

// async function recursivelyEvaluate(
//     graph: Neo4jGraph,
//     llm: BaseLanguageModel,
//     question: string
// ): Promise<string> {
//     // Initiate chains
//     const generationChain = await initCypherGenerationChain(graph, llm);
//     const evaluatorChain = await initCypherEvaluationChain(llm);

//     // Generate Initial Cypher
//     let cypher = await generationChain.invoke(question);

//     let errors = ["N/A"];
//     let tries = 0;

//     while (tries < 5 && errors.length > 0) {
//         tries++;

//         try {
//             // Evaluate Cypher
//             const evaluation = await evaluatorChain.invoke({
//                 question,
//                 schema: graph.getSchema(),
//                 cypher,
//                 errors,
//             });

//             errors = evaluation?.errors;
//             cypher = evaluation?.cypher;
//         } catch (e: unknown) { }
//     }

//     // Bug fix: GPT-4 is adamant that it should use id() regardless of
//     // the instructions in the prompt.  As a quick fix, replace it here
//     cypher = cypher.replace(/\sid\(([^)]+)\)/g, " elementId($1)");

//     return cypher;
// }

// export async function getResults(
//     graph: Neo4jGraph,
//     llm: BaseLanguageModel,
//     input: { question: string; cypher: string }
// ): Promise<any | undefined> {
//     let results;
//     let retries = 0;
//     let cypher = input.cypher;

//     // Evaluation chain if an error is thrown by Neo4j
//     const evaluationChain = await initCypherEvaluationChain(llm);
//     while (results === undefined && retries < 5) {
//         try {
//             results = await graph.query(cypher);
//             return results;
//         } catch (e: any) {
//             retries++;

//             const evaluation = await evaluationChain.invoke({
//                 cypher,
//                 question: input.question,
//                 schema: graph.getSchema(),
//                 errors: [e.message],
//             });

//             cypher = evaluation?.cypher;
//         }
//     }

//     return results;
// }

// export function extractIds(input: any): string[] {
//     let output: string[] = [];

//     // Function to handle an object
//     const handleObject = (item: any) => {
//         for (const key in item) {
//             if (key === "_id") {
//                 if (!output.includes(item[key])) {
//                     output.push(item[key]);
//                 }
//             } else if (typeof item[key] === "object" && item[key] !== null) {
//                 // Recurse into the object if it is not null
//                 output = output.concat(extractIds(item[key]));
//             }
//         }
//     };

//     if (Array.isArray(input)) {
//         // If the input is an array, iterate over each element
//         input.forEach((item) => {
//             if (typeof item === "object" && item !== null) {
//                 handleObject(item);
//             }
//         });
//     } else if (typeof input === "object" && input !== null) {
//         // If the input is an object, handle it directly
//         handleObject(input);
//     }

//     return output;
// }

// export async function saveHistory(
//     sessionId: string,
//     source: string,
//     input: string,
//     rephrasedQuestion: string,
//     output: string,
//     ids: string[],
//     cypher: string | null = null
// ): Promise<string> {
//     const graph = await Neo4jGraph.initialize({
//         url:NEO4J_URL!,
//         password:NEO4J_PASSWORD!,
//         username:NEO4J_USERNAME!
//     })

//     const res = await graph.query<{ id: string }>(
//         saveHIstoryCypher,
//         {
//             sessionId,
//             source,
//             input,
//             output,
//             rephrasedQuestion,
//             cypher: cypher,
//             ids,
//         },
//         "WRITE"
//     );

//     return res && res.length ? res[0].id : "";
// }