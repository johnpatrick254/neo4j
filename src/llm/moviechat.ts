import { OpenAI } from 'openai';
import neo4j from 'neo4j-driver';
import {
    authoratativeAnswerPrompt,
    cypherGenerationTemplate,
    evaluateCypherTemplate,
    saveHIstoryCypher
} from "@/utils/templates";
import {
    ChatbotResponse,
    CypherEvaluationChainInput,
    CypherEvaluationChainOutput,
    CypherRetrievalThroughput,
    RephraseQuestionInput
} from "@/utils/types";

const NEO4J_URL = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

const openai = new OpenAI();

const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));

async function generateCypher(question: string, schema: string): Promise<string> {
    const prompt = cypherGenerationTemplate
        .replace('{question}', question)
        .replace('{schema}', schema);

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
}

async function evaluateCypher(input: CypherEvaluationChainInput): Promise<CypherEvaluationChainOutput> {
    const prompt = evaluateCypherTemplate
        .replace('{question}', input.question)
        .replace('{schema}', input.schema)
        .replace('{cypher}', input.cypher)
        .replace('{errors}', input.errors.join('\n'));

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
    });

    return JSON.parse(response.choices[0].message.content);
}

async function getSchema(): Promise<string> {
    const session = driver.session();
    try {
        const result = await session.run('CALL apoc.meta.schema()');
        return JSON.stringify(result.records[0].get('value'));
    } finally {
        await session.close();
    }
}

async function recursivelyEvaluate(question: string): Promise<string> {
    const schema = await getSchema();
    let cypher = await generateCypher(question, schema);
    let errors = ["N/A"];
    let tries = 0;

    while (tries < 3 && errors.length > 0) {
        tries++;
        try {
            const evaluation = await evaluateCypher({
                question,
                schema,
                cypher,
                errors,
            });
            errors = evaluation.errors;
            cypher = evaluation.cypher;
        } catch (e) {
            console.error(e);
        }
    }

    cypher = cypher.replace(/\sid\(([^)]+)\)/g, " elementId($1)");
    console.log(cypher);
    return cypher;
}

async function getResults(input: { question: string; cypher: string }): Promise<any | undefined> {
    const session = driver.session();
    try {
        const result = await session.run(input.cypher);
        return result.records.map(record => record.toObject());
    } catch (e) {
        console.error(e);
        return undefined;
    } finally {
        await session.close();
    }
}

function extractIds(input: any): string[] {
    let output: string[] = [];

    const handleObject = (item: any) => {
        for (const key in item) {
            if (key === "_id") {
                if (!output.includes(item[key])) {
                    output.push(item[key]);
                }
            } else if (typeof item[key] === "object" && item[key] !== null) {
                output = output.concat(extractIds(item[key]));
            }
        }
    };

    if (Array.isArray(input)) {
        input.forEach((item) => {
            if (typeof item === "object" && item !== null) {
                handleObject(item);
            }
        });
    } else if (typeof input === "object" && input !== null) {
        handleObject(input);
    }

    return output;
}

async function saveHistory(
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
    const session = driver.session();
    try {
        const result = await session.run(saveHIstoryCypher, {
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
        });
        return {
            responseId: result.records[0].get('id'),
            initialResponseId
        };
    } finally {
        await session.close();
    }
}

async function getHistory(sessionId: string, limit: number = 5): Promise<ChatbotResponse[]> {
    const session = driver.session();
    try {
        const result = await session.run(`
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
    `, { sessionId });
        return result.records.map(record => record.toObject() as ChatbotResponse);
    } finally {
        await session.close();
    }
}

async function generateAuthoritativeAnswer(input: { question: string; context: string }): Promise<string> {
    const prompt = authoratativeAnswerPrompt
        .replace('{question}', input.question)
        .replace('{context}', input.context || "I don't know");

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
}

async function rephraseQuestion(input: RephraseQuestionInput): Promise<string> {
    const history = input.history.length === 0
        ? "No history"
        : input.history
            .map(response => `Human: ${response.input}\nAI: ${response.output}`)
            .join("\n");

    const prompt = `
    Given the following conversation and a question,
    rephrase the follow-up question to be a standalone question about the
    subject of the conversation history.

    If you do not have the required information required to construct
    a standalone question, ask for clarification.

    Always include the subject of the history in the question.

    History:
    ${history}

    Question:
    ${input.input}
  `;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
}

export async function createMovieQueryAndHistoryChain() {
    return async (input: {
        input: string;
        sessionId: string;
        clientId: string;
        retry: boolean;
        initialResponseId: string;
    }) => {
        const history = await getHistory(input.sessionId);
        const rephrasedQuestion = await rephraseQuestion({ input: input.input, history });
        const cypher = await recursivelyEvaluate(rephrasedQuestion);
        const results = await getResults({ question: rephrasedQuestion, cypher });
        const ids = extractIds(results);
        const context = JSON.stringify(results);
        const output = await generateAuthoritativeAnswer({ question: rephrasedQuestion, context });
        const responseIds = await saveHistory(
            input.clientId,
            input.sessionId,
            "cypher",
            input.input,
            rephrasedQuestion,
            output,
            input.retry,
            input.initialResponseId,
            ids,
            cypher
        );

        return {
            response: output,
            responseId: responseIds.responseId,
            initialResponseId: responseIds.initialResponseId
        };
    };
}

export default createMovieQueryAndHistoryChain;