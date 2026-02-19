<template>
  <div class="container my-5">
    <h1 class="mb-3">Cart</h1>

    <!-- Message -->
    <div v-if="message" class="alert alert-success py-2">
      {{ message }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading cart...
    </div>

    <!-- Cart Table -->
    <div v-else-if="cartItems.length">
      <div class="table-responsive">
        <table class="table table-bordered text-start">
          <thead class="table-light">
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cartItems" :key="item.productId">
              <td>{{ item.name }}</td>
              <td>₱{{ item.price }}</td>
              <td>
                <input
                  type="number"
                  v-model.number="item.quantity"
                  min="1"
                  class="form-control"
                  style="width: 80px"
                  @change="updateQuantity(item)"
                />
              </td>
              <td>₱{{ item.subtotal }}</td>
              <td>
                <button
                  class="btn btn-danger btn-sm"
                  @click="removeItem(item.productId)"
                  :disabled="removeLoading[item.productId]"
                >
                  <span v-if="removeLoading[item.productId]">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Removing...
                  </span>
                  <span v-else>
                    Remove
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Total, Continue Shopping, Clear Cart & Checkout -->
      <div class="d-block text-end mt-3">
        <h4 class="mb-3">Total: ₱{{ totalPrice }}</h4>
        <div>
          <RouterLink to="/products"><button class="btn btn-sm btn-primary me-2">Continue Shopping</button></RouterLink>
          <button
            class="btn btn-sm btn-danger me-2"
            @click="clearCart"
            :disabled="clearLoading"
          >
            <span v-if="clearLoading">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Clearing...
            </span>
            <span v-else>
              Clear Cart
            </span>
          </button>
          <button
            class="btn btn-sm btn-success"
            @click="checkoutCart"
            :disabled="checkoutLoading"
          >
            <span v-if="checkoutLoading">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Checking out...
            </span>
            <span v-else>
              Checkout
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty cart -->
    <div v-else class="alert alert-info py-2">
      Your cart is empty. <RouterLink to="/products">Go here</RouterLink> to shop.
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue"
import api from "../api"
import { useUserStore } from "../stores/user"
import { useCartStore } from '../stores/cart'
import { useRouter } from "vue-router"

const auth = useUserStore()
const router = useRouter()

// Don't let admins see Cart page
if (auth.isAdmin) router.push("/products")

const cartItems = ref([])
const totalPrice = ref(0)
const message = ref("")
const loading = ref(true)

// Loading flags
const removeLoading = reactive({})
const clearLoading = ref(false)
const checkoutLoading = ref(false)

let messageTimeout = null
const setMessage = (text, duration = 2000) => {
  message.value = text
  if (messageTimeout) clearTimeout(messageTimeout)
  messageTimeout = setTimeout(() => { message.value = "" }, duration)
}

// Fetch cart
const getCart = async () => {
  try {
    loading.value = true
    const res = await api.get("/cart/get-cart")
    cartItems.value = res.data.cart.cartItems
    totalPrice.value = res.data.cart.totalPrice
  } catch (err) {
    console.error(err)
    cartItems.value = []
    totalPrice.value = 0
  } finally {
    loading.value = false
  }
}

// Update quantity
const updateQuantity = async (item) => {
  try {
    const res = await api.patch("/cart/update-cart-quantity", {
      productId: item.productId,
      newQuantity: item.quantity
    })
    cartItems.value = res.data.cart.cartItems
    totalPrice.value = res.data.cart.totalPrice

    setMessage("Quantity and total updated.")
  } catch (err) {
    console.error(err)
    setMessage("Failed to update quantity.")
  }
}

// Remove item
const removeItem = async (productId) => {
  try {
    removeLoading[productId] = true
    const res = await api.patch(`/cart/${productId}/remove-from-cart`)
    cartItems.value = res.data.cart.cartItems
    totalPrice.value = res.data.cart.totalPrice

    // Update cart store so NavBar updates immediately
    const cartStore = useCartStore()
    await cartStore.fetchCart()

    setMessage("Item removed from cart.")
  } catch (err) {
    console.error(err)
    setMessage("Failed to remove item.")
  } finally {
    removeLoading[productId] = false
  }
}

// Clear cart
const clearCart = async () => {
  try {
    clearLoading.value = true
    await api.put("/cart/clear-cart")
    cartItems.value = []
    totalPrice.value = 0

    // Update cart store so NavBar updates immediately
    const cartStore = useCartStore()
    await cartStore.fetchCart()

    setMessage("Cart cleared successfully.")
  } catch (err) {
    console.error(err)
    setMessage("Failed to clear cart.")
  } finally {
    clearLoading.value = false
  }
}

// Checkout
const checkoutCart = async () => {
  try {
    checkoutLoading.value = true
    await api.post("/orders/checkout")
    cartItems.value = []
    totalPrice.value = 0

    // Update cart store so NavBar updates immediately
    const cartStore = useCartStore()
    await cartStore.fetchCart()

    setMessage("Checkout successful.")

    // Redirect after 1 seconds
    setTimeout(() => {
      router.push("/orders") // or any page you want
    }, 1000)
  } catch (err) {
    console.error(err)
    setMessage(err.response?.data?.message || "Checkout failed.")
  } finally {
    checkoutLoading.value = false
  }
}

onMounted(getCart)
</script>