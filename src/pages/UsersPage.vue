<template>
  <div class="container my-5 text-start">
    <h1 class="mb-3">All Users</h1>

    <!-- Success/Error Alert -->
    <div
      v-if="message"
      :class="[
        'alert mt-3 py-2',
        messageType === 'success' ? 'alert-success' : 'alert-danger'
      ]"
      v-html="message"
    ></div>

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading users...
    </div>

    <!-- Users Table -->
    <div v-else-if="paginatedUsers.length">
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email Address</th>
              <th>Mobile</th>
              <th>Role</th>
              <th class="text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user._id">
              <td>{{ user.firstName }}</td>
              <td>{{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.mobileNo || '-' }}</td>
              <td>{{ user.isAdmin ? 'Admin' : 'User' }}</td>
              <td class="text-start" style="white-space: nowrap;">
                <button
                  class="btn btn-sm btn-primary me-2"
                  @click="viewOrders(user._id)"
                  v-if="user._id !== auth.user.id"
                >
                  View Orders
                </button>

                <button
                  class="btn btn-sm btn-warning me-2"
                  @click="() => goToEdit(user)"
                >
                  {{ user._id === auth.user.id ? 'Edit Profile' : 'Edit User' }}
                </button>

                <button
                  class="btn btn-sm me-2"
                  :class="user.isAdmin ? 'btn-danger' : 'btn-success'"
                  @click="user._id !== auth.user.id && toggleAdmin(user)"
                  v-if="user._id !== auth.user.id"
                >
                  {{ user.isAdmin ? 'Remove Admin' : 'Make Admin' }}
                </button>

                <button
                  class="btn btn-sm btn-danger me-2"
                  @click="deleteUser(user._id)"
                  v-if="user._id !== auth.user.id"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="mt-3">
        <ul class="pagination justify-content-center">

          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link"
              @click="currentPage--"
              :disabled="currentPage === 1"
            >
              Previous
            </button>
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
            <button
              class="page-link"
              @click="currentPage++"
              :disabled="currentPage === totalPages"
            >
              Next
            </button>
          </li>

        </ul>
      </nav>
    </div>

    <!-- No Users -->
    <div v-else class="alert alert-info py-2">
      No users found.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../api'

const router = useRouter()
const auth = useUserStore()

const users = ref([])
const loading = ref(true)

const message = ref('')
const messageType = ref('success') // success | error

const itemsPerPage = 10
const currentPage = ref(1)

// Pagination Computed
const totalPages = computed(() =>
  Math.ceil(users.value.length / itemsPerPage)
)

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return users.value.slice(start, start + itemsPerPage)
})

// Fetch Users
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await api.get('/users/all')
    // Ensure each user has isAdmin property
    users.value = res.data.map(u => ({ ...u, isAdmin: u.isAdmin || false }))

    // Adjust current page if out of bounds
    const maxPage = Math.ceil(users.value.length / itemsPerPage) || 1
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
  } catch (err) {
    console.error('Failed to fetch users:', err)
    message.value = 'Failed to fetch users.'
    messageType.value = 'error'
    setTimeout(() => message.value = '', 3000)
  } finally {
    loading.value = false
  }
}

// Route Actions
const viewOrders = (id) => router.push(`/orders/user/${id}`)

const goToEdit = (user) => {
  if (user._id === auth.user.id) {
    // Navigate to /users/me for own profile
    router.push('/user/me')
  } else {
    // Navigate to admin edit page for other users
    router.push(`/user/${user._id}`)
  }
}

// Toggle Admin
const toggleAdmin = async (user) => {
  try {
    const endpoint = `/users/${user._id}/set-as-admin`
    await api.patch(endpoint)
    user.isAdmin = !user.isAdmin
    message.value = user.isAdmin
      ? `<strong>${user.firstName} ${user.lastName}</strong> is now an admin.`
      : `<strong>${user.firstName} ${user.lastName}</strong> removed as an admin.`
    messageType.value = 'success'
    setTimeout(() => message.value = '', 3000)
  } catch (err) {
    console.error(err)
    message.value = `<strong>${user.firstName} ${user.lastName}</strong>: Failed to update admin status.`
    messageType.value = 'error'
    setTimeout(() => message.value = '', 3000)
  }
}

// Delete User
const deleteUser = async (id) => {
  // Find the user object
  const user = users.value.find(u => u._id === id)
  if (!user) return

  // Prevent deleting yourself
  if (user._id === auth.user.id) return

  // Confirm deletion
  const confirmed = confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)
  if (!confirmed) return

  try {
    const res = await api.delete(`/users/${id}/delete`)
    message.value = `<strong>${user.firstName} ${user.lastName}</strong> has been deleted.`
    messageType.value = 'success'
    setTimeout(() => message.value = '', 3000)

    // Refresh user list
    await fetchUsers()
  } catch (err) {
    console.error(err)
    message.value = `<strong>${user.firstName} ${user.lastName}</strong>: Failed to delete user.`
    messageType.value = 'error'
    setTimeout(() => message.value = '', 3000)
  }
}

// Admin Guard
onMounted(() => {
  if (!auth.isAuthenticated || !auth.isAdmin) {
    router.push('/products')
    return
  }
  fetchUsers()
})
</script>