<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">

      <!-- Brand -->
      <RouterLink class="navbar-brand" to="/">
        E-commerce App
      </RouterLink>

      <!-- Hamburger (mobile) -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Nav Links -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">

          <!-- Not logged in -->
          <template v-if="!auth.isAuthenticated">
            <li class="nav-item">
              <RouterLink class="nav-link" to="/products">
                <i class="bi bi-grid-3x3-gap-fill"></i> Products
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/login">
                <i class="bi bi-lock"></i> Log in
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/register">
                <i class="bi bi-pen"></i> Register
              </RouterLink>
            </li>
          </template>

          <!-- Logged in -->
          <template v-else>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/products">
                <i class="bi bi-grid-3x3-gap-fill"></i> Products
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/profile">
                <i class="bi bi-person-circle"></i> Profile
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/orders">
                <i class="bi bi-bag-check"></i> Orders
              </RouterLink>
            </li>

            <!-- Admin links -->
            <li v-if="auth.isAdmin" class="nav-item">
              <RouterLink class="nav-link" to="/users">
                <i class="bi bi-people"></i> Users
              </RouterLink>
            </li>

            <!-- Cart for non-admin -->
            <li v-if="!auth.isAdmin" class="nav-item">
              <RouterLink class="nav-link" to="/cart">
                <i class="bi bi-cart"></i> Cart
                <span v-if="cartStore.cartCount > 0" class="badge bg-light text-dark rounded-circle">{{ cartStore.cartCount }}</span>
              </RouterLink>
            </li>

            <!-- Log out (desktop) -->
            <li class="nav-item d-none d-lg-block">
              <a
                href="#"
                class="nav-link bg-danger rounded-3 ms-2 text-light px-3"
                @click.prevent="logout"
              >
                Log out
              </a>
            </li>

            <!-- Log out (mobile) -->
            <li class="nav-item d-block d-lg-none">
              <a class="nav-link" href="#" @click.prevent="logout">
                <i class="bi bi-box-arrow-right"></i> Log out
              </a>
            </li>
          </template>

        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const auth = useUserStore()
const cartStore = useCartStore()
const router = useRouter()

// Fetch cart on mount
onMounted(() => {
  cartStore.fetchCart()
})

// Logout function
const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>