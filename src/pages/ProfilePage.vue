<template>
  <div class="container my-5">
    <div class="col-md-6 mx-auto">
      <div class="card shadow-sm p-4">
        <h1 class="mb-3">My Profile</h1>

        <div v-if="auth.user">
          <div v-if="!isEditing">
            <p><strong>Name:</strong> {{ auth.user.firstName }} {{ auth.user.lastName }}</p>
            <p><strong>Email:</strong> {{ auth.user.email }}</p>
            <p><strong>Mobile No.:</strong> {{ auth.user.mobileNo }}</p>

            <RouterLink to="/user/me">
              <button class="btn btn-primary mt-2">
                Edit Profile
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import { useUserStore } from "../stores/user"

const auth = useUserStore()

const isEditing = ref(false)

const loading = ref(false)
</script>