<template>
  <a-layout-footer class="footer">
    <div class="footer-content">
      <p class="copyright">
        <a
          href="https://github.com/Make0209"
          target="_blank"
          rel="noopener noreferrer"
          class="author-link"
        >
          <GithubFilled /> AI应用生成平台 by Kefan
        </a>
      </p>
    </div>
  </a-layout-footer>
</template>

<script setup lang="ts">
// 无需额外的响应式数据
import { GithubFilled } from '@ant-design/icons-vue'
</script>

<style scoped>
.footer {
  background: var(--secondary-bg);
  text-align: center;
  padding: 20px;
  transition: background 0.3s ease;
}

.copyright {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
  transition: color 0.3s ease;
}

.author-link {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.3s ease;
}

.author-link:hover {
  color: var(--primary-color);
  opacity: 0.8;
}
</style>
