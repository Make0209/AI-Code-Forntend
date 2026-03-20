import { onUnmounted, ref } from 'vue'

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface SelectedElementInfo {
  tagName: string
  id?: string
  className?: string
  textContent?: string
  selector: string
}

// ─── 注入到 iframe 的脚本（字符串模板）────────────────────────────────────────

/**
 * 生成注入 iframe 的编辑器脚本字符串。
 * 由于要在 iframe.contentDocument 里直接创建 <script> 节点，
 * 必须避免使用外部变量闭包，全部逻辑自洽。
 */
function buildInjectedScript(): string {
  return `
(function () {
  // 防止重复注入
  if (window.__veInitialized) {
    // 已注入过，重置状态即可
    window.__veSetMode && window.__veSetMode(false);
    return;
  }
  window.__veInitialized = true;

  let hoveredEl = null;
  let selectedEl = null;
  let editMode = false;

  // ── 样式常量 ──────────────────────────────────────────────────────────────
  const HOVER_CLASS = '__ve-hover__';
  const SELECTED_CLASS = '__ve-selected__';

  const style = document.createElement('style');
  style.id = '__ve-style__';
  style.textContent = \`
    .__ve-hover__ {
      outline: 2px dashed #1890ff !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
      transition: outline 0.1s ease !important;
    }
    .__ve-selected__ {
      outline: 2px solid #096dd9 !important;
      outline-offset: 2px !important;
      background-color: rgba(24, 144, 255, 0.06) !important;
      cursor: crosshair !important;
    }
  \`;
  document.head.appendChild(style);

  // ── 工具函数：生成 CSS 选择器路径 ─────────────────────────────────────────
  function getCssSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';

    // 优先使用 id（唯一）
    if (el.id) return '#' + CSS.escape(el.id);

    const tag = el.tagName.toLowerCase();
    const parent = el.parentElement;
    if (!parent) return tag;

    // 计算同类兄弟节点中的位置
    const siblings = Array.from(parent.children).filter(
      (c) => c.tagName === el.tagName,
    );
    const suffix =
      siblings.length > 1 ? ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')' : '';

    return getCssSelector(parent) + ' > ' + tag + suffix;
  }

  // ── 工具函数：提取元素信息 ────────────────────────────────────────────────
  function getElementInfo(el) {
    const rawText = (el.innerText || el.textContent || '').trim();
    const textContent = rawText.length > 80 ? rawText.slice(0, 80) + '…' : rawText;
    const cleanClasses = Array.from(el.classList)
      .filter((c) => !c.startsWith('__ve-'))
      .join(' ');

    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: cleanClasses || undefined,
      textContent: textContent || undefined,
      selector: getCssSelector(el),
    };
  }

  // ── 清理元素高亮状态 ──────────────────────────────────────────────────────
  function clearHover() {
    if (hoveredEl && hoveredEl !== selectedEl) {
      hoveredEl.classList.remove(HOVER_CLASS);
    }
    hoveredEl = null;
  }

  function clearSelected() {
    if (selectedEl) {
      selectedEl.classList.remove(SELECTED_CLASS);
      selectedEl.classList.remove(HOVER_CLASS);
      selectedEl = null;
    }
  }

  // ── 事件监听 ──────────────────────────────────────────────────────────────
  document.addEventListener(
    'mouseover',
    function (e) {
      if (!editMode) return;
      clearHover();
      hoveredEl = e.target;
      if (hoveredEl !== selectedEl && hoveredEl !== document.body && hoveredEl !== document.documentElement) {
        hoveredEl.classList.add(HOVER_CLASS);
      }
    },
    true,
  );

  document.addEventListener(
    'mouseout',
    function (e) {
      if (!editMode) return;
      if (hoveredEl && hoveredEl !== selectedEl) {
        hoveredEl.classList.remove(HOVER_CLASS);
      }
    },
    true,
  );

  document.addEventListener(
    'click',
    function (e) {
      if (!editMode) return;
      e.preventDefault();
      e.stopPropagation();

      clearSelected();
      selectedEl = e.target;
      if (selectedEl === document.body || selectedEl === document.documentElement) return;

      selectedEl.classList.remove(HOVER_CLASS);
      selectedEl.classList.add(SELECTED_CLASS);

      const info = getElementInfo(selectedEl);
      window.parent.postMessage({ type: 'VE_ELEMENT_SELECTED', payload: info }, '*');
    },
    true,
  );

  // ── 接收来自主站的消息 ────────────────────────────────────────────────────
  window.__veSetMode = function (enabled) {
    editMode = enabled;
    if (!enabled) {
      clearHover();
      clearSelected();
      document.body.style.cursor = '';
    } else {
      document.body.style.cursor = 'crosshair';
    }
  };

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'VE_SET_MODE') return;
    window.__veSetMode(!!e.data.editMode);
  });
})();
  `;
}

// ─── 注入 CSS 样式到 iframe head ──────────────────────────────────────────────

function injectStyleToIframe(doc: Document): void {
  // 已注入则跳过
  if (doc.getElementById('__ve-style__')) return;
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useVisualEditor() {
  const isEditMode = ref(false)
  const selectedElement = ref<SelectedElementInfo | null>(null)

  let iframeEl: HTMLIFrameElement | null = null

  // ── 注入编辑器脚本到 iframe ────────────────────────────────────────────────
  function injectEditorScript(): void {
    if (!iframeEl) return
    const win = iframeEl.contentWindow
    const doc = iframeEl.contentDocument || win?.document
    if (!doc || !win) return

    // 若已注入脚本，通过全局函数直接切换模式即可
    if ((win as any).__veInitialized) {
      ;(win as any).__veSetMode?.(isEditMode.value)
      return
    }

    const script = doc.createElement('script')
    script.id = '__ve-injected__'
    script.textContent = buildInjectedScript()
    doc.body.appendChild(script)
  }

  // ── 注册 iframe 引用（在 onIframeLoad 中调用）────────────────────────────
  function setIframe(el: HTMLIFrameElement | null): void {
    iframeEl = el
  }

  // ── 切换编辑模式 ──────────────────────────────────────────────────────────
  function toggleEditMode(): void {
    isEditMode.value = !isEditMode.value

    if (isEditMode.value) {
      // 进入编辑模式：先注入脚本，再发送模式消息
      injectEditorScript()
      // 给脚本一点初始化时间再发送消息
      setTimeout(() => {
        iframeEl?.contentWindow?.postMessage({ type: 'VE_SET_MODE', editMode: true }, '*')
      }, 50)
    } else {
      // 退出编辑模式
      iframeEl?.contentWindow?.postMessage({ type: 'VE_SET_MODE', editMode: false }, '*')
      selectedElement.value = null
    }
  }

  // ── 退出编辑模式（发送消息后调用）───────────────────────────────────────
  function disableEditMode(): void {
    if (!isEditMode.value) return
    isEditMode.value = false
    selectedElement.value = null
    iframeEl?.contentWindow?.postMessage({ type: 'VE_SET_MODE', editMode: false }, '*')
  }

  // ── 清除选中元素 ──────────────────────────────────────────────────────────
  function clearSelection(): void {
    selectedElement.value = null
  }

  // ── 生成附加到提示词末尾的上下文说明 ─────────────────────────────────────
  function buildPromptSuffix(): string {
    if (!selectedElement.value) return ''
    const el = selectedElement.value
    const parts: string[] = [`标签：<${el.tagName}>`]
    if (el.id) parts.push(`ID：#${el.id}`)
    if (el.className) parts.push(`Class：.${el.className.split(' ').join('.')}`)
    if (el.textContent) parts.push(`文本内容："${el.textContent}"`)
    parts.push(`CSS 选择器：${el.selector}`)

    return `\n\n[可视化编辑提示 — 用户在预览页面中选中了以下元素，请针对该元素进行修改：\n${parts.join('，\n')}]`
  }

  // ── 处理来自 iframe 的 postMessage ───────────────────────────────────────
  function handleMessage(e: MessageEvent): void {
    if (e.data?.type === 'VE_ELEMENT_SELECTED') {
      selectedElement.value = e.data.payload as SelectedElementInfo
    }
  }

  window.addEventListener('message', handleMessage)

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage)
  })

  return {
    isEditMode,
    selectedElement,
    setIframe,
    injectEditorScript,
    toggleEditMode,
    disableEditMode,
    clearSelection,
    buildPromptSuffix,
  }
}
