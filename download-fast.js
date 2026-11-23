(function () {
  'use strict';

  var CDN_URL = 'https://aka.doubaocdn.com/s/0yrErgJznF';
  var GITHUB_URL = 'https://github.com/BlockVibe001/cm-launcher/releases/download/v1.0.94/nebula-launcher-setup-1.0.94.exe';
  var GITHUB_LATEST = 'https://github.com/BlockVibe001/cm-launcher/releases/latest';
  var FILE_NAME = 'nebula-launcher-setup-1.0.94.exe';
  var EXPECTED_SIZE = 405383696;
  var CHUNK_SIZE = 8 * 1024 * 1024;
  var WORKERS = 8;

  var supported = typeof window.showSaveFilePicker === 'function';
  var active = false;
  var overlay = null;

  function injectCSS() {
    if (document.getElementById('ndl-style')) return;
    var style = document.createElement('style');
    style.id = 'ndl-style';
    style.textContent = [
      '.ndl-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;',
      'background:rgba(3,5,14,.74);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
      'opacity:0;pointer-events:none;transition:opacity .28s ease}',
      '.ndl-overlay.open{opacity:1;pointer-events:auto}',
      '.ndl-card{width:min(460px,100%);box-sizing:border-box;padding:28px 26px 22px;border-radius:24px;color:#eaf2ff;',
      'font-family:inherit;background:linear-gradient(150deg,rgba(18,26,54,.98),rgba(8,12,30,.98));',
      'border:1px solid rgba(126,231,255,.24);box-shadow:0 28px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)}',
      '.ndl-head{display:flex;gap:14px;align-items:center}',
      '.ndl-orb{width:46px;height:46px;border-radius:50%;position:relative;flex:0 0 auto;',
      'background:radial-gradient(circle at 34% 30%,#bff6ff,#64c8ff 36%,#8367ff 70%,#2a1a54);',
      'box-shadow:0 0 26px rgba(100,200,255,.45)}',
      '.ndl-orb i{position:absolute;inset:8px;border:1px solid rgba(255,255,255,.34);border-radius:50%;animation:ndl-spin 4s linear infinite}',
      '.ndl-orb i:nth-child(2){inset:14px;animation-duration:2.6s;animation-direction:reverse}',
      '.ndl-orb i:nth-child(3){inset:-4px;opacity:.28;animation-duration:7s}',
      '@keyframes ndl-spin{to{transform:rotate(360deg)}}',
      '.ndl-title{font-size:21px;font-weight:700;letter-spacing:.04em}',
      '.ndl-sub{font-size:12px;color:#8ea3c8;margin-top:4px}',
      '.ndl-status{font-size:13px;color:#b8c9e8;margin:24px 0 10px;min-height:19px}',
      '.ndl-bar{height:8px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden;',
      'box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)}',
      '.ndl-bar i{display:block;height:100%;width:100%;transform-origin:left;transform:scaleX(.01);',
      'background:linear-gradient(90deg,#58e0c8,#64c8ff 45%,#a78bfa);',
      'box-shadow:0 0 18px rgba(100,200,255,.55);transition:transform .18s ease}',
      '.ndl-meta{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#8ea3c8;margin-top:10px}',
      '.ndl-pct{color:#9be7ff;font-weight:700}',
      '.ndl-actions{display:flex;align-items:center;gap:14px;margin-top:22px}',
      '.ndl-cancel{appearance:none;border:1px solid rgba(126,231,255,.28);background:rgba(126,231,255,.08);',
      'color:#cfeeff;padding:10px 18px;border-radius:99px;font-family:inherit;font-size:13px;cursor:pointer}',
      '.ndl-cancel:hover{background:rgba(126,231,255,.16)}',
      '.ndl-cancel:disabled{opacity:.45;cursor:default}',
      '.ndl-fallback{color:#9ba9c8;font-size:12px;text-decoration:none;border-bottom:1px dashed rgba(155,169,200,.4)}',
      '.ndl-fallback:hover{color:#cfe3ff}',
      '.ndl-tip{font-size:11px;color:#687b9e;margin-top:16px;line-height:1.6}',
      '@media(max-width:520px){.ndl-card{padding:22px 18px 18px}.ndl-title{font-size:18px}.ndl-head{gap:10px}.ndl-orb{width:38px;height:38px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function fmtMB(n) {
    return (n / 1048576).toFixed(1);
  }

  function fmtSpeed(bps) {
    if (!bps || !isFinite(bps)) return '0.0 MB/s';
    return (bps / 1048576).toFixed(1) + ' MB/s';
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec <= 0) return '--';
    if (sec < 60) return Math.ceil(sec) + ' 秒';
    return Math.floor(sec / 60) + ' 分 ' + Math.ceil(sec % 60) + ' 秒';
  }

  function buildOverlay() {
    if (overlay) return overlay;
    injectCSS();
    overlay = document.createElement('div');
    overlay.className = 'ndl-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="ndl-card">' +
        '<div class="ndl-head">' +
          '<div class="ndl-orb"><i></i><i></i><i></i></div>' +
          '<div><div class="ndl-title">高速下载</div><div class="ndl-sub">星云启动器 1.0.94 · 386 MB · 8 线程加速</div></div>' +
        '</div>' +
        '<div class="ndl-status" aria-live="polite">正在连接高速节点…</div>' +
        '<div class="ndl-bar"><i></i></div>' +
        '<div class="ndl-meta"><span class="ndl-pct">0%</span><span class="ndl-speed">0.0 MB/s</span><span class="ndl-eta">剩余 --</span></div>' +
        '<div class="ndl-actions"><button type="button" class="ndl-cancel">取消下载</button></div>' +
        '<div class="ndl-tip">下载时请保持页面打开。完成后双击安装包即可；高速节点不可用时会自动打开 GitHub 最新下载页。</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.ndl-cancel').addEventListener('click', function () {
      if (overlay._abort) overlay._abort();
    });
    return overlay;
  }

  function setOverlay(state, detail) {
    var box = buildOverlay();
    var status = box.querySelector('.ndl-status');
    var pct = box.querySelector('.ndl-pct');
    var speed = box.querySelector('.ndl-speed');
    var eta = box.querySelector('.ndl-eta');
    var bar = box.querySelector('.ndl-bar > i');
    var cancel = box.querySelector('.ndl-cancel');
    if (state === 'start') {
      box.classList.add('open');
      status.textContent = '正在连接高速节点…';
      cancel.textContent = '取消下载';
      cancel.disabled = false;
    } else if (state === 'progress') {
      var p = detail.total ? detail.done / detail.total : 0;
      bar.style.transform = 'scaleX(' + Math.max(0.01, Math.min(1, p)) + ')';
      pct.textContent = Math.floor(p * 100) + '%';
      speed.textContent = fmtSpeed(detail.speed);
      eta.textContent = '剩余 ' + fmtTime(detail.eta);
      status.textContent = '正在下载 ' + fmtMB(detail.done) + ' / ' + fmtMB(detail.total) + ' MB';
    } else if (state === 'done') {
      bar.style.transform = 'scaleX(1)';
      pct.textContent = '100%';
      speed.textContent = '完成';
      eta.textContent = '用时 ' + fmtTime(detail.seconds);
      status.textContent = '下载完成，安装包已保存';
      cancel.textContent = '关闭';
      cancel.disabled = false;
      if (overlay) overlay._abort = closeOverlay;
    } else if (state === 'error') {
      status.textContent = detail.message || '下载失败，请重试';
      cancel.textContent = '关闭';
      cancel.disabled = false;
      if (overlay) overlay._abort = closeOverlay;
      var actions = box.querySelector('.ndl-actions');
      var old = actions.querySelector('.ndl-fallback');
      if (!old) {
        var fallback = document.createElement('a');
        fallback.className = 'ndl-fallback';
        fallback.href = GITHUB_LATEST;
        fallback.textContent = '打开 GitHub 最新下载页';
        actions.appendChild(fallback);
      }
    }
  }

  function closeOverlay() {
    if (overlay) overlay.classList.remove('open');
    active = false;
  }

  var redirecting = false;
  function redirectGithub(message) {
    if (redirecting) return;
    redirecting = true;
    active = false;
    setOverlay('error', { message: (message || '高速通道不可用') + '，正在打开 GitHub 最新下载页…' });
    setTimeout(function () {
      try { window.location.assign(GITHUB_LATEST); }
      catch (e) { window.location.href = GITHUB_LATEST; }
    }, 1200);
  }

  function parseTotal(res) {
    var range = res.headers.get('Content-Range') || '';
    var m = range.match(/\/(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  async function fetchRange(start, end, signal) {
    var lastErr;
    for (var attempt = 1; attempt <= 3; attempt++) {
      try {
        var res = await fetch(CDN_URL, {
          headers: { Range: 'bytes=' + start + '-' + end },
          signal: signal,
          cache: 'no-store'
        });
        if (res.status !== 206) throw new Error('高速节点返回 ' + res.status);
        var buf = await res.arrayBuffer();
        if (buf.byteLength !== (end - start + 1)) throw new Error('分片长度不完整');
        return buf;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        lastErr = e;
        await new Promise(function (r) { setTimeout(r, 600 * attempt); });
      }
    }
    throw lastErr;
  }

  async function startDownload(event) {
    if (active) return;
    active = true;
    var handle;
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: FILE_NAME,
        types: [{ description: 'Windows 安装包', accept: { 'application/octet-stream': ['.exe'] } }]
      });
    } catch (e) {
      active = false;
      if (e && e.name === 'AbortError') return;
      // 浏览器不支持或权限被拒绝：自动走 GitHub 官方下载，不再停在错误弹窗
      redirectGithub('当前浏览器不支持高速保存');
      return;
    }

    var writable;
    try {
      writable = await handle.createWritable();
    } catch (e) {
      active = false;
      redirectGithub('无法写入保存位置');
      return;
    }

    setOverlay('start');
    var controller = new AbortController();
    var lastProgressAt = Date.now();
    var watchdog = setInterval(function () {
      if (Date.now() - lastProgressAt < 15000) return;
      clearInterval(watchdog);
      redirectGithub('高速通道长时间没有响应');
      controller.abort();
    }, 5000);
    overlay._abort = function () {
      clearInterval(watchdog);
      controller.abort();
      writable.abort().catch(function () {});
      active = false;
      setOverlay('error', { message: '已取消下载，未完成的文件可以删除。' });
      overlay._abort = closeOverlay;
    };

    var total = EXPECTED_SIZE;
    var done = 0;
    var started = Date.now();
    var lastTime = started;
    var lastDone = 0;

    try {
      // 先取 1 字节探测总大小，同时验证高速节点可用
      var probe = await fetch(CDN_URL, {
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal,
        cache: 'no-store'
      });
      if (probe.status !== 206) throw new Error('高速节点暂时不可用');
      total = parseTotal(probe) || EXPECTED_SIZE;
      if (probe.body) probe.body.cancel().catch(function () {});

      var next = 0;
      async function worker() {
        while (true) {
          var index = next++;
          var start = index * CHUNK_SIZE;
          if (start >= total) return;
          var end = Math.min(start + CHUNK_SIZE - 1, total - 1);
          var buf = await fetchRange(start, end, controller.signal);
          await writable.write({ type: 'write', position: start, data: buf });
          done += buf.byteLength;
          lastProgressAt = Date.now();
          var now = Date.now();
          var elapsed = (now - started) / 1000;
          var speed = done / elapsed;
          var inst = (done - lastDone) / Math.max(0.001, (now - lastTime) / 1000);
          lastDone = done;
          lastTime = now;
          setOverlay('progress', {
            done: done,
            total: total,
            speed: inst || speed,
            eta: (total - done) / Math.max(1, speed)
          });
        }
      }

      await Promise.all(Array.from({ length: WORKERS }, function () { return worker(); }));
      clearInterval(watchdog);
      await writable.close();
      var file = await handle.getFile();
      if (file.size !== total) throw new Error('文件大小校验失败，请重新下载');
      setOverlay('done', { seconds: (Date.now() - started) / 1000 });
      active = false;
      setTimeout(function () { if (overlay && overlay.classList.contains('open')) closeOverlay(); }, 6000);
    } catch (e) {
      clearInterval(watchdog);
      try { await writable.abort(); } catch (_) {}
      active = false;
      if (e.name === 'AbortError') return;
      redirectGithub((e.message || '下载失败'));
    }
  }

  function bind() {
    var links = document.querySelectorAll('a[href*="releases/download/"][href*="nebula-launcher-setup-"]');
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        // 始终跟着当前页面上的版本走，后面换 1.0.96 / 1.0.97 不用再改脚本
        GITHUB_URL = a.href || GITHUB_URL;
        FILE_NAME = decodeURIComponent((a.href || '').split('/').pop()) || FILE_NAME;
        if (!supported) {
          e.preventDefault();
          window.location.href = GITHUB_LATEST;
          return;
        }
        e.preventDefault();
        startDownload(e);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
