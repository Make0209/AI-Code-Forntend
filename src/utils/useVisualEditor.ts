import { onUnmounted, ref } from 'vue'

export interface SelectedElementInfo {
  tagName: string
  id?: string
  className?: string
  textContent?: string
  selector: string
  fallbackSelectors?: string[]
  xpath?: string
  attributes?: Record<string, string>
  outerHTMLSnippet?: string
}

function buildInjectedScript(): string {
  return `
(function () {
  if (window.__veInitialized) {
    window.__veSetMode && window.__veSetMode(false);
    return;
  }
  window.__veInitialized = true;

  let hoveredEl = null;
  let selectedEl = null;
  let editMode = false;

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

  function countMatches(selector) {
    try {
      return document.querySelectorAll(selector).length;
    } catch (_) {
      return Number.MAX_SAFE_INTEGER;
    }
  }

  function isLikelyStableClass(cls) {
    if (!cls) return false;
    if (cls.startsWith('__ve-')) return false;
    if (/^(css-|sc-|chakra-|ant-)/.test(cls)) return false;
    if (/^[a-zA-Z]+-[a-zA-Z0-9]{6,}$/.test(cls)) return false;
    return true;
  }

  function collectKeyAttributes(el) {
    const keys = [
      'data-testid',
      'data-test',
      'data-qa',
      'name',
      'aria-label',
      'role',
      'type',
      'placeholder',
      'title',
      'alt',
      'href',
      'src',
      'value',
    ];
    const attrs = {};
    keys.forEach((k) => {
      const v = el.getAttribute(k);
      if (v && String(v).trim()) attrs[k] = String(v).trim();
    });
    return attrs;
  }

  function selectorByAttributes(el) {
    const tag = el.tagName.toLowerCase();
    const attrs = collectKeyAttributes(el);
    for (const [k, v] of Object.entries(attrs)) {
      const sel = tag + '[' + k + '="' + CSS.escape(String(v)) + '"]';
      if (countMatches(sel) === 1) return sel;
    }
    return '';
  }

  function selectorByClass(el) {
    const tag = el.tagName.toLowerCase();
    const classes = Array.from(el.classList).filter(isLikelyStableClass);
    if (!classes.length) return '';

    for (const cls of classes) {
      const sel = tag + '.' + CSS.escape(cls);
      if (countMatches(sel) === 1) return sel;
    }

    if (classes.length >= 2) {
      const combo = classes
        .slice(0, 3)
        .map((c) => '.' + CSS.escape(c))
        .join('');
      const sel = tag + combo;
      if (countMatches(sel) === 1) return sel;
    }
    return '';
  }

  function selectorByPath(el) {
    if (!el || el.nodeType !== 1) return '';
    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && node !== document.documentElement && depth < 8) {
      let seg = node.tagName.toLowerCase();
      if (node.id) {
        seg = '#' + CSS.escape(node.id);
        parts.unshift(seg);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (siblings.length > 1) {
          seg += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(seg);
      node = parent;
      depth += 1;
    }
    return parts.join(' > ');
  }

  function getXPath(el) {
    if (!el || el.nodeType !== 1) return '';
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      let index = 1;
      let sibling = node.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === node.tagName) index += 1;
        sibling = sibling.previousElementSibling;
      }
      parts.unshift(tag + '[' + index + ']');
      node = node.parentElement;
    }
    return '/' + parts.join('/');
  }

  function buildLocatorInfo(el) {
    const selectors = [];
    if (el.id) {
      const byId = '#' + CSS.escape(el.id);
      if (countMatches(byId) === 1) selectors.push(byId);
    }
    const byAttr = selectorByAttributes(el);
    if (byAttr) selectors.push(byAttr);
    const byClass = selectorByClass(el);
    if (byClass) selectors.push(byClass);
    const byPath = selectorByPath(el);
    if (byPath) selectors.push(byPath);

    const dedup = Array.from(new Set(selectors.filter(Boolean)));
    const primary = dedup[0] || el.tagName.toLowerCase();
    const fallback = dedup.filter((s) => s !== primary);
    return {
      selector: primary,
      fallbackSelectors: fallback,
      xpath: getXPath(el),
      attributes: collectKeyAttributes(el),
    };
  }

  function getElementInfo(el) {
    const rawText = (el.innerText || el.textContent || '').trim();
    const textContent = rawText.length > 80 ? rawText.slice(0, 80) + '...' : rawText;
    const cleanClasses = Array.from(el.classList)
      .filter((c) => !c.startsWith('__ve-'))
      .join(' ');
    const locator = buildLocatorInfo(el);
    const clonedEl = el.cloneNode(true);
    if (clonedEl && clonedEl.nodeType === 1) {
      const nodes = [clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))];
      nodes.forEach((node) => {
        Array.from(node.classList)
          .filter((c) => c.startsWith('__ve-'))
          .forEach((c) => node.classList.remove(c));
        if (!node.classList.length) {
          node.removeAttribute('class');
        }
      });
    }
    const outerHTMLSnippet = ((clonedEl.outerHTML || '') || (el.outerHTML || ''))
      .replace(/\\s+/g, ' ')
      .trim()
      .slice(0, 240);

    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: cleanClasses || undefined,
      textContent: textContent || undefined,
      selector: locator.selector,
      fallbackSelectors: locator.fallbackSelectors,
      xpath: locator.xpath,
      attributes: locator.attributes,
      outerHTMLSnippet: outerHTMLSnippet || undefined,
    };
  }

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
    function () {
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
  `
}

export function useVisualEditor() {
  const isEditMode = ref(false)
  const selectedElement = ref<SelectedElementInfo | null>(null)

  let iframeEl: HTMLIFrameElement | null = null

  function injectEditorScript(): void {
    if (!iframeEl) return
    const win = iframeEl.contentWindow
    const doc = iframeEl.contentDocument || win?.document
    if (!doc || !win) return

    if ((win as any).__veInitialized) {
      ;(win as any).__veSetMode?.(isEditMode.value)
      return
    }

    const script = doc.createElement('script')
    script.id = '__ve-injected__'
    script.textContent = buildInjectedScript()
    doc.body.appendChild(script)
  }

  function setIframe(el: HTMLIFrameElement | null): void {
    iframeEl = el
  }

  function toggleEditMode(): void {
    isEditMode.value = !isEditMode.value

    if (isEditMode.value) {
      injectEditorScript()
      setTimeout(() => {
        iframeEl?.contentWindow?.postMessage({ type: 'VE_SET_MODE', editMode: true }, '*')
      }, 50)
    } else {
      iframeEl?.contentWindow?.postMessage({ type: 'VE_SET_MODE', editMode: false }, '*')
      selectedElement.value = null
    }
  }

  function disableEditMode(): void {
    if (!isEditMode.value) return
    isEditMode.value = false
    selectedElement.value = null
    iframeEl?.contentWindow?.postMessage({ type: 'VE_SET_MODE', editMode: false }, '*')
  }

  function clearSelection(): void {
    selectedElement.value = null
  }

  function buildPromptSuffix(): string {
    if (!selectedElement.value) return ''
    const el = selectedElement.value
    const parts: string[] = [`tag: <${el.tagName}>`]
    if (el.id) parts.push(`id: ${el.id}`)
    if (el.className) parts.push(`class: ${el.className.split(' ').join('.')}`)
    if (el.textContent) parts.push(`text: ${el.textContent}`)
    parts.push(`primary_css_selector: ${el.selector}`)
    if (el.fallbackSelectors?.length) {
      parts.push(`fallback_css_selectors: ${el.fallbackSelectors.slice(0, 3).join(' | ')}`)
    }
    if (el.xpath) parts.push(`xpath: ${el.xpath}`)
    if (el.attributes && Object.keys(el.attributes).length) {
      parts.push(`key_attributes: ${JSON.stringify(el.attributes)}`)
    }
    if (el.outerHTMLSnippet) parts.push(`outer_html_snippet: ${el.outerHTMLSnippet}`)

    return `\n\n[visual_edit_context: user selected this element in preview. Modify only this element (or necessary children).\n${parts.join('\n')}]`
  }

  function handleMessage(e: MessageEvent): void {
    if (e.source !== iframeEl?.contentWindow) return
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
