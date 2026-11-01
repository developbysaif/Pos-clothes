'use client';

import { createContext, useContext, useReducer } from 'react';
import { playBeep } from '../lib/audio';

const CartContext = createContext(null);

const initialState = {
  items: [],
  customer: null,
  taxRate: 0.05, // 5% default tax
  orderDiscount: 0, // fixed PKR amount or percentage
  discountPercent: 0,
  paymentMethod: 'CASH', // CASH, CARD, BANK_TRANSFER, JAZZCASH, EASYPAISA, CREDIT
  splitPayments: [],
  paidAmount: 0,
  heldOrders: [],
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const p = action.payload;
      // Identify item uniquely by variantId or id
      const uniqueId = p.variantId || p.id;
      const existingIndex = state.items.findIndex(
        (item) => (item.variantId || item.id) === uniqueId
      );

      const availableStock = p.stock !== undefined ? p.stock : (p.stockQuantity !== undefined ? p.stockQuantity : 999);

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const existing = updatedItems[existingIndex];

        if (existing.quantity + 1 > availableStock) {
          playBeep('error');
          alert(`Cannot add more. Available stock for "${p.name}" is ${availableStock}.`);
          return state;
        }

        updatedItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return { ...state, items: updatedItems };
      }

      if (availableStock <= 0) {
        playBeep('error');
        alert(`Garment "${p.name}" is currently out of stock!`);
        return state;
      }

      const newItem = {
        id: uniqueId,
        variantId: p.variantId || p.id,
        productId: p.productId || p.id,
        sku: p.sku || 'SKU-001',
        barcode: p.barcode || p.sku || '',
        name: p.name || p.product?.name || 'Garment',
        category: p.category || p.product?.category?.name || 'Pret',
        brand: p.brand || p.product?.brand?.name || 'Boutique',
        size: p.size?.code || p.size || 'M',
        color: p.color?.name || p.color || 'Assorted',
        colorHex: p.colorHex || p.color?.hexCode || '#FF69B4',
        fabric: p.fabric || 'Standard',
        price: Number(p.price || p.sellingPrice || 0),
        costPrice: Number(p.costPrice || p.purchasePrice || 0),
        stock: availableStock,
        quantity: 1,
        discount: 0, // item discount in PKR
        image: p.image || p.product?.image || null,
      };

      return { ...state, items: [newItem, ...state.items] };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => (item.variantId || item.id) !== id),
        };
      }

      const updatedItems = state.items.map((item) => {
        if ((item.variantId || item.id) === id) {
          if (quantity > item.stock) {
            playBeep('error');
            alert(`Maximum available stock is ${item.stock}`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });

      return { ...state, items: updatedItems };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => (item.variantId || item.id) !== action.payload),
      };
    }

    case 'SET_ITEM_DISCOUNT': {
      const { id, discount } = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          (item.variantId || item.id) === id ? { ...item, discount: Math.max(0, discount) } : item
        ),
      };
    }

    case 'SET_CUSTOMER': {
      return { ...state, customer: action.payload };
    }

    case 'SET_PAYMENT_METHOD': {
      return { ...state, paymentMethod: action.payload };
    }

    case 'SET_ORDER_DISCOUNT': {
      return { ...state, orderDiscount: Math.max(0, action.payload) };
    }

    case 'SET_DISCOUNT_PERCENT': {
      return { ...state, discountPercent: Math.max(0, Math.min(100, action.payload)) };
    }

    case 'SET_TAX_RATE': {
      return { ...state, taxRate: Math.max(0, action.payload) };
    }

    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
        customer: null,
        orderDiscount: 0,
        discountPercent: 0,
        paidAmount: 0,
        splitPayments: [],
      };
    }

    case 'HOLD_ORDER': {
      if (state.items.length === 0) return state;
      const orderToHold = {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        items: state.items,
        customer: state.customer,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: state.items.reduce((sum, item) => sum + item.quantity, 0),
        total: state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
      return {
        ...state,
        heldOrders: [orderToHold, ...state.heldOrders],
        items: [],
        customer: null,
        orderDiscount: 0,
        discountPercent: 0,
      };
    }

    case 'RESTORE_ORDER': {
      const orderId = action.payload;
      const order = state.heldOrders.find((o) => o.id === orderId);
      if (!order) return state;
      return {
        ...state,
        items: order.items,
        customer: order.customer,
        heldOrders: state.heldOrders.filter((o) => o.id !== orderId),
      };
    }

    case 'REMOVE_HELD_ORDER': {
      return {
        ...state,
        heldOrders: state.heldOrders.filter((o) => o.id !== action.payload),
      };
    }

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Derived calculations
  const rawSubtotal = state.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const discounted = Math.max(0, itemTotal - (item.discount || 0));
    return sum + discounted;
  }, 0);

  // Apply invoice-level discount (either fixed PKR or percentage)
  const percentDiscountAmount = (rawSubtotal * (state.discountPercent || 0)) / 100;
  const totalDiscount = (state.orderDiscount || 0) + percentDiscountAmount;
  const discountedSubtotal = Math.max(0, rawSubtotal - totalDiscount);
  const taxAmount = discountedSubtotal * state.taxRate;
  const grandTotal = discountedSubtotal + taxAmount;
  const totalItemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    ...state,
    subtotal: rawSubtotal,
    discountAmount: totalDiscount,
    discountedSubtotal,
    taxAmount,
    grandTotal,
    totalItemCount,
    addItem: (product) => dispatch({ type: 'ADD_ITEM', payload: product }),
    updateQuantity: (id, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
    removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
    setItemDiscount: (id, discount) =>
      dispatch({ type: 'SET_ITEM_DISCOUNT', payload: { id, discount } }),
    setCustomer: (customer) => dispatch({ type: 'SET_CUSTOMER', payload: customer }),
    setPaymentMethod: (method) =>
      dispatch({ type: 'SET_PAYMENT_METHOD', payload: method }),
    setOrderDiscount: (discount) =>
      dispatch({ type: 'SET_ORDER_DISCOUNT', payload: discount }),
    setDiscountPercent: (percent) =>
      dispatch({ type: 'SET_DISCOUNT_PERCENT', payload: percent }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    holdOrder: () => dispatch({ type: 'HOLD_ORDER' }),
    restoreOrder: (id) => dispatch({ type: 'RESTORE_ORDER', payload: id }),
    removeHeldOrder: (id) => dispatch({ type: 'REMOVE_HELD_ORDER', payload: id }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
