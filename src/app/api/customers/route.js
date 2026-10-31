import { NextResponse } from 'next/server';
import { INITIAL_CUSTOMERS } from '../../../lib/data';

let customersStore = [...INITIAL_CUSTOMERS];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (phone) {
    const cust = customersStore.find((c) => c.phone === phone);
    if (!cust) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ customer: cust });
  }

  return NextResponse.json({ customers: customersStore });
}

export async function POST(request) {
  try {
    const { name, phone, email } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone || '+92 300 0000000',
      email: email || 'customer@gmail.com',
      visits: 1,
    };

    customersStore = [newCustomer, ...customersStore];
    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 });
  }
}
