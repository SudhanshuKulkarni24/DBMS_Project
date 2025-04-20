import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This is a mock database. Replace with your actual database implementation
let announcements = [
  {
    id: '1',
    title: 'Welcome to the Course',
    content: 'Welcome everyone to this semester. I look forward to working with you all.',
    createdAt: new Date().toISOString(),
    professorName: 'Dr. Smith'
  }
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(announcements);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newAnnouncement = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
      professorName: session.user?.name || 'Unknown Professor'
    };

    announcements.unshift(newAnnouncement);

    return NextResponse.json(newAnnouncement);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 