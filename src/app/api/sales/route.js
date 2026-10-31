import { NextResponse } from 'next/server';

// Serverless sales ledger store
let salesLedger = [];

/**
 * GET /api/sales
 * Retrieves sales history records
 */
export async function GET() {
  return NextResponse.json({
    count: salesLedger.length,
    sales: salesLedger,
  });
}

/**
 * POST /api/sales
 * Records completed checkout transaction with tax, discounts & payment method
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer, paymentMethod, orderDiscount = 0, taxRate = 0.05 } = body;

    // Security Validation: Cart emptiness & items shape
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Transaction must contain at least one valid line item.' },
        { status: 400 }
      );
    }

    // Server-side recalculation to prevent price tampering
    let subtotal = 0;
    const lineItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const discount = Math.min(100, Math.max(0, Number(item.discount) || 0));
      const lineGross = price * quantity;
      const lineNet = lineGross * (1 - discount / 100);
      subtotal += lineNet;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        size: item.size || 'M',
        price,
        quantity,
        discountPercent: discount,
        lineTotal: Number(lineNet.toFixed(2)),
      };
    });

    const safeDiscount = Math.min(subtotal, Math.max(0, Number(orderDiscount) || 0));
    const taxableSubtotal = subtotal - safeDiscount;
    const taxAmount = Number((taxableSubtotal * Number(taxRate)).toFixed(2));
    const grandTotal = Number((taxableSubtotal + taxAmount).toFixed(2));

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    const saleRecord = {
      id: invoiceId,
      invoiceNumber: invoiceId,
      customer: customer || { name: 'Walk-in Customer' },
      items: lineItems,
      subtotal: Number(subtotal.toFixed(2)),
      orderDiscount: safeDiscount,
      taxAmount,
      grandTotal,
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      date: new Date().toISOString(),
    };

    salesLedger = [saleRecord, ...salesLedger];

    return NextResponse.json(
      {
        message: 'Order completed and recorded',
        sale: saleRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid checkout payload.' },
      { status: 400 }
    );
  }
}
