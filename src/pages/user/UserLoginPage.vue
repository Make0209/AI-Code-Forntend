<template>
  <div :class="['auth-page', isDark ? 'dark' : 'light']">
    <div class="visual-section">
      <canvas id="particleCanvas"></canvas>
      <div class="visual-content">
        <div class="glass-tag">AI Code Generation</div>
        <h1>构建未来的代码维度</h1>
        <p>让 AI 理解逻辑，让生成超越想象</p>
      </div>
    </div>

    <div class="form-section">
      <div class="theme-btn-wrapper">
        <ThemeToggle />
      </div>

      <div class="form-card">
        <div class="form-header">
          <div class="logo-text">/&gt; Code AI</div>
          <h2>欢迎回来</h2>
          <p>请验证您的开发者身份</p>
        </div>

        <a-form :model="formState" layout="vertical" @finish="handleSubmit">
          <a-form-item name="userAccount" label="账号" :rules="[{ required: true }]">
            <a-input v-model:value="formState.userAccount" placeholder="请输入账号" size="large" />
          </a-form-item>
          <a-form-item name="userPassword" label="密码" :rules="[{ required: true }]">
            <a-input-password
              v-model:value="formState.userPassword"
              placeholder="请输入密码"
              size="large"
            />
          </a-form-item>

          <div class="form-options">
            <RouterLink to="/user/register" class="link">还没有账号？去注册</RouterLink>
          </div>

          <a-form-item>
            <a-button type="primary" html-type="submit" block size="large" class="submit-btn">
              验证并进入
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { userLogin } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const currentTheme = inject<any>('currentTheme')
const isDark = computed(() => currentTheme.value === 'dark')

const formState = reactive({ userAccount: '', userPassword: '' })

// --- Canvas 粒子逻辑 (类似 ECharts 连线) ---
onMounted(() => {
  const canvas = document.getElementById('particleCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  let particles: any[] = []

  const resize = () => {
    canvas.width = window.innerWidth * 0.6
    canvas.height = window.innerHeight
  }

  class Particle {
    x = Math.random() * canvas.width
    y = Math.random() * canvas.height
    vx = (Math.random() - 0.5) * 0.5
    vy = (Math.random() - 0.5) * 0.5
    update() {
      this.x += this.vx
      this.y += this.vy
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1
    }
  }

  const init = () => {
    particles = Array.from({ length: 80 }, () => new Particle())
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = isDark.value ? 'rgba(64, 150, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)'
    ctx.fillStyle = isDark.value ? 'rgba(64, 150, 255, 0.5)' : 'rgba(24, 144, 255, 0.3)'

    particles.forEach((p, i) => {
      p.update()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
      ctx.fill()
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j]
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
        if (dist < 150) {
          ctx.lineWidth = 1 - dist / 150
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      }
    })
    requestAnimationFrame(draw)
  }

  window.addEventListener('resize', resize)
  resize()
  init()
  draw()
})

const handleSubmit = async (values: any) => {
  const res = await userLogin(values)
  if (res.data.code === 0) {
    loginUserStore.setLoginUser(res.data.data)
    message.success('登录成功')
    router.push({ path: '/', replace: true })
  } else {
    message.error('登录失败：' + res.data.message)
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  transition: all 0.3s;
}

/* 左侧视觉区 */
.visual-section {
  flex: 1.2;
  position: relative;
  background: radial-gradient(circle at 20% 30%, #f0f7ff 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dark .visual-section {
  background: radial-gradient(circle at 20% 30%, #001529 0%, #000810 100%);
}

#particleCanvas {
  position: absolute;
  top: 0;
  left: 0;
}

.visual-content {
  position: relative;
  z-index: 2;
  max-width: 500px;
  padding: 40px;
}

.glass-tag {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(24, 144, 255, 0.1);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 20px;
  color: #1890ff;
  font-size: 12px;
  margin-bottom: 20px;
}

.visual-content h1 {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 20px;
  color: #000;
}
.dark .visual-content h1 {
  color: #fff;
}

/* 右侧表单区 */
.form-section {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fff;
  position: relative;
}
.dark .form-section {
  background: #141414;
}

.theme-btn-wrapper {
  position: absolute;
  top: 24px;
  right: 24px;
}

.form-card {
  width: 100%;
  max-width: 400px;
  padding: 0 40px;
}

.logo-text {

  font-size: 24px;
  color: #1890ff;
  font-weight: bold;
  margin-bottom: 12px;
}

.form-header h2 {
  font-size: 28px;
  margin-bottom: 8px;
}
.form-header p {
  color: #8c8c8c;
  margin-bottom: 40px;
}

.form-options {
  text-align: right;
  margin-bottom: 24px;
}

.submit-btn {
  height: 50px;
  border-radius: 8px;
  font-weight: 600;
}

/* 适配深色模式输入框 */
.dark :deep(.ant-input),
.dark :deep(.ant-input-password) {
  background: #1f1f1f;
  border-color: #434343;
  color: rgba(255, 255, 255, 0.85);
}

.dark :deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.45);
}
</style>
