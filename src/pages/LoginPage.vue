<template>
  <div class="container mt-5">
    <div class="col-md-6 mx-auto">
      <div class="card shadow p-4">
        <h1 class="mb-3">Log in</h1>

        <div v-if="error" class="alert alert-danger mb-3 py-2">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin">
          <input v-model="email" type="email" class="form-control mb-3" placeholder="Email" />
          <input v-model="password" type="password" class="form-control mb-3" placeholder="Password" />

          <button
            type="submit"
            class="btn btn-primary w-100"
            :disabled="loading"
          >
            <span v-if="loading">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Loading...
            </span>
            <span v-else>
              Enter
            </span>
          </button>
        </form>

        <p class="mt-3">Don't have an account yet?
          <RouterLink to="/register">Go here</RouterLink> to register.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useUserStore } from "../stores/user"
import { useRouter } from "vue-router"

const loading = ref(false)

const auth = useUserStore()
const router = useRouter()

const email = ref("")
const password = ref("")
const error = ref("")

const handleLogin = async () => {
  try {
    error.value = ""
    loading.value = true

    await auth.login({
      email: email.value,
      password: password.value
    })

    router.push("/products")

  } catch (err) {
    error.value = err.response?.data?.message || "Login failed"
  } finally {
    loading.value = false
  }
}
</script>