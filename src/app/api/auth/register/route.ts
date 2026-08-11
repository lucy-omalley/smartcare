import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { captureServerEvent } from '@/lib/analytics/posthog-server';
import { persistAnalyticsEvent } from '@/lib/analytics/persist';
import { normalizeReferralSource } from '@/lib/analytics-platform/referral';

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password, name, referralSource: rawReferral } = await req.json();
    const email = rawEmail?.trim().toLowerCase();
    const trimmedName = name?.trim();

    // Validate input
    if (!email || !password || !trimmedName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (!existingUser.password) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in with Google or GitHub.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: trimmedName,
        password: hashedPassword,
        referralSource: normalizeReferralSource(rawReferral),
        signupPlatform: 'web',
      },
    });

    await Promise.allSettled([
      persistAnalyticsEvent('signup_completed', user.id, { method: 'email' }),
      captureServerEvent(user.id, 'signup_completed', { method: 'email' }),
    ]);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const message =
      error instanceof Error && error.message.includes('Unique constraint')
        ? 'User already exists'
        : 'Error creating user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 