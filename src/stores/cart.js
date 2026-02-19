// stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref([])
  
  const fetchCart = async () => {
    try {
      const res = await api.get('/cart/get-cart')
      const cart = res.data.cart || res.data
      cartItems.value = cart.cartItems || []
    } catch (err) {
      cartItems.value = []
    }
  }

  const cartCount = computed(() => cartItems.value.length)

  return { cartItems, cartCount, fetchCart }
})
