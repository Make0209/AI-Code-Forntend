<template>
  <div :class="['auth-page', isDark ? 'dark' : 'light']">
    <div class="visual-section">
      <canvas id="particleCanvas"></canvas>
      <div class="visual-content">
        <div class="glass-tag">AI Code Generation</div>
        <h1>开启代码新纪元</h1>
        <p>不写一行代码，让 AI 为您构建完整的业务逻辑</p>
      </div>
    </div>

    <div class="form-section">
      <div class="theme-btn-wrapper">
        <ThemeToggle />
      </div>

      <div class="form-card">
        <div class="form-header">
          <div class="logo-text">&lt;Register /&gt;</div>
          <h2>创建账号</h2>
          <p>加入开发者计划，体验智能生成的魅力</p>
        </div>

        <a-form :model="formState" layout="vertical" autocomplete="off" @finish="handleSubmit">
          <a-form-item
            name="userAccount"
            label="账号"
            :rules="[{ required: true, message: '请输入账号' }]"
          >
            <a-input
              v-model:value="formState.userAccount"
              placeholder="字母、数字或下划线"
              size="large"
            />
          </a-form-item>

          <a-form-item
            name="userPassword"
            label="设置密码"
            :rules="[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码长度不能小于 8 位' },
            ]"
          >
            <a-input-password
              v-model:value="formState.userPassword"
              placeholder="至少 8 位字符"
              size="large"
            />
          </a-form-item>

          <a-form-item
            name="checkPassword"
            label="确认密码"
            :rules="[
              { required: true, message: '请再次输入密码' },
              { validator: validateCheckPassword },
            ]"
          >
            <a-input-password
              v-model:value="formState.checkPassword"
              placeholder="请再次输入密码"
              size="large"
            />
          </a-form-item>

          <div class="form-options">
            <span class="text">已有账号？</span>
            <RouterLink to="/user/login" class="link">立即登录</RouterLink>
          </div>

          <a-form-item>
            <a-button type="primary" html-type="submit" block size="large" class="submit-btn">
              注册并开始使用
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
import { userRegister } from '@/api/userController.ts'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()

// 响应式状态
const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

// 注入主题状态
const currentTheme = inject<any>('currentTheme')
const isDark = computed(() => currentTheme.value === 'dark')

/**
 * 校验两次密码一致性
 */
const validateCheckPassword = async (_rule: any, value: string) => {
  if (value && value !== formState.userPassword) {
    throw new Error('两次输入的密码不一致')
  }
}

/**
 * 提交注册
 */
const handleSubmit = async (values: API.UserRegisterRequest) => {
  const res = await userRegister(values)
  if (res.data.code === 0) {
    message.success('注册成功，请登录')
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('注册失败：' + res.data.message)
  }
}

/**
 * Canvas 粒子动画逻辑 (ECharts 风格)
 */
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
    vx = (Math.random() - 0.5) * 0.4
    vy = (Math.random() - 0.5) * 0.4
    update() {
      this.x += this.vx
      this.y += this.vy
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1
    }
  }

  const init = () => {
    particles = Array.from({ length: 100 }, () => new Particle())
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 根据主题切换连线颜色
    ctx.strokeStyle = isDark.value ? 'rgba(64, 150, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)'
    ctx.fillStyle = isDark.value ? 'rgba(64, 150, 255, 0.4)' : 'rgba(24, 144, 255, 0.2)'

    particles.forEach((p, i) => {
      p.update()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j]
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
        if (dist < 150) {
          ctx.lineWidth = 0.8 - dist / 150
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
</script>

<style scoped>
/* 基础页面结构 */
.auth-page {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  transition: background-color 0.3s;
}

/* 左侧视觉展示区 */
.visual-section {
  flex: 1.2;
  position: relative;
  background: radial-gradient(circle at 30% 30%, #f0f7ff 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dark .visual-section {
  background: radial-gradient(circle at 30% 30%, #001529 0%, #000810 100%);
}

#particleCanvas {
  position: absolute;
  top: 0;
  left: 0;
}

.visual-content {
  position: relative;
  z-index: 2;
  max-width: 480px;
  padding: 40px;
}

.glass-tag {
  display: inline-block;
  padding: 4px 16px;
  background: rgba(24, 144, 255, 0.08);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 20px;
  color: #1890ff;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
  letter-spacing: 1px;
}

.visual-content h1 {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 16px;
  color: #000;
  line-height: 1.2;
}
.dark .visual-content h1 {
  color: #fff;
}
.visual-content p {
  color: #595959;
  font-size: 16px;
}
.dark .visual-content p {
  color: rgba(255, 255, 255, 0.45);
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
  border-left: 1px solid rgba(0, 0, 0, 0.05);
}
.dark .form-section {
  background: #141414;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
}

.theme-btn-wrapper {
  position: absolute;
  top: 24px;
  right: 24px;
}

.form-card {
  width: 100%;
  max-width: 380px;
  padding: 0 20px;
}

.logo-text {
  font-size: 24px;
  color: #1890ff;
  font-weight: bold;
  margin-bottom: 8px;
}

.form-header h2 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 4px;
}
.form-header p {
  color: #8c8c8c;
  margin-bottom: 32px;
  font-size: 14px;
}

.form-options {
  text-align: right;
  margin-bottom: 24px;
  font-size: 13px;
}
.form-options .text {
  color: #bfbfbf;
  margin-right: 4px;
}
.form-options .link {
  color: #1890ff;
  font-weight: 500;
}

.submit-btn {
  height: 48px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

/* 深色模式下 Ant Design 组件的样式适配 */
.dark :deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.45) !important;
}

.dark :deep(.ant-input),
.dark :deep(.ant-input-password) {
  background: #1f1f1f !important;
  border-color: #303030 !important;
  color: rgba(255, 255, 255, 0.85) !important;
}

.dark :deep(.ant-input:hover),
.dark :deep(.ant-input:focus) {
  border-color: #1890ff !important;
}

.dark :deep(.ant-input-affix-wrapper) {
  background: #1f1f1f !important;
  border-color: #303030 !important;
}
</style>
