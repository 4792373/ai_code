import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import router from './router'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import { errorHandlerPlugin } from './plugins/errorHandler'
import { useAppInitialization } from './composables/useAppInitialization'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 注册插件
app.use(pinia)
app.use(Antd)
app.use(router)
app.use(errorHandlerPlugin)

// 挂载应用
app.mount('#app')

// 应用挂载后进行初始化
// 注意：需要在 app.mount 之后调用，确保 Pinia 已经可用
const { initializeApp } = useAppInitialization()
initializeApp()