<template>
  <div class="container mt-5 text-start">
    <h1 class="mb-3">{{ auth.isAdmin ? 'All Orders' : 'My Orders' }}</h1>

    <!-- Success/Error Message -->
    <div v-if="message" :class="['alert py-2', messageType === 'success' ? 'alert-success' : 'alert-danger']">
      {{ message }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading orders...
    </div>

    <!-- Orders Table -->
    <div v-else-if="paginatedOrders.length">
      <div class="table-responsive">
        <table class="table table-bordered text-start">
          <thead class="table-light">
            <tr class="bg-success text-white">
              <th v-if="auth.isAdmin">Actions</th>
              <th>Order ID</th>
              <th v-if="auth.isAdmin">Customer</th>
              <th>Products Ordered</th>
              <th>Total Amount</th>
              <th>Ordered On</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in paginatedOrders" :key="order._id">
              <td v-if="auth.isAdmin" style="white-space: nowrap;">
                <RouterLink :to="`/order/${order._id}`">
                  <button class="btn btn-sm btn-primary me-1">View</button>
                </RouterLink>
                <button
                  class="btn btn-sm btn-danger ms-1 me-1"
                  @click="deleteOrder(order._id)"
                  :disabled="savingOrders[order._id]"
                >
                  <span v-if="savingOrders[order._id]" class="spinner-border spinner-border-sm me-1"></span>
                  Delete
                </button>
              </td>
              <td>{{ order._id }}</td>
              <td v-if="auth.isAdmin">
                <RouterLink :to="`/orders/user/${order.userId}`">
                  {{ userNames[order.userId] || order.userId }}
                </RouterLink>
              </td>
              <td>
                <ul class="mb-0">
                  <li v-for="item in order.productsOrdered" :key="item.productId">
                    {{ productNames[item.productId] || "Archived Product" }} × {{ item.quantity }} (₱{{ item.subtotal.toFixed(2) }})
                  </li>
                </ul>
              </td>
              <td>₱{{ order.totalPrice.toFixed(2) }}</td>
              <td>{{ new Date(order.orderedOn).toLocaleString() }}</td>
              <td>{{ order.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" aria-label="Page navigation" class="my-4">
        <ul class="pagination justify-content-center">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link" @click="goToPage(currentPage - 1)">Previous</button>
          </li>
          <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: page === currentPage }">
            <button class="page-link" @click="goToPage(page)">{{ page }}</button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button class="page-link" @click="goToPage(currentPage + 1)">Next</button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../api'

const router = useRouter()
const auth = useUserStore()

// Orders and state
const orders = ref([])
const loading = ref(true)
const message = ref('')
const messageType = ref('success')

// Track saving state per order
const savingOrders = reactive({})

// Maps for user names and product names
const userNames = reactive({})
const productNames = reactive({})

// Pagination
const currentPage = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.ceil(orders.value.length / pageSize))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return orders.value.slice(start, start + pageSize)
})
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

// Fetch orders
const getOrders = async () => {
  loading.value = true
  message.value = ''
  try {
    let resOrders
    if (auth.isAdmin) {
      resOrders = await api.get('/orders/all-orders')
    } else {
      resOrders = await api.get('/orders/my-orders')
    }

    // Sort descending by date
    orders.value = resOrders.data.sort((a, b) => new Date(b.orderedOn) - new Date(a.orderedOn))

    // Fetch all users if admin
    if (auth.isAdmin) {
      const resUsers = await api.get('/users/all')
      resUsers.data.forEach(user => {
        userNames[user._id] = `${user.firstName} ${user.lastName}`
      })
    }

    // Fetch products
    const resProducts = auth.isAdmin
      ? await api.get('/products/all')
      : await api.get('/products/active')
    resProducts.data.forEach(p => (productNames[p._id] = p.name))

  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || 'Failed to fetch orders.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// Delete order
const deleteOrder = async (orderId) => {
  if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return

  savingOrders[orderId] = true
  try {
    await api.delete(`/orders/${orderId}`)
    message.value = 'Order deleted successfully.'
    messageType.value = 'success'

    // Remove locally
    orders.value = orders.value.filter(o => o._id !== orderId)

    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || 'Failed to delete order.'
    messageType.value = 'error'
  } finally {
    savingOrders[orderId] = false
  }
}

onMounted(getOrders)
</script>