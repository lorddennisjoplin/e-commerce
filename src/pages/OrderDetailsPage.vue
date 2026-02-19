<template>
  <div class="container my-5 text-start">
    <h1 class="mb-3">Order Details</h1>

    <!-- Success/Error Message -->
    <div
      v-if="message"
      :class="['alert mt-3 py-2', messageType === 'success' ? 'alert-success' : 'alert-danger']"
      v-html="message"
    ></div>

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading order details...
    </div>

    <!-- Order Details Table -->
    <div v-else-if="auth.isAdmin && order._id">
      <p>
        <strong>Order ID:</strong> {{ order._id }}<br>
        <strong>Ordered On:</strong> {{ new Date(order.orderedOn).toLocaleString() }}<br>
        <strong>Current Status:</strong> {{ order.status }}
      </p>

      <!-- Status Update Form -->
      <div v-if="isAdminOrManager" class="mb-3">
        <label class="form-label">Update Status</label><br>
        <select v-model="selectedStatus" class="form-select w-auto d-inline-block me-2">
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Refunded">Refunded</option>
        </select>
        <br><br>
        <button class="btn btn-sm btn-primary me-1" @click="updateStatus" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
          Save
        </button>

        <button type="button" class="btn btn-sm btn-secondary me-1" @click="goBack" :disabled="saving">
          Back
        </button>

        <button class="btn btn-sm btn-danger me-1"
		        @click="deleteOrder"
		        :disabled="deleting || saving">
    		  <span v-if="deleting" class="spinner-border spinner-border-sm me-1"></span>
    		  Delete
    		</button>

      </div>

      <h2>Customer Details</h2>
      <p>
        <strong>Name:</strong> {{ order.user?.firstName }} {{ order.user?.lastName }}<br>
        <strong>Email Address:</strong> {{ order.user?.email }}<br>
        <strong>Mobile:</strong> {{ order.user?.mobileNo }}
      </p>

      <h2 class="mt-4">Products Ordered</h2>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Quantity</th>
            <th class="text-end">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in order.productsOrdered" :key="product.productId">
            <td>{{ product.productName }}</td>
            <td>{{ product.quantity }}</td>
            <td class="text-end">₱{{ product.subtotal?.toFixed(2) || '0.00' }}</td>
          </tr>
        </tbody>
      </table>

      <p class="mt-3 h4">
        <strong>Total Amount:</strong> ₱{{ order.totalPrice?.toFixed(2) || '0.00' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../api'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id

const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const message = ref('')
const messageType = ref('success')

const auth = useUserStore()


// Flag to control who can edit status
// Replace with your auth store check if needed
const isAdminOrManager = true

// Initialize order with safe defaults
const order = reactive({
  _id: '',
  user: {
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: ''
  },
  productsOrdered: [],
  totalPrice: 0,
  orderedOn: '',
  status: 'Pending'
})

// Dropdown selection (separate from order.status)
const selectedStatus = ref(order.status)

// Fetch order details
const fetchOrderDetails = async () => {
  loading.value = true
  try {
    const res = await api.get(`/orders/${orderId}`)
    if (res && res.data) {
      Object.assign(order, res.data)
      selectedStatus.value = res.data.status // dropdown reflects current status
    } else {
      message.value = 'Order not found.'
      messageType.value = 'error'
    }
  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || 'Failed to fetch order details.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// Update order status
const updateStatus = async () => {
  saving.value = true
  try {
    await api.patch(`/orders/${orderId}`, { status: selectedStatus.value })
    order.status = selectedStatus.value // only update after successful save
    message.value = `Order status updated to <strong>${selectedStatus.value}</strong>.`
    messageType.value = 'success'
    setTimeout(() => (message.value = ''), 3000)
  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || 'Failed to update status.'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

// Delete order
const deleteOrder = async () => {
  if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
    return
  }

  deleting.value = true
  try {
    await api.delete(`/orders/${orderId}`)

    message.value = 'Order deleted successfully.'
    messageType.value = 'success'

    setTimeout(() => {
      router.push('/orders') // adjust if needed
    }, 1000)

  } catch (err) {
    message.value = err.response?.data?.message || 'Failed to delete order.'
    messageType.value = 'error'
  } finally {
    deleting.value = false
  }
}

const goBack = () => router.back()

onMounted(() => {
  fetchOrderDetails()
})
</script>