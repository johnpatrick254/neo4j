
import { getSessionMessages } from '@/llm/gateway';
import { createMovieQueryAndHistoryChain } from '@/llm/moviechat';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { question, clientId, sessionId } = data;
        const movieChain = await createMovieQueryAndHistoryChain();
        let promptResponse;

        console.log("\n>>>>> QUERY\n\n", data, "\n\n >>>>>\n")
        if (data.retry) {
            promptResponse = await movieChain({
                input: question, sessionId: sessionId, clientId: clientId, retry: data.retry,
                initialResponseId: data.initialResponseId
            });
        } else {
            promptResponse = await movieChain({
                input: question, sessionId: sessionId, clientId: clientId, retry: false,
                initialResponseId: '',
            });
        }
        console.log("\n\n>>>>> PROMPT\n\n RESPONSE", promptResponse, "\n\n >>>>>\n")
        return NextResponse.json({ answer: promptResponse.response, responseId: promptResponse.responseId, initialResponseId: promptResponse.initialResponseId });
    } catch (error) {
        console.error('Error in movie QA:', error);
        return NextResponse.json({ error: 'Failed to process the question' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries()) as { sessionId: string, clientId: string };
    try {
        const messages = await getSessionMessages(queryParams.clientId,queryParams.sessionId,)
        console.log(`\n>>>>>>>>>\nFETCHED MESSAGES\n USER: ${queryParams.clientId} SESSION: ${queryParams.sessionId}\n`, messages, "\n>>>>>>>>>\n")
        return NextResponse.json({ messages })
    } catch (error) {
        console.error('Error fetching clientId messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}