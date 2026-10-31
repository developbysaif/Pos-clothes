import { NextResponse } from 'next/server';
import { INITIAL_CATEGORIES } from '../../../lib/data';

let categoriesStore = [...INITIAL_CATEGORIES];

export async function GET() {
  return NextResponse.json({ categories: categoriesStore });
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const newCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      count: 0,
    };

    categoriesStore = [...categoriesStore, newCategory];
    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
