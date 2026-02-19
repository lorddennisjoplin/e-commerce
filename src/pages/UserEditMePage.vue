<template>
  <div class="container my-5 text-start">
    <!-- Heading -->
    <h1 class="mb-3">Edit Profile</h1>

    <!-- Success/Error Message -->
    <div
      v-if="message"
      :class="['alert mt-3 py-2', messageType === 'success' ? 'alert-success' : 'alert-danger']"
      v-html="message"
    ></div>

    <!-- Loading -->
    <div v-if="loading" class="alert alert-info py-2">
      Loading your profile...
    </div>

    <!-- User Form -->
    <div v-else>
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
          Cancel
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../api'

const router = useRouter()
const auth = useUserStore()

const loading = ref(true)
const saving = ref(false)
const updatePassword = ref(false)

const message = ref('')
const messageType = ref('success')

// Store original profile to detect changes
const originalProfile = reactive({
  email: '',
  password: ''
})

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  mobileNo: '',
  password: ''
})

const confirmPassword = ref('')

// Fetch current user profile
const fetchProfile = async () => {
  loading.value = true
  try {
    const res = await api.get('/users/me')
    if (res && res.data) {
      Object.assign(form, res.data)
      form.password = ''
      originalProfile.email = res.data.email
      originalProfile.password = '' // blank because password is not returned
    } else {
      message.value = 'Failed to fetch profile data.'
      messageType.value = 'error'
    }
  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || 'Failed to fetch profile data.'
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
    if (!form.password || !confirmPassword.value) {
      message.value = 'Please fill both password fields.'
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
  }

  try {
    await api.patch('/users/me', form)
    message.value = `Profile updated successfully.`
    messageType.value = 'success'

    setTimeout(() => (message.value = ''), 3000)

    // Detect if email or password changed
    const emailChanged = form.email !== originalProfile.email
    const passwordChanged = updatePassword.value && form.password

    form.password = ''
    confirmPassword.value = ''
    updatePassword.value = false

    if (emailChanged || passwordChanged) {
      // Show message first
      if (emailChanged && !passwordChanged) message.value = 'Email address updated. Please log in again.'
      else if (passwordChanged && !emailChanged) message.value = 'Password updated. Please log in again.'
      else message.value = 'Email address and password updated. Please log in again.'
      messageType.value = 'success'

      // Wait 2 seconds, then log out and redirect
      setTimeout(() => {
        auth.logout()
        router.push('/login')
      }, 2000)

      return
    }


  } catch (err) {
    console.error(err)
    message.value = err.response?.data?.message || 'Failed to update profile.'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

const goBack = () => router.back()

onMounted(() => {
  if (!auth.isAuthenticated) {
    router.push('/login')
    return
  }
  fetchProfile()
})
</script>