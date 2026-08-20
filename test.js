const assert = require('assert');

let cartItems = [];
const setCartItems = (newCart) => { cartItems = newCart; };

const addToCart = (product) => {
  let newCart;
  const existing = cartItems.find(item => item.id === product.id);
  if (existing) {
    newCart = cartItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
  } else {
    const priceStr = product.priceStr || product.price || "€0.00";
    newCart = [...cartItems, { ...product, priceStr, quantity: 1 }];
  }
  setCartItems(newCart);
};

addToCart({ id: 1, name: 'Test', price: '€10.00' });
console.log("Cart length:", cartItems.length);
console.log("Cart items:", cartItems);
