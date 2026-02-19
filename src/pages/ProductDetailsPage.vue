<template>
  <div class="container my-5">

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading product...
    </div>

    <!-- After Loading -->
    <div v-else>

      <!-- ADMIN: EDIT PRODUCT FORM -->
      <div v-if="auth.isAdmin" class="card p-4 mt-3">
        <h1 class="mb-3">Edit Product</h1>
        <form @submit.prevent="handleEditProduct">
          <input v-model="form.name" class="form-control mb-2" placeholder="Product Name" />
          <textarea v-model="form.description" class="form-control mb-2" placeholder="Description"></textarea>
          <input v-model="form.price" type="number" class="form-control mb-2" placeholder="Price" />
          <input v-model="form.image" type="text" class="form-control mb-2" placeholder="Image URL (Optional)" />
          <div class="form-check mb-3">
            <input type="checkbox" v-model="form.isActive" class="form-check-input" id="isActiveCheck" />
            <label class="form-check-label" for="isActiveCheck">Active</label>
          </div>

          <button class="btn btn-primary btn-sm me-2" :disabled="editing">
            <span v-if="editing">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Saving...
            </span>
            <span v-else>
              Save Changes
            </span>
          </button>
          <a href="#" @click="cancelOrder">
            <button class="btn btn-secondary btn-sm me-2">Cancel</button>
          </a>
        </form>

        <!-- Conditional Alert -->
        <div
          v-if="cartMessage"
          :class="[
            'alert mt-3 py-2',
            cartMessageType === 'success' ? 'alert-success' : 'alert-danger'
          ]"
        >
          {{ cartMessage }}
        </div>
      </div>

      <!-- NON-ADMIN: PRODUCT DETAILS -->
      <div v-else-if="product" class="card shadow-sm p-4 mt-3 col-md-6 mx-auto">
        <h1 class="card-title mb-0">{{ product.name }}</h1>
        <hr>
        <p class="card-text mb-3">
          <img v-if="product.image" :src="product.image" height="100" style="float: left; margin-right: 20px;cursor: pointer;"
          @click="openModal(`${product.image}`)"
          />
          {{ product.description }}
        </p>
        <p class="mb-3"><strong>Price:</strong> ₱{{ product.price }}</p>

        <div
          class="modal fade"
          id="imageModal"
          tabindex="-1"
          aria-hidden="true"
          ref="modalRef"
        >
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-body p-0">
                <img :src="product.image" class="img-fluid" />
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="closeModal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="product.isActive" class="d-block">
          <label>Quantity:</label>
          <input
            type="number"
            v-model.number="quantity"
            min="1"
            class="form-control me-3"
            style="width: 100px; margin-top: 5px;"
          />
          <br>
          <button class="btn btn-primary me-2" @click="addToCart" :disabled="addingToCart">
            <span v-if="addingToCart">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Adding...
            </span>
            <span v-else>
              Add to Cart
            </span>
          </button>
          <a href="#" @click="cancelOrder"><button class="btn btn-secondary me-2">Cancel</button></a>
        </div>

        <div v-else class="alert alert-warning my-0 py-2">
          This product is currently unavailable.
        </div>

        <!-- Conditional Alert -->
        <div
          v-if="cartMessage"
          :class="[
            'alert mt-3 py-2',
            cartMessageType === 'success' ? 'alert-success' : 'alert-danger'
          ]"
        >
          {{ cartMessage }}
        </div>
      </div>

      <!-- More Products Section -->
      <div v-if="!auth.isAdmin && moreProducts.length" class="mt-5">
        <h2 class="mb-3">More Products</h2>
        <div class="row">
          <div
            class="col-md-3 mb-3"
            v-for="item in moreProducts"
            :key="item._id"
          >
            <div class="card h-100 shadow-sm">
              <div class="card-body d-flex flex-column">
                <router-link :to="`/product/${item._id}`">
                  <img
                    :src="item.image || 'https://placehold.co/600x600?text=No+Image'"
                    class="card-img-top mb-2 img-fluid"
                  />
                </router-link>
                <p class="card-title h5 mt-2 mb-3 fw-bold">{{ item.name }}</p>
                <p class="card-text"><strong>Price:</strong> ₱{{ item.price }}</p>
                
                <RouterLink
                  :to="`/product/${item._id}`"
                  class="btn btn-primary mt-auto fw-bold"
                >
                  View Details
                </RouterLink>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'
import { watch } from 'vue'

import * as bootstrap from "bootstrap"

const modalRef = ref(null)
const modalInstance = ref(null)
//const modalImage = ref("")

// Open modal with selected image
const openModal = (imgSrc) => {
  //modalImage.value = imgSrc
  if (!modalInstance.value) {
    modalInstance.value = new bootstrap.Modal(modalRef.value)
  }
  modalInstance.value.show()
}

// Close modal
const closeModal = () => {
  modalInstance.value.hide()
}

const route = useRoute()
const router = useRouter()
const auth = useUserStore()

const product = ref(null)
const quantity = ref(1)
const cartMessage = ref("")
const cartMessageType = ref("success") // 'success' or 'error'
const loading = ref(true)
const editing = ref(false)

const form = reactive({
  name: '',
  description: '',
  price: '',
  isActive: true,
  image: ''
})

const moreProducts = ref([])

// Load product
onMounted(async () => {
  try {
    const res = await api.get(`/products/${route.params.id}`)
    product.value = res.data
    Object.assign(form, res.data) // for admin edit

    // More products
    if (!auth.isAdmin) {
      const resProducts = await api.get('/products/active')

      // Exclude current product
      const filtered = resProducts.data.filter(
        p => p._id !== route.params.id
      )

      // Shuffle array (Fisher-Yates)
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[filtered[i], filtered[j]] = [filtered[j], filtered[i]]
      }

      // Take first 3
      moreProducts.value = filtered.slice(0, 4)
    }

  } catch (err) {
    console.error(err)
    cartMessage.value = "Failed to load product."
    cartMessageType.value = "error"
  } finally {
    loading.value = false
  }
})

watch(
  () => route.params.id,
  async (newId) => {

    // ✅ Completely dispose modal instance
    if (modalInstance.value) {
      modalInstance.value.hide()
      modalInstance.value.dispose()
      modalInstance.value = null
    }

    loading.value = true

    try {
      const res = await api.get(`/products/${newId}`)
      product.value = res.data
      Object.assign(form, res.data)

      if (!auth.isAdmin) {
        const resProducts = await api.get('/products/active')

        const filtered = resProducts.data.filter(
          p => p._id !== newId
        )

        for (let i = filtered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[filtered[i], filtered[j]] = [filtered[j], filtered[i]]
        }

        moreProducts.value = filtered.slice(0, 4)
      }

    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  }
)

// Add to cart
const addingToCart = ref(false)
const addToCart = async () => {
  try {
    addingToCart.value = true
    const payload = {
      productId: product.value._id,
      quantity: quantity.value
    }

    await api.post('/cart/add-to-cart', payload)

    // Update cart store so NavBar updates immediately
    const cartStore = useCartStore()
    await cartStore.fetchCart()

    cartMessage.value = `${quantity.value} x ${product.value.name} added to cart.`
    cartMessageType.value = "success"
    quantity.value = 1

    router.push("/cart")
  } catch (err) {
    console.error(err)
    cartMessage.value = err.response?.data?.message || "Failed to add to cart."
    cartMessageType.value = "error"
  } finally {
    addingToCart.value = false
  }
}

// Cancel
const cancelOrder = () => router.push('/products')

// Admin edit
const handleEditProduct = async () => {
  try {
    editing.value = true
    await api.put(`/products/${route.params.id}`, form)

    cartMessage.value = "Product updated successfully."
    cartMessageType.value = "success"

    router.push("/products")
  } catch (err) {
    console.error(err)
    cartMessage.value = err.response?.data?.message || "Failed to update product."
    cartMessageType.value = "error"
  } finally {
    editing.value = false
  }
}
</script>