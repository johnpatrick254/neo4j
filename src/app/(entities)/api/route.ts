
import { movieChat } from '@/llm/moviechat';
import { createMovieQAChain} from '@/llm/movieQA';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { question,user } = await request.json();
        const answer = await movieChat(question,user);
        return NextResponse.json({ answer });
    } catch (error) {
        console.error('Error in movie QA:', error);
        return NextResponse.json({ error: 'Failed to process the question' }, { status: 500 });
    }
}