import { auth } from '@workspace/auth/server';
import prisma from '@workspace/db/prisma/client';
import { NextResponse } from 'next/server';

const ADMIN_IDS =
  process.env.ADMIN_IDS?.split(',').map((id) => id.trim()) || [];

/**
 * Admin endpoint to list all users
 * GET /api/admin/users
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    if (!ADMIN_IDS.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
