<template>
  <div class="container my-5 text-start">
    <h1 v-if="auth.isAdmin" class="mb-4">Admin Dashboard</h1>
    <h1 v-else class="mb-3">All Products</h1>

    <!-- Admin Buttons -->
    <div v-if="auth.isAdmin" class="mb-3">
      <button class="btn btn-sm btn-primary me-2" @click="showForm = !showForm">
        Add Product
      </button>
      <button class="btn btn-sm btn-primary me-2" @click="goToOrders">Show All Orders</button>
    </div>

    <!-- Admin: Add Product Form -->
    <div v-if="showForm" class="card p-3 my-3 text-start">
      <h2 class="mb-3">Add Product</h2>

      <form @submit.prevent="handleAddProduct">
        <input v-model="form.name" class="form-control mb-2" placeholder="Product Name *" required />
        <textarea v-model="form.description" class="form-control mb-2" placeholder="Description *" required></textarea>
        <input v-model="form.price" type="number" class="form-control mb-2" placeholder="Price *" required />
        <input v-model="form.image" type="url" class="form-control mb-3" placeholder="Image URL (Optional)" />

        <!-- Success / Error Alert -->
        <div
          v-if="message"
          :class="[
            'alert mt-3 py-2',
            messageType === 'success' ? 'alert-success' : 'alert-danger'
          ]"
        >
          {{ message }}
        </div>

        <button type="submit" class="btn btn-sm btn-primary me-2" :disabled="adding">
          <span v-if="adding">
            <span class="spinner-border spinner-border-sm me-1"></span>
            Adding...
          </span>
          <span v-else>
            Save
          </span>
        </button>

        <button type="button" class="btn btn-sm btn-secondary me-2" @click="cancelForm" :disabled="adding">
          Cancel
        </button>
      </form>
    </div>

    <!-- ADMIN TABLE -->
    <div v-if="auth.isAdmin" class="mt-4 text-start">
      <div v-if="loading" class="alert alert-info py-2">Loading products...</div>

      <div v-else-if="paginatedProducts.length">
        <h2 class="mb-3">All Products</h2>
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th class="text-center">Actions</th>
                <th class="text-center">Available</th>
                <th>Name</th>
                <th>Description</th>
                <th class="text-center">Price</th>
                <th class="text-center">Image</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in paginatedProducts" :key="product._id">
                <td class="text-center" style="white-space: nowrap;">
                  <button class="btn btn-sm btn-primary me-2" @click="editProduct(product._id)">
                    Edit
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="product.isActive ? 'btn-danger' : 'btn-success'"
                    @click="toggleProductStatus(product)"
                  >
                    {{ product.isActive ? 'Disable' : 'Activate' }}
                  </button>
                </td>
                <td class="text-center">{{ product.isActive ? 'Yes' : 'No' }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.description }}</td>
                <td class="text-center">₱{{ product.price }}</td>
                <td class="text-center">
                  <img v-if="product.image" :src="product.image" width="100" class="img-fluid" />
                  <img v-else src="https://placehold.co/400x400?text=No+Image" width="100" class="img-fluid" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="mt-3">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">Previous</button>
            </li>

            <li
              v-for="page in totalPages"
              :key="page"
              class="page-item"
              :class="{ active: page === currentPage }"
            >
              <button class="page-link" @click="currentPage = page">{{ page }}</button>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">Next</button>
            </li>
          </ul>
        </nav>
      </div>

      <div v-else class="alert alert-info py-2">No products available.</div>
    </div>

    <!-- NON-ADMIN VIEW -->
    <div v-else>
      <div v-if="loading" class="alert alert-info py-2">Loading products...</div>

      <div v-else-if="activeProducts.length" class="row mt-4">
        <div v-for="product in activeProducts" :key="product._id" class="col-md-6 col-lg-3 mb-4 text-start">
          <div class="card shadow-sm h-100">
            <div class="card-body d-flex flex-column">
              <router-link :to="`/product/${product._id}`">
                <img
                  :src="product.image || 'https://placehold.co/600x600?text=No+Image'"
                  class="img-fluid mb-2 card-img-top"
                />
              </router-link>

              <p class="card-title h4 mt-2 mb-3 fw-bold">{{ product.name }}</p>

              <p class="card-text"><strong>Price:</strong> ₱{{ product.price }}</p>

              <button class="btn btn-primary mt-auto fw-bold" @click="goToProduct(product._id)">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="alert alert-info text-center mt-3 py-2">
        No products available.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../api'

const auth = useUserStore()
const router = useRouter()

// Message system
const showForm = ref(false)
const message = ref('')
const messageType = ref('success')
const adding = ref(false)

const form = reactive({
  name: '',
  description: '',
  price: 0,
  isActive: true,
  image: ''
})

// Products
const products = ref([])
const loading = ref(true)
const itemsPerPage = 10
const currentPage = ref(1)

const activeProducts = computed(() => products.value.filter(p => p.isActive))
const totalPages = computed(() => Math.ceil(products.value.length / itemsPerPage))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return products.value.slice(start, start + itemsPerPage)
})

// Fetch products
const fetchProducts = async () => {
  loading.value = true
  try {
    if (auth.isAdmin) {
      const res = await api.get('/products/all')
      products.value = res.data.sort((a, b) => b._id.localeCompare(a._id))
    } else {
      const res = await api.get('/products/active')
      products.value = res.data
    }
  } catch (err) {
    console.error(err)
    message.value = "Failed to fetch products."
    messageType.value = "error"

    setTimeout(() => {
      message.value = ''
    }, 3000)
  } finally {
    loading.value = false
  }
}

// Add product
const handleAddProduct = async () => {
  try {
    adding.value = true
    await api.post('/products', form)

    cancelForm()
    message.value = 'Product added successfully.'
    messageType.value = 'success'

    setTimeout(() => message.value = '', 1500)
    await fetchProducts()
  } catch (err) {
    message.value = err.response?.data?.message || err.message
    messageType.value = 'error'

    setTimeout(() => {
      message.value = ''
    }, 4000)
  } finally {
    adding.value = false
  }
}

const cancelForm = () => {
  Object.assign(form, { name: '', description: '', price: 0, isActive: true, image: '' })
  showForm.value = false
}

// Admin actions
const editProduct = (id) => router.push(`/product/${id}`)

const toggleProductStatus = async (product) => {
  try {
    const endpoint = `/products/${product._id}/${product.isActive ? 'archive' : 'activate'}`
    await api.patch(endpoint)
    product.isActive = !product.isActive
    message.value = 'Product status updated.'
    messageType.value = 'success'
  } catch (err) {
    console.error(err)
    message.value = 'Failed to update product status.'
    messageType.value = 'error'

    setTimeout(() => {
      message.value = ''
    }, 3000)
  }
}

const goToOrders = () => router.push("/orders")
const goToProduct = (id) => router.push(`/product/${id}`)

onMounted(() => {
  fetchProducts()
})
</script>