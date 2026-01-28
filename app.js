const WORDS_URL = './all_words.txt';
const STORAGE_KEY_MEANINGS = 'ielts_meanings_v1';
const STORAGE_KEY_SESSION = 'ielts_session_v1';
const STORAGE_KEY_SETTINGS = 'ielts_settings_v1';

const CATEGORIES = [
  { id: 'all', name: '全量词库 (All Words)', file: './all_words.txt' },
  { id: '01', name: '01 Natural Geography (自然地理)', file: './list/01_自然地理.txt' },
  { id: '02', name: '02 Plant Research (植物研究)', file: './list/02_植物研究.txt' },
  { id: '03', name: '03 Animal Protection (动物保护)', file: './list/03_动物保护.txt' },
  { id: '04', name: '04 Space Exploration (太空探索)', file: './list/04_太空探索.txt' },
  { id: '05', name: '05 School Education (学校教育)', file: './list/05_学校教育.txt' },
  { id: '06', name: '06 Technology Invention (科技发明)', file: './list/06_科技发明.txt' },
  { id: '07', name: '07 Culture History (文化历史)', file: './list/07_文化历史.txt' },
  { id: '08', name: '08 Language Evolution (语言演化)', file: './list/08_语言演化.txt' },
  { id: '09', name: '09 Entertainment Sports (娱乐运动)', file: './list/09_娱乐运动.txt' },
  { id: '10', name: '10 Item Material (物品材料)', file: './list/10_物品材料.txt' },
  { id: '11', name: '11 Fashion Trend (时尚潮流)', file: './list/11_时尚潮流.txt' },
  { id: '12', name: '12 Diet Health (饮食健康)', file: './list/12_饮食健康.txt' },
  { id: '13', name: '13 Architecture Place (建筑场所)', file: './list/13_建筑场所.txt' },
  { id: '14', name: '14 Travel Transport (交通旅行)', file: './list/14_交通旅行.txt' },
  { id: '15', name: '15 State Government (国家政府)', file: './list/15_国家政府.txt' },
  { id: '16', name: '16 Social Economy (社会经济)', file: './list/16_社会经济.txt' },
  { id: '17', name: '17 Law Regulation (法律法规)', file: './list/17_法律法规.txt' },
  { id: '18', name: '18 Battlefield Comp (沙场争锋)', file: './list/18_沙场争锋.txt' },
  { id: '19', name: '19 Social Role (社会角色)', file: './list/19_社会角色.txt' },
  { id: '20', name: '20 Behavior Action (行为动作)', file: './list/20_行为动作.txt' },
  { id: '21', name: '21 Body Mind Health (身心健康)', file: './list/21_身心健康.txt' },
  { id: '22', name: '22 Time Date (时间日期)', file: './list/22_时间日期.txt' }
];

const $ = (id) => document.getElementById(id);
const on = (id, eventName, handler) => {
  const el = $(id);
  if (!el) return;
  el.addEventListener(eventName, handler);
};

function pickEnGbVoice(voices) {
  const list = Array.isArray(voices) ? voices : [];
  // 优先：en-GB
  const enGb = list.find((v) => (v?.lang || '').toLowerCase().startsWith('en-gb'));
  if (enGb) return enGb;

  // 其次：任何英语
  const anyEn = list.find((v) => (v?.lang || '').toLowerCase().startsWith('en'));
  return anyEn ?? null;
}

function speakTextEnGb(text, state) {
  const t = String(text ?? '').trim();
  if (!t) return;

  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    setFeedback('当前浏览器不支持语音朗读。', 'warn');
    return;
  }

  try {
    synth.cancel();
  } catch {
    // ignore
  }

  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'en-GB';
  const voices = synth.getVoices ? synth.getVoices() : [];
  const v = pickEnGbVoice(voices);
  if (v) u.voice = v;
  u.rate = 0.95;
  u.pitch = 1.0;

  try {
    synth.speak(u);
  } catch (e) {
    // 某些浏览器在未交互时会拒绝播放
    console.warn('speak failed', e);
  }

  state.__speech = state.__speech ?? {};
  state.__speech.lastSpoken = t;
}

function normalizeWord(raw) {
  // 去掉可能存在的 UTF-8 BOM（常见于 CSV 表头）
  return String(raw ?? '').replace(/^\uFEFF/, '').trim();
}

function normalizeMeaning(raw) {
  return (raw ?? '').trim();
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadMeanings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEANINGS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveMeanings(map) {
  localStorage.setItem(STORAGE_KEY_MEANINGS, JSON.stringify(map));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS)) || {};
  } catch {
    return {};
  }
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(s));
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
}

function resetSession() {
  localStorage.removeItem(STORAGE_KEY_SESSION);
}

function parseWordsTxt(text) {
  const words = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    const w = normalizeWord(line);
    if (!w) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    words.push(w);
  }
  return words;
}

function parseWordsFromCsvText(csvText) {
  const raw = String(csvText ?? '');
  const delimiter = detectCsvDelimiter(raw);
  const rows = parseCsv(raw, delimiter);
  if (!rows.length) return [];

  // 如果第一行像表头，跳过
  const first0 = normalizeWord(rows[0][0]).toLowerCase();
  const first1 = normalizeWord(rows[0][1]).toLowerCase();
  const looksHeader = first0 === 'word' || first0 === 'words' || first0 === '单词' || first1 === 'word' || first1 === '单词';
  const start = looksHeader ? 1 : 0;

  const words = [];
  const seen = new Set();
  for (let i = start; i < rows.length; i++) {
    const w = normalizeWord(rows[i]?.[0]);
    if (!w) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    words.push(w);
  }
  return words;
}

function detectCsvDelimiter(text) {
  // 只看第一行非空内容，粗略判断分隔符
  const firstLine = String(text ?? '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .find((l) => l.trim() !== '');

  if (!firstLine) return ',';
  const comma = (firstLine.match(/,/g) ?? []).length;
  const semi = (firstLine.match(/;/g) ?? []).length;
  const tab = (firstLine.match(/\t/g) ?? []).length;

  if (tab > comma && tab > semi) return '\t';
  if (semi > comma && semi > tab) return ';';
  return ',';
}

function parseCsv(text, delimiter = ',') {
  // 简易 CSV：支持指定分隔符 + 双引号包裹（不追求全 RFC）。
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    // 忽略空行
    if (row.some((c) => String(c ?? '').trim() !== '')) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === delimiter) {
      pushField();
      i += 1;
      continue;
    }

    if (ch === '\n') {
      pushField();
      pushRow();
      i += 1;
      continue;
    }

    if (ch === '\r') {
      // 跳过，\n 处理换行
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  pushField();
  pushRow();
  return rows;
}

function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    if (/[\",\n\r]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
    return s;
  };
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setStatusPill(text, tone = 'muted') {
  // 用户要求不显示任何“已加载/未加载/覆盖率”等状态。
  // 保留函数以避免调用方改动过大。
  void text;
  void tone;
  return;
}

function setFeedback(text, tone = 'muted') {
  const el = $('feedback');
  el.className = 'feedback' + (tone === 'ok' ? ' ok' : tone === 'bad' ? ' bad' : tone === 'warn' ? ' warn' : '');
  el.textContent = text ?? '';
}

function renderMissed(missed) {
  const wrap = $('missedTable');
  if (!wrap) return;
  if (!missed?.length) {
    wrap.innerHTML = '<div class="hint">暂无错题/跳过。</div>';
    return;
  }

  const rows = missed
    .slice()
    .reverse()
    .map((m) => {
      return `
        <tr>
          <td><strong>${escapeHtml(m.word)}</strong></td>
          <td>${escapeHtml(m.correctMeaning ?? '')}</td>
        </tr>`;
    })
    .join('');

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>单词</th>
          <th>正确释义</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildQuestion(word, meaningsMap, allWords) {
  const correct = normalizeMeaning(meaningsMap[word]);
  if (!correct) {
    return { word, ready: false, correctMeaning: '' };
  }

  // 选 3 个干扰项（从已有释义的其他单词里挑）
  const pool = [];
  for (const w of allWords) {
    if (w === word) continue;
    const m = normalizeMeaning(meaningsMap[w]);
    if (!m) continue;
    if (m === correct) continue;
    pool.push(m);
  }

  shuffleInPlace(pool);
  const distractors = [];
  for (const m of pool) {
    if (distractors.length >= 3) break;
    if (distractors.includes(m)) continue;
    distractors.push(m);
  }

  // 不足 3 个干扰项时，题目仍可做，但选项数量会减少
  const options = shuffleInPlace([correct, ...distractors]);
  return { word, ready: true, correctMeaning: correct, options };
}

function createDefaultSession(words, mode = 'random') {
  let order = words.slice();
  if (mode === 'random') {
    shuffleInPlace(order);
  }
  // mode === 'sequence' implies keeping the array as is (words order)

  return {
    startedAt: Date.now(),
    order: order,
    mode: mode, // Save mode in session for reference
    index: 0,
    correctCount: 0,
    answeredCount: 0,
    streak: 0,
    missed: [],
    last: null,
  };
}

function updateStats(session, total) {
  if (!session) {
    $('statProgress').textContent = total ? `-/ ${total}` : '-';
    $('statCorrect').textContent = '-';
    $('statStreak').textContent = '-';
    return;
  }
  $('statProgress').textContent = total ? `${Math.min(session.index + 1, total)}/${total}` : '-';
  $('statCorrect').textContent = `${session.correctCount}/${session.answeredCount}`;
  $('statStreak').textContent = String(session.streak);
}

function setQuizEnabled(enabled) {
  $('btnNext').disabled = !enabled;
  $('btnSkip').disabled = !enabled;
  if ($('btnSpeak')) $('btnSpeak').disabled = !enabled;
}

function renderQuestion(state) {
  const { session, words, meanings } = state;
  const total = words.length;

  if (!total) {
    $('qWord').textContent = '未加载词表';
    $('qMeta').textContent = '';
    $('options').innerHTML = '';
    setQuizEnabled(false);
    updateStats(session, 0);
    setFeedback('请先加载词表（建议用本地服务器打开页面）。', 'warn');
    return;
  }

  if (!session) {
    $('qWord').textContent = '未初始化测验';
    $('qMeta').textContent = '';
    $('options').innerHTML = '';
    setQuizEnabled(false);
    updateStats(null, total);
    setFeedback('正在初始化测验进度…', 'warn');
    return;
  }

  if (session.index >= session.order.length) {
    $('qWord').textContent = '本轮完成';
    $('qMeta').textContent = `共 ${total} 个单词 | 可点击“重置本次进度”再次乱序`;
    $('options').innerHTML = '';
    setQuizEnabled(false);
    updateStats(session, total);
    setFeedback('恭喜完成本轮！你也可以导入/更新 meanings.csv 后再刷一轮。', 'ok');
    return;
  }

  const word = session.order[session.index];
  $('qWord').textContent = word;
  $('qMeta').textContent = `第 ${session.index + 1} 题 / ${total}`;

  // 自动播放发音：仅在用户已交互后，并且同一题只播一次
  state.__speech = state.__speech ?? { interacted: false, lastKey: '' };
  const key = `${session.index}|${word}`;
  if (state.__speech.interacted && state.__speech.lastKey !== key) {
    state.__speech.lastKey = key;
    speakTextEnGb(word, state);
  }

  const q = buildQuestion(word, meanings, words);
  if (!q.ready) {
    $('options').innerHTML = `
      <div class="hint">这个单词缺少中文释义。请导入/更新 meanings.csv（使用上方“导入释义库（CSV）”），然后再做题；也可以直接跳过。</div>
    `;
    setQuizEnabled(true);
    // 允许用户直接下一题/跳过；揭示无意义
    $('btnNext').disabled = false;
    setFeedback('缺少释义：可导入更新或跳过。', 'warn');
    updateStats(session, total);
    return;
  }

  // 渲染选项
  $('options').innerHTML = '';
  setFeedback('', 'muted');
  setQuizEnabled(true);
  $('btnNext').disabled = true;

  let locked = false;
  const optionEls = [];

  q.options.forEach((optText) => {
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.type = 'button';
    btn.textContent = optText;
    btn.addEventListener('click', () => {
      if (locked) return;
      locked = true;

      const isCorrect = optText === q.correctMeaning;
      for (const el of optionEls) el.disabled = true;

      if (isCorrect) {
        btn.classList.add('correct');
        session.correctCount += 1;
        session.streak += 1;
      } else {
        btn.classList.add('wrong');
        session.streak = 0;
        // 标出正确答案
        const rightEl = optionEls.find((x) => x.textContent === q.correctMeaning);
        if (rightEl) rightEl.classList.add('correct');
        session.missed.push({
          ts: Date.now(),
          type: 'wrong',
          word,
          correctMeaning: q.correctMeaning,
          choice: optText,
        });
      }

      session.answeredCount += 1;
      session.last = { word, correct: isCorrect, correctMeaning: q.correctMeaning, choice: optText };
      saveSession(session);
      updateStats(session, total);
      $('btnNext').disabled = false;
    });

    optionEls.push(btn);
    $('options').appendChild(btn);
  });

  updateStats(session, total);
}

async function loadWordsFromFile(url) {
  const targetUrl = url || WORDS_URL;
  const res = await fetch(targetUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`加载失败：${res.status} ${res.statusText}`);
  const text = await res.text();
  const words = parseWordsTxt(text);
  if (!words.length) throw new Error('词表为空或无法解析');
  return words;
}

function normalizeMeaningMapKeys(map) {
  // 保守做法：只 trim/BOM 清理 key，不做大小写折叠（避免 Antarctic 等大小写差异）
  const out = {};
  for (const [k, v] of Object.entries(map ?? {})) {
    const nk = normalizeWord(k);
    const nv = normalizeMeaning(v);
    if (!nk || !nv) continue;
    out[nk] = nv;
  }
  return out;
}

function importMeaningsCsvText(csvText, meanings) {
  const raw = String(csvText ?? '');

  // 常见坑：Excel “Unicode 文本/UTF-16” 导出，浏览器按 UTF-8 解读会出现大量 \u0000
  const nulCount = (raw.match(/\u0000/g) ?? []).length;
  if (nulCount > 10) {
    return {
      imported: 0,
      error: 'CSV 看起来是 UTF-16/Unicode 编码。请用 Excel 另存为 “CSV UTF-8(逗号分隔)(*.csv)” 后再导入。',
    };
  }

  const delimiter = detectCsvDelimiter(raw);
  const rows = parseCsv(raw, delimiter);
  if (!rows.length) return { imported: 0, delimiter, error: 'CSV 为空或无法解析' };

  // 表头识别：允许表头不在前两列（比如多了一列序号/备注）
  const header = (rows[0] ?? []).map((c) => normalizeWord(c).toLowerCase());
  const wordKeys = new Set(['word', '单词', '英文', 'en']);
  const meaningKeys = new Set(['meaning_zh', 'meaning', 'zh', '中文', '中文释义', '释义', '翻译', 'translation']);
  const wordIndex = header.findIndex((h) => wordKeys.has(h));
  const meaningIndex = header.findIndex((h) => meaningKeys.has(h));
  const hasHeader = wordIndex !== -1 && meaningIndex !== -1;

  const wIdx = hasHeader ? wordIndex : 0;
  const mIdx = hasHeader ? meaningIndex : 1;
  const start = hasHeader ? 1 : 0;

  let imported = 0;
  for (let i = start; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const w = normalizeWord(row[wIdx]);
    const m = normalizeMeaning(row[mIdx]);
    if (!w || !m) continue;
    meanings[w] = m;
    imported += 1;
  }

  let warning = '';
  if (imported === 0) {
    warning = `未导入到任何释义。请确认分隔符是否正确（当前检测为：${delimiter === '\t' ? 'TAB' : delimiter}），以及至少有两列：word 和 meaning_zh。`;
  }
  return { imported, delimiter, hasHeader, warning };
}

function wireApp() {
  const state = {
    words: [],
    meanings: normalizeMeaningMapKeys(loadMeanings()),
    session: loadSession(),
    settings: loadSettings(),
  };

  state.__speech = state.__speech ?? { interacted: false, lastKey: '' };

  // UI Controls
  const catSel = $('categorySelect');
  const modeSel = $('modeSelect');

  // Init Category Select
  if (catSel) {
    catSel.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (state.settings.categoryId && CATEGORIES.some(c => c.id === state.settings.categoryId)) {
      catSel.value = state.settings.categoryId;
    }
  }

  // Init Mode Select
  if (modeSel && state.settings.mode) {
    modeSel.value = state.settings.mode;
  }

  const getCurrentCategory = () => {
     const val = catSel ? catSel.value : 'all';
     return CATEGORIES.find(c => c.id === val) || CATEGORIES[0];
  };

  const getCurrentMode = () => modeSel ? modeSel.value : 'random';

  const refreshPill = () => {
    // 不显示状态
    return;
  };

  const ensureSession = (opts = { forceNew: false }) => {
    if (!state.words.length) return;
    const mode = getCurrentMode();
    const existing = loadSession();
    
    const existingMode = existing?.mode || 'random';
    
    if (opts.forceNew || existingMode !== mode) {
      state.session = createDefaultSession(state.words, mode);
      saveSession(state.session);
      return;
    }

    if (existing?.order?.length) {
      // 更严格的校验：除了长度，还要校验词集合一致
      const orderSet = new Set((existing.order ?? []).map(normalizeWord));
      const wordSet = new Set(state.words.map(normalizeWord));
      const sameSize = orderSet.size === wordSet.size;
      const sameContent = sameSize && [...wordSet].every((w) => orderSet.has(w));
      if (!sameContent) {
        state.session = createDefaultSession(state.words, mode);
        saveSession(state.session);
      } else {
        state.session = existing;
      }
    } else {
      state.session = createDefaultSession(state.words, mode);
      saveSession(state.session);
    }
  };

  if (catSel) {
    on('categorySelect', 'change', async () => {
      state.settings.categoryId = catSel.value;
      saveSettings(state.settings);

      setFeedback('正在切换词库…', 'muted');
      try {
        const cat = getCurrentCategory();
        state.words = await loadWordsFromFile(cat.file);
        ensureSession({ forceNew: true });
        refreshPill();
        setFeedback(`已切换到：${cat.name}`, 'ok');
        renderQuestion(state);
      } catch (e) {
        setFeedback(`切换失败: ${e.message}`, 'bad');
      }
    });
  }

  if (modeSel) {
    let prevMode = modeSel.value;
    // Capture focus to know previous value (approximate)
    on('modeSelect', 'focus', () => { prevMode = modeSel.value; });
    
    on('modeSelect', 'change', () => {
      const newMode = modeSel.value;
      const ok = confirm('切换模式将重置当前进度，确定吗？');
      if (ok) {
        state.settings.mode = newMode;
        saveSettings(state.settings);
        prevMode = newMode;
        ensureSession({ forceNew: true });
        renderQuestion(state);
        setFeedback('模式已切换，进度已重置。', 'ok');
      } else {
        modeSel.value = prevMode;
      }
    });
  }

  on('btnLoad', 'click', async () => {
    setFeedback('正在加载词表与释义库…', 'muted');
    try {
      state.words = await loadWordsFromFile(getCurrentCategory().file);
      
      // 尝试自动加载 meanings.csv
      try {
        const mRes = await fetch('./meanings.csv');
        if (mRes.ok) {
          const mText = await mRes.text();
          const { imported: autoImported } = importMeaningsCsvText(mText, state.meanings);
          saveMeanings(state.meanings);
          console.log(`自动导入了 ${autoImported} 条释义`);
        }
      } catch (me) {
        console.warn('自动加载 meanings.csv 失败', me);
      }

      // 允许用户选择是否继续上次进度（词表一致时）
      const existing = loadSession();
      if (existing?.order?.length && existing.order.length === state.words.length) {
        const resume = confirm('检测到上次测验进度，是否继续？\n确定=继续进度；取消=重新乱序开始。');
        ensureSession({ forceNew: !resume });
      } else {
        ensureSession({ forceNew: false });
      }
      refreshPill();
      setFeedback('加载完成！已自动同步 meanings.csv 并生成乱序测验。', 'ok');
      renderQuestion(state);
    } catch (e) {
      setFeedback(String(e?.message ?? e), 'bad');
    }
  });

  on('btnResetSession', 'click', () => {
    state.__speech.interacted = true;
    if (!state.words.length) return;
    resetSession();
    ensureSession({ forceNew: true });
    setFeedback('已重置本次进度并重新乱序。', 'ok');
    renderQuestion(state);
  });

  on('fileWords', 'change', async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const name = String(file.name ?? '').toLowerCase();
      const words = name.endsWith('.csv') ? parseWordsFromCsvText(text) : parseWordsTxt(text);
      if (!words.length) throw new Error('词表为空或无法解析（TXT：每行一个单词；CSV：第一列为单词）');

      state.words = words;
      ensureSession({ forceNew: false });
      refreshPill();
      setFeedback(`词表导入完成：${words.length} 个单词。`, 'ok');
      renderQuestion(state);
    } catch (e) {
      setFeedback(`词表导入失败：${String(e?.message ?? e)}`, 'bad');
    } finally {
      evt.target.value = '';
    }
  });

  on('btnNext', 'click', () => {
    state.__speech.interacted = true;
    if (!state.session) return;
    state.session.index += 1;
    saveSession(state.session);
    renderQuestion(state);
  });

  on('btnSkip', 'click', () => {
    state.__speech.interacted = true;
    if (!state.session) return;
    const word = state.session.order[state.session.index];
    const correctMeaning = normalizeMeaning(state.meanings[word] ?? '');
    state.session.missed.push({
      ts: Date.now(),
      type: 'skip',
      word,
      correctMeaning,
      choice: '',
    });
    state.session.streak = 0;
    state.session.index += 1;
    saveSession(state.session);
    setFeedback('已跳过。', 'warn');
    renderQuestion(state);
  });

  on('btnSpeak', 'click', () => {
    state.__speech.interacted = true;
    const word = state.session?.order?.[state.session.index];
    if (!word) return;
    speakTextEnGb(word, state);
  });

  on('btnClearMeanings', 'click', () => {
    const ok = confirm('确定清空本地释义库吗？此操作不可恢复（除非你之前导出过）。');
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY_MEANINGS);
    state.meanings = {};
    refreshPill();
    setFeedback('已清空本地释义库。', 'ok');
    renderQuestion(state);
  });

  on('fileMeanings', 'change', async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importMeaningsCsvText(text, state.meanings);
      if (result.error) throw new Error(result.error);

      saveMeanings(state.meanings);
      refreshPill();
      if (result.imported > 0) {
        setFeedback(`导入完成：${result.imported} 条释义。`, 'ok');
      } else {
        setFeedback(result.warning || '未导入到任何释义，请检查 CSV 格式与编码。', 'warn');
      }
      renderQuestion(state);
    } catch (e) {
      setFeedback(`导入失败：${String(e?.message ?? e)}`, 'bad');
    } finally {
      evt.target.value = '';
    }
  });

  on('btnExport', 'click', () => {
    const rows = [['word', 'meaning_zh']];
    const entries = Object.entries(state.meanings)
      .map(([w, m]) => [normalizeWord(w), normalizeMeaning(m)])
      .filter(([w, m]) => w && m)
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [w, m] of entries) rows.push([w, m]);
    downloadText('meanings_export.csv', toCsv(rows));
  });

  on('btnExportMissed', 'click', () => {
    const missed = state.session?.missed ?? [];
    const map = new Map();
    for (const m of missed) {
      const w = normalizeWord(m.word);
      const meaning = normalizeMeaning(m.correctMeaning ?? state.meanings[w] ?? '');
      if (!w || !meaning) continue;
      map.set(w, meaning);
    }

    const rows = [['word', 'meaning_zh']];
    const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [w, meaning] of entries) rows.push([w, meaning]);
    downloadText('missed_export.csv', toCsv(rows));
  });

  // 初始化：先把上次错题展示出来（即使还没加载词表也可见/可导出）
  refreshPill();
  setQuizEnabled(false);
  updateStats(state.session, state.words.length);

  // 自动尝试加载词表（成功则自动可用；失败则提示用户用本地服务器）
  (async () => {
    try {
      state.words = await loadWordsFromFile(getCurrentCategory().file);
      try {
        const mRes = await fetch('./meanings.csv');
        if (mRes.ok) {
          const mText = await mRes.text();
          importMeaningsCsvText(mText, state.meanings);
          saveMeanings(state.meanings);
        }
      } catch {
        // 忽略：仍可手动导入
      }
      ensureSession({ forceNew: false });
      refreshPill();
      renderQuestion(state);
    } catch {
      // 页面被直接 file:// 打开时 fetch 会失败，这里不打扰用户
    }
  })();
}

wireApp();
