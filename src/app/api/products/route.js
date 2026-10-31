import { NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '../../../lib/data';

// In-memory products store for serverless runtime
let productsStore = [...INITIAL_PRODUCTS];

/**
 * GET /api/products
 * Query Params:
 *  - sku: exact match lookup for barcode scanning
 *  - search: case-insensitive search across name and SKU
 *  - category: filter by category
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const search = searchParams.get('search');
  const category = searchParams.get('category');

  // Exact SKU lookup for Barcode Scanners (sub-millisecond response)
  if (sku) {
    const product = productsStore.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase() || p.id === sku
    );

    if (!product) {
      return NextResponse.json(
        { error: `Garment with barcode SKU '${sku}' was not found in catalog.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  }

  // Filtered listing
  let filtered = [...productsStore];

  if (category && category !== 'ALL') {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.color && p.color.toLowerCase().includes(query))
    );
  }

  return NextResponse.json(
    { count: filtered.length, products: filtered },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      },
    }
  );
}

/**
 * POST /api/products
 * Registers a new garment into boutique inventory
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, price, sku, category, size, color, stock } = body;

    // Security & Input Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid garment title/name is required.' },
        { status: 400 }
      );
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json(
        { error: 'Valid numeric price (>= 0) is required.' },
        { status: 400 }
      );
    }

    const cleanSku = (sku || `890123${Date.now().toString().slice(-6)}`).trim();

    // Check SKU collision
    const existing = productsStore.find(
      (p) => p.sku.toLowerCase() === cleanSku.toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        { error: `A product with barcode SKU '${cleanSku}' already exists.` },
        { status: 409 }
      );
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      sku: cleanSku,
      name: name.trim(),
      price: Number(price),
      stock: Number(stock) || 10,
      category: category || 'Kurtis & Tunics',
      size: size || 'M',
      color: color || 'Standard',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&q=80',
    };

    productsStore = [newProduct, ...productsStore];

    return NextResponse.json(
      { message: 'Garment registered successfully', product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to parse JSON body or create product.' },
      { status: 400 }
    );
  }
}
