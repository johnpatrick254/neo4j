import { z } from "zod";

// tag::toolinput[]
export interface ChatAgentInput {
    input: string;
}
// end::toolinput[]

// tag::agenttoolinput[]
export interface AgentToolInput {
    input: string;
    rephrasedQuestion: string;
}
// end::agenttoolinput[]

// tag::schema[]
export const AgentToolInputSchema = z.object({
    input: z.string().describe("The original input sent by the user"),
    rephrasedQuestion: z
        .string()
        .describe(
            "A rephrased version of the original question based on the conversation history"
        ),
});
// end::schema[]

export type User = {
    id:string
}

export type Message  = {
    _id: string,
    isUserMessage: boolean,
    text: string
}

export type CypherRetrievalThroughput = AgentToolInput & {
    context: string;
    output: string;
    cypher: string;
    results: Record<string, any> | Record<string, any>[];
    ids: string[];
};
export type CypherEvaluationChainInput = {
    question: string;
    cypher: string;
    schema: string;
    errors: string[] | string | undefined;
};
export type CypherEvaluationChainOutput = {
    cypher: string;
    errors: string[];
};