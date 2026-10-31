'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import { playBeep } from '../lib/audio';

const CartContext = createContext(null);

const initialState = {
  items: [],
  customer: null,
  taxRate: 0.05, // 5% default tax
  orderDiscount: 0, // fixed amount
  paymentMethod: 'cash',
  heldOrders: [],
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const product = action.payload;
      const existingIndex = state.items.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const existing = updatedItems[existingIndex];
        
        // Check stock availability
        if (existing.quantity + 1 > product.stock) {
          playBeep('error');
          alert(`Cannot add more. Available stock for "${product.name}" is ${product.stock}.`);
          return state;
        }

        updatedItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return { ...state, items: updatedItems };
      }

      if (product.stock <= 0) {
        playBeep('error');
        alert(`Product "${product.name}" is out of stock!`);
        return state;
      }

      const newItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        stock: product.stock,
        quantity: 1,
        discount: 0, // item-level discount percentage
      };

      return { ...state, items: [newItem, ...state.items] };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== id),
        };
      }

      const updatedItems = state.items.map((item) => {
        if (item.id === id) {
          if (quantity > item.stock) {
            playBeep('error');
            alert(`Maximum stock reached (${item.stock})`);
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
        items: state.items.filter((item) => item.id !== action.payload),
      };
    }

    case 'SET_ITEM_DISCOUNT': {
      const { id, discount } = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, discount: Math.max(0, Math.min(100, discount)) } : item
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

    case 'SET_TAX_RATE': {
      return { ...state, taxRate: Math.max(0, action.payload) };
    }

    case 'CLEAR_CART': {
      return { ...state, items: [], customer: null, orderDiscount: 0 };
    }

    case 'HOLD_ORDER': {
      if (state.items.length === 0) return state;
      const orderToHold = {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        items: state.items,
        customer: state.customer,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        ...state,
        heldOrders: [orderToHold, ...state.heldOrders],
        items: [],
        customer: null,
        orderDiscount: 0,
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

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Derived calculations
  const subtotal = state.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const discountedTotal = itemTotal * (1 - (item.discount || 0) / 100);
    return sum + discountedTotal;
  }, 0);

  const discountedSubtotal = Math.max(0, subtotal - state.orderDiscount);
  const taxAmount = discountedSubtotal * state.taxRate;
  const grandTotal = discountedSubtotal + taxAmount;
  const totalItemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    ...state,
    subtotal,
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
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    holdOrder: () => dispatch({ type: 'HOLD_ORDER' }),
    restoreOrder: (id) => dispatch({ type: 'RESTORE_ORDER', payload: id }),
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
