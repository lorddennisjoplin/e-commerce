<template>
  <div class="container my-5 text-start">
    <h1 class="mb-3">Order History</h1>

    <div
      v-if="message"
      :class="['alert mt-3 py-2', messageType === 'success' ? 'alert-success' : 'alert-danger']"
      v-html="message"
    ></div>

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">Loading orders...</div>

    <div v-else-if="auth.isAdmin && route.params.id">
      <p class="lead fw-bold">Customer: {{ userFullName }}</p>

      <!-- Orders Table -->
      <div v-if="orders.length">
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th>Order ID</th>
                <th>Products Ordered</th>
                <th>Total Amount</th>
                <th>Ordered On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in paginatedOrders" :key="order._id">
                <td>
                  <RouterLink :to="`/order/${order._id}`">
                    {{ order._id }}
                  </RouterLink>
                </td>
                <td>
                  <ul class="mb-0">
                    <li v-for="item in order.productsOrdered" :key="item.productId">
                      {{ item.name }} × {{ item.quantity }}
                    </li>
                  </ul>
                </td>
                <td>₱{{ order.totalPrice }}</td>
                <td>{{ formatDate(order.orderedOn) }}</td>
                <td>{{ order.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="mt-3">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="prevPage" :disabled="currentPage === 1">Previous</button>
            </li>

            <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: page === currentPage }">
              <button class="page-link" @click="goToPage(page)">{{ page }}</button>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="nextPage" :disabled="currentPage === totalPages">Next</button>
            </li>
          </ul>
        </nav>
      </div>

      <div v-else class="alert alert-info py-2">
        No orders found for this user.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const auth = useUserStore()

const loading = ref(true)
const orders = ref([])
const userFullName = ref("")

const message = ref('')
const messageType = ref('success')

// Pagination
const itemsPerPage = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(orders.value.length / itemsPerPage))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return orders.value.slice(start, start + itemsPerPage)
})

// Format date
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Pagination helpers
const prevPage = () => { if(currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if(currentPage.value < totalPages.value) currentPage.value++ }
const goToPage = (page) => { currentPage.value = page }

// Fetch user orders
const fetchOrders = async () => {
  if (!auth.isAuthenticated) {
    router.push('/login')
    return
  }

  loading.value = true
  message.value = ''       // reset previous messages
  messageType.value = 'success'

  try {
    const userId = route.params.id
    const res = await api.get(`/orders/user/${userId}`)
    orders.value = res.data.orders || []
    userFullName.value = res.data.user.fullName || "Unknown User"
  } catch (err) {
    console.error(err)
    orders.value = []
    userFullName.value = "Unknown User"

    // Set the message so it displays
    message.value = err.response?.data?.message || 'Failed to fetch orders.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>