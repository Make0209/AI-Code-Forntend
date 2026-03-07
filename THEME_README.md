# 🎨 主题切换功能说明

## ✅ 实现方案

基于 SmartPictureFrontend 项目的深色模式实现方案，使用以下核心技术：

1. **Ant Design Vue 主题算法** - `antdTheme.darkAlgorithm` / `antdTheme.defaultAlgorithm`
2. **Provide/Inject 依赖注入** - 在 App.vue 中提供主题，子组件通过 inject 获取
3. **localStorage 持久化** - 保存用户主题偏好
4. **全局 CSS 类名控制** - `.dark-theme` / `.light-theme`

## 📁 文件结构

### 核心文件
- `src/App.vue` - 主题状态管理、Provide 主题、Ant Design 主题配置
- `src/components/GlobalHeader.vue` - 顶部导航（包含主题切换按钮）
- `src/components/ThemeToggle.vue` - 主题切换开关组件

### 样式文件
- `src/App.vue` (style 标签) - 全局深色模式样式

## 🎯 功能特性

### 1. 主题切换按钮
- 🌙 深色模式显示月亮 emoji
- ☀️ 浅色模式显示太阳 emoji
- 点击 Switch 开关即可切换
- 自动保存到 localStorage

### 2. 自动适配组件
- ✅ Header 背景色
- ✅ Menu 菜单项颜色
- ✅ Footer 背景色
- ✅ 文本颜色
- ✅ Ant Design 组件颜色

### 3. 页面适配
- ✅ HomePage
- ✅ UserLoginPage
- ✅ UserRegisterPage

## 🔧 使用方法

### 在新页面中适配深色模式

```vue
<template>
  <div class="my-page">
    <h1 class="title">我的页面</h1>
  </div>
</template>

<style scoped>
.my-page {
  /* 不需要特殊处理，Ant Design 会自动适配 */
}

.title {
  /* 如果需要文字颜色自动适配 */
  transition: color 0.3s;
}

/* 添加深色模式特定样式 */
.dark-theme .title {
  color: rgba(255, 255, 255, 0.85);
}
</style>
```

### 在组件中使用主题

```typescript
import { inject } from 'vue'

// 获取主题状态
const currentTheme = inject<any>('currentTheme')
const isDark = computed(() => currentTheme.value === 'dark')
```

## 📋 已适配的样式

### App.vue 全局样式
```css
/* Header 深色模式 */
.dark-theme .ant-layout-header,
.dark-theme #globalHeader {
  background: #1f1f1f !important;
}

/* Menu 深色模式 */
.dark-theme .ant-menu-horizontal {
  background: #1f1f1f !important;
  border-bottom: 1px solid #303030;
}

.dark-theme .ant-menu-item {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* Footer 深色模式 */
.dark-theme .ant-layout-footer {
  background: #1f1f1f !important;
  color: rgba(255, 255, 255, 0.85);
}

/* 文本颜色适配 */
.dark-theme .title {
  color: rgba(255, 255, 255, 0.85) !important;
}

.dark-theme .desc,
.dark-theme .tips {
  color: rgba(255, 255, 255, 0.65) !important;
}
```

## 🚀 新增页面适配步骤

1. **创建页面** - 正常使用 Vue 3 + Ant Design Vue 开发
2. **添加深色样式** - 在页面样式中添加 `.dark-theme` 前缀的样式
3. **测试验证** - 切换到深色模式，检查显示效果

## ⚠️ 注意事项

1. **避免硬编码背景色** - 尽量让 Ant Design 组件自动应用主题
2. **需要自定义时使用选择器** - 使用 `.dark-theme .your-class` 来覆盖样式
3. **添加过渡动画** - 给颜色相关属性添加 `transition: xxx 0.3s`

## 🎯 最佳实践

### ✅ 推荐做法
```vue
<style scoped>
/* 让 Ant Design 自动处理大部分样式 */
.container {
  padding: 24px;
}

/* 只在需要时自定义深色样式 */
.dark-theme .custom-element {
  background: #2a2a2a;
  color: rgba(255, 255, 255, 0.85);
}
</style>
```

### ❌ 不推荐做法
```vue
<style scoped>
/* 不要强制覆盖所有样式 */
.container {
  background: white !important; /* 这样深色模式下会失效 */
}
</style>
```

---

**最后更新**: 2026-03-07  
**参考项目**: SmartPictureFrontend  
**维护者**: AI 助手
