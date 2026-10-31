/**
 * Unit Tests for Point of Sale Cart Calculation Engine
 */

describe('POS Cart Calculation Logic', () => {
  function calculateOrderTotals({ items, orderDiscount = 0, taxRate = 0.05 }) {
    const subtotal = items.reduce((sum, item) => {
      const itemGross = item.price * item.quantity;
      const discountedItemTotal = itemGross * (1 - (item.discount || 0) / 100);
      return sum + discountedItemTotal;
    }, 0);

    const discountedSubtotal = Math.max(0, subtotal - orderDiscount);
    const taxAmount = Number((discountedSubtotal * taxRate).toFixed(2));
    const grandTotal = Number((discountedSubtotal + taxAmount).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
      taxAmount,
      grandTotal,
    };
  }

  test('correctly calculates subtotal for multiple clothing items', () => {
    const items = [
      { id: '1', name: 'Silk Kurti', price: 34.99, quantity: 2, discount: 0 },
      { id: '2', name: 'Organza Anarkali', price: 125.0, quantity: 1, discount: 0 },
    ];

    const result = calculateOrderTotals({ items });
    // 34.99 * 2 = 69.98; 69.98 + 125.00 = 194.98
    expect(result.subtotal).toBe(194.98);
    // 5% tax of 194.98 = 9.75
    expect(result.taxAmount).toBe(9.75);
    // grand total = 194.98 + 9.75 = 204.73
    expect(result.grandTotal).toBe(204.73);
  });

  test('applies item-level percentage discounts properly', () => {
    const items = [
      { id: '1', name: 'Velvet Lehenga', price: 200.0, quantity: 1, discount: 20 }, // 20% off = 160.00
    ];

    const result = calculateOrderTotals({ items });
    expect(result.subtotal).toBe(160.0);
    expect(result.taxAmount).toBe(8.0); // 5% of 160 = 8.00
    expect(result.grandTotal).toBe(168.0);
  });

  test('applies fixed order coupon discount before VAT calculation', () => {
    const items = [
      { id: '1', name: 'Embroidered Suit', price: 100.0, quantity: 1, discount: 0 },
    ];

    const result = calculateOrderTotals({ items, orderDiscount: 20.0, taxRate: 0.05 });
    expect(result.subtotal).toBe(100.0);
    expect(result.discountedSubtotal).toBe(80.0);
    expect(result.taxAmount).toBe(4.0); // 5% of 80 = 4.00
    expect(result.grandTotal).toBe(84.0);
  });

  test('prevents negative totals when coupon exceeds subtotal', () => {
    const items = [
      { id: '1', name: 'Chiffon Dupatta', price: 18.0, quantity: 1, discount: 0 },
    ];

    const result = calculateOrderTotals({ items, orderDiscount: 50.0 });
    expect(result.discountedSubtotal).toBe(0.0);
    expect(result.grandTotal).toBe(0.0);
  });
});
