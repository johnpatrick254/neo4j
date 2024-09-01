import { getUserSessions } from "@/llm/gateway";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries()) as { clientId: string };
    try {
        const sessions = await getUserSessions(queryParams.clientId)
        console.log(`\n>>>>>>>>>\nFETCHED USER SESSIONS \n USER: ${queryParams.clientId} \n`, sessions, "\n>>>>>>>>>\n")
        return NextResponse.json({ sessions })
    } catch (error) {
        console.error('Error fetching clientId messages:', error);
        return NextResponse.json({ error: 'Failed to fetch user sessions' }, { status: 500 });
    }
}