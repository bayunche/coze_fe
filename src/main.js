import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import 'element-plus/dist/index.css'

import '@/assets/style/style.css'

const pinia = createPinia()
pinia.use(createPersistedState())

import App from './App.vue'
import router from './router'

createApp(App).use(pinia).use(router).mount('#app')
