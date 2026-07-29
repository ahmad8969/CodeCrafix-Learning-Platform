import { monacoLanguageFromPath } from '@/config/languages'

/**
 * Build a sandboxed HTML document for browser preview from workspace files.
 * Injects a console bridge so parent can display logs/errors.
 */
export function buildPreviewDocument(files = []) {
  const byPath = Object.fromEntries(files.map((f) => [f.path, f.content || '']))
  let html = byPath['index.html'] || byPath['index.htm'] || '<!DOCTYPE html><html><body></body></html>'
  const css = byPath['style.css'] || byPath['styles.css'] || ''
  const js = byPath['script.js'] || byPath['main.js'] || byPath['app.js'] || ''

  // Inline linked stylesheet/script for srcdoc (no separate file URLs)
  if (css) {
    if (/<link[^>]+href=["']style\.css["']/i.test(html)) {
      html = html.replace(
        /<link[^>]+href=["']style\.css["'][^>]*>/i,
        `<style>\n${css}\n</style>`
      )
    } else if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `<style>\n${css}\n</style></head>`)
    } else {
      html = `<style>${css}</style>${html}`
    }
  }

  const consoleBridge = `
<script>
(function(){
  const send = (level, args) => {
    try {
      parent.postMessage({
        source: 'codecrafters-preview',
        level,
        args: args.map((a) => {
          try { return typeof a === 'string' ? a : JSON.stringify(a); }
          catch { return String(a); }
        }),
        ts: Date.now()
      }, '*');
    } catch (e) {}
  };
  ['log','info','warn','error'].forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args) => { original(...args); send(level, args); };
  });
  window.addEventListener('error', (e) => {
    send('error', [e.message + (e.filename ? ' @ ' + e.filename + ':' + e.lineno : '')]);
  });
  window.addEventListener('unhandledrejection', (e) => {
    send('error', ['Unhandled: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason))]);
  });
})();
</script>`

  if (js) {
    const scriptTag = `${consoleBridge}<script>\n${js}\n</script>`
    if (/<script[^>]+src=["']script\.js["'][^>]*><\/script>/i.test(html)) {
      html = html.replace(/<script[^>]+src=["']script\.js["'][^>]*><\/script>/i, scriptTag)
    } else if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${scriptTag}</body>`)
    } else {
      html = `${html}${scriptTag}`
    }
  } else if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, `${consoleBridge}</body>`)
  } else {
    html = `${html}${consoleBridge}`
  }

  return html
}

export function languageFromPath(path = '') {
  return monacoLanguageFromPath(path)
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
