import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

import Login from "../pages/LoginPage.vue";
import Register from "../pages/RegisterPage.vue";
import ProductCatalog from "../pages/ProductCatalog.vue";
import ProductDetailsPage from "../pages/ProductDetailsPage.vue";
import OrderDetailsPage from "../pages/OrderDetailsPage.vue";
import OrdersPage from "../pages/OrdersPage.vue";
import UserOrders from "../pages/UserOrdersPage.vue";
import Profile from "../pages/ProfilePage.vue";
import Cart from "../pages/CartPage.vue";
import Users from "../pages/UsersPage.vue";
import UserEdit from "../pages/UserEditPage.vue";
import UserEditMe from "../pages/UserEditMePage.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  {
    path: "/products",
    component: ProductCatalog,
    // meta: { requiresAuth: true },
  },
  {
    path: "/product/:id",
    name: "ProductDetail",
    component: ProductDetailsPage
  },
  {
    path: "/profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/cart",
    component: Cart,
    // meta: { requiresAuth: true },
  },
  {
    path: "/orders",
    component: OrdersPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders/user/:id",
    component: UserOrders,
    meta: { requiresAuth: true },
  },
  {
    path: "/order/:id",
    component: OrderDetailsPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/users",
    component: Users,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:id",
    component: UserEdit,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/me",
    component: UserEditMe,
    meta: { requiresAuth: true },
  },

  // Root redirects to Products by default
  { path: "/", redirect: "/products" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useUserStore();

  // If already logged in, just go to /products
  if (auth.isAuthenticated && (to.path === "/login" || to.path === "/register")) {
    return next("/products");
  }

  const protectedRoutes = ["/profile", "/user", "/users", "/order", "/orders", "/cart"];

  if (
    !auth.isAuthenticated &&
    protectedRoutes.some(route => to.path.startsWith(route))
  ) {
    return next("/login");
  }

  next();
});

export default router;