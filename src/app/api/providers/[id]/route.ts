import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 获取单个提供商详情
 * GET /api/providers/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Error fetching provider' },
      { status: 500 }
    );
  }
}

/**
 * 更新提供商信息
 * PUT /api/providers/[id]
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // 验证提供商是否存在
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // 更新提供商信息
    const updatedProvider = await prisma.provider.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Error updating provider' },
      { status: 500 }
    );
  }
}

/**
 * 删除提供商
 * DELETE /api/providers/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // 验证提供商是否存在
    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // 删除提供商
    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Provider deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Error deleting provider' },
      { status: 500 }
    );
  }
} 