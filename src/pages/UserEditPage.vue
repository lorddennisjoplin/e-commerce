<template>
  <div class="container my-5 text-start">
    <!-- Heading -->
    <h1 class="mb-3">{{ heading }}</h1>

    <!-- Success/Error Message -->
    <div
      v-if="message"
      :class="['alert mt-3 py-2', messageType === 'success' ? 'alert-success' : 'alert-danger']"
      v-html="message"
    ></div>

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading user data...
    </div>

    <!-- User Form (only if access allowed) -->
    <div v-else-if="hasAccess">
      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label class="form-label">First Name *</label>
          <input v-model="form.firstName" type="text" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Last Name *</label>
          <input v-model="form.lastName" type="text" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Email Address *</label>
          <input v-model="form.email" type="email" class="form-control" required />
        </div>

        <div class="mb-3">
          <label class="form-label">Mobile No. *</label>
          <input v-model="form.mobileNo" type="text" class="form-control" pattern="^\d{11}$" required />
        </div>

        <!-- Admin Checkbox (only visible to admins) -->
        <div v-if="auth.isAdmin" class="form-check mb-3">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="form.isAdmin"
            :disabled="form._id === auth.user.id"
            id="isAdminCheck"
          />
          <label class="form-check-label" for="isAdminCheck">
            Make Admin?
          </label>
        </div>

        <!-- Update Password Checkbox -->
        <div class="form-check mb-3">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="updatePassword"
            id="updatePasswordCheck"
          />
          <label class="form-check-label" for="updatePasswordCheck">
            Update Password?
          </label>
        </div>

        <!-- Password Fields (conditionally shown) -->
        <div v-if="updatePassword">
          <div class="mb-3">
            <label class="form-label">New Password *</label>
            <input v-model="form.password" type="password" class="form-control" required minlength="8" />
          </div>

          <div class="mb-3">
            <label class="form-label">Confirm Password *</label>
            <input v-model="confirmPassword" type="password" class="form-control" required minlength="8" />
          </div>
        </div>

        <button type="submit" class="btn btn-sm btn-primary me-2" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
          Save Changes
        </button>

        <button type="button" class="btn btn-sm btn-secondary me-2" @click="goBack" :disabled="saving">
          Back
        </button>

        <button type="button" class="btn btn-sm btn-danger me-2"
            @click="deleteUser"
            :disabled="deleting || saving || form._id === auth.user.id">
          <span v-if="deleting" class="spinner-border spinner-border-sm me-1"></span>
          Delete
        </button>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../api'

const router = useRouter()
const route = useRoute()
const auth = useUserStore()

const userId = route.params.id
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const updatePassword = ref(false)

const message = ref('')
const messageType = ref('success')

const form = reactive({
  _id: '',
  firstName: '',
  lastName: '',
  email: '',
  mobileNo: '',
  isAdmin: false,
  password: ''
})

const confirmPassword = ref('')

// Clear password fields if checkbox unticked
watch(updatePassword, (newVal) => {
  if (!newVal) {
    form.password = ''
    confirmPassword.value = ''
  }
})

// Determine access
const hasAccess = computed(() => {
  return auth.isAdmin
})

// Dynamic heading
const heading = computed(() => {
  if (auth.isAdmin) return "Edit User"
  return "Edit Profile"
})

// Fetch user data
const fetchUser = async () => {
  loading.value = true
  try {
    // Non-admin cannot edit other users
    if (!auth.isAdmin) {
      if (userId !== auth.user.id) {
        message.value = "Access denied. You can only edit your own profile."
        messageType.value = 'error'

        loading.value = false

        setTimeout(() => {
          router.push('/user/me')
        }, 3000)
      }
      else {
        router.push('/user/me')
      }

      return
    }

    let res

    // Non-admin: fetch own profile
    if (!auth.isAdmin) {
      res = await api.get('/users/me')
    } else {
      // Admin: fetch any user by ID
      res = await api.get(`/users/${userId}`)
    }

    // Assign user data only if request succeeds
    if (res && res.data) {
      Object.assign(form, res.data)
    } else {
      message.value = 'Failed to fetch user data.'
      messageType.value = 'error'
    }

  } catch (err) {
    console.error(err)

    // Use API-provided error if available
    if (err.response && err.response.data && err.response.data.message) {
      message.value = err.response.data.message
    } else {
      message.value = 'Failed to fetch user data.'
    }

    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// Save changes
const handleSubmit = async () => {
  saving.value = true

  // Validate password if updating
  if (updatePassword.value) {
    if (!form.password) {
      message.value = 'New password cannot be empty.'
      messageType.value = 'error'
      saving.value = false
      return
    }
    if (form.password.length < 8) {
      message.value = 'Password must be at least 8 characters.'
      messageType.value = 'error'
      saving.value = false
      return
    }
    if (form.password !== confirmPassword.value) {
      message.value = 'Passwords do not match.'
      messageType.value = 'error'
      saving.value = false
      return
    }
  } else {
    form.password = undefined
  }

  try {
    await api.patch(`/users/${userId}`, form)
    message.value = `<strong>${form.firstName} ${form.lastName}</strong> updated successfully.`
    messageType.value = 'success'

    // Reset password fields
    updatePassword.value = false
    form.password = ''
    confirmPassword.value = ''

    setTimeout(() => (message.value = ''), 3000)
  } catch (err) {
    console.error("updateUserDetails error:", err)

  // Show whatever the backend actually sent
  if (err.response) {
    console.log("Backend response:", err.response)
    message.value = err.response.data?.message || JSON.stringify(err.response.data) || 'Failed to update user.'
  } else {
    message.value = err.message || 'Failed to update user.'
  }

  messageType.value = 'error'
  setTimeout(() => (message.value = ''), 3000)
} finally {
    saving.value = false
  }
}

const deleteUser = async () => {
  if (form._id === auth.user.id) {
    message.value = "You cannot delete your own account."
    messageType.value = 'error'
    return
  }

  if (!confirm(`Are you sure you want to delete ${form.firstName} ${form.lastName}? This action cannot be undone.`)) {
    return
  }

  deleting.value = true
  try {
    await api.delete(`/users/${form._id}/delete`) // match backend route
    message.value = `<strong>${form.firstName} ${form.lastName}</strong> has been deleted.`
    messageType.value = 'success'
    setTimeout(() => router.push('/users'), 1500)
  } catch (err) {
    console.error(err)
    message.value = `<strong>${form.firstName} ${form.lastName}</strong>: Failed to delete user.`
    messageType.value = 'error'
  } finally {
    deleting.value = false
  }
}

const goBack = () => router.back()

// Guard
onMounted(() => {
  if (!auth.isAuthenticated) {
    router.push('/login')
    return
  }
  fetchUser()
})
</script>