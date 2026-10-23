const app = document.getElementById("app");
const external = (url, label, cls = "text-link") =>
  `<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
const go = () => external("https://slothcode.dev", "前往 Sub9api", "primary");
const escapeHtml = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const scenes = [
  {
    label: "读懂一段材料",
    small: "从概念与论证入手",
    title: "不急着总结，先弄清这段话在说什么。",
    desc: "贴入你有权使用的短段落，指出具体疑问。解释后，再对照原文检查。",
    prompt:
      "我正在阅读一段与课程论文有关的材料：\n【粘贴短段落】\n\n我不理解的地方是：【具体疑问】。\n请只根据这段材料，解释关键概念和论证关系；指出哪些信息原文没有说明，不要补写作者的结论。",
    article: "first",
  },
  {
    label: "讨论论文提纲",
    small: "找范围与逻辑缺口",
    title: "让 AI 先找问题，再由你决定怎么改。",
    desc: "带上课程要求与已有提纲，要求逐条解释问题，而不是直接生成整篇正文。",
    prompt:
      "我的课程论文主题是：【主题】。\n课程要求：【要求】。已有提纲：【提纲】。\n请检查选题范围、各部分之间的逻辑，以及还缺少哪些证据。\n按“问题—理由—我需要补充的信息”列出建议，暂时不要替我重写。",
    article: "outline",
  },
  {
    label: "修改草稿表达",
    small: "知道为什么改",
    title: "比“帮我润色”再具体一点。",
    desc: "先明确段落的目的，让每一处建议都可对照、可取舍。",
    prompt:
      "下面这段文字想表达：【段落目的】。\n原文：【你的草稿】。\n请指出含糊、重复或逻辑跳跃的地方，并用“原句—修改建议—理由”的形式反馈。\n保留我的观点与专业术语，不添加新的事实或文献。",
    article: "revise",
  },
];
const resources = [
  {
    id: "lee",
    type: "视频课程",
    tag: "中文课程",
    title: "从“怎么问”开始理解生成式 AI",
    source: "李宏毅 · 台湾大学 · 2024 年课程",
    desc: "可先看第 3 讲，了解提示和提供更多信息的思路。课程主页同时提供课件与视频目录。",
    limit: "入门原理课，并非论文写作专课。视频在 YouTube；已核对官方目录，未完整观看。",
    url: "https://speech.ee.ntu.edu.tw/~hylee/genai/2024-spring.php",
    video: "https://youtu.be/A3Yx35KrSN0",
  },
  {
    id: "academy",
    type: "图文指南",
    tag: "学生提示示例",
    title: "看看学生可以怎样提出具体请求",
    source: "OpenAI Academy · Juliann Igo · 英文",
    desc: "涵盖作文反馈、研究材料整理等提问例子。适合观察如何交代任务和预期反馈。",
    limit: "原文面向 ChatGPT Edu；可借鉴提问方式，不代表 Sub9api 提供相同产品功能。",
    url: "https://academy.openai.com/en/public/clubs/higher-education-05x4z/resources/prompt-pack-for-students",
  },
  {
    id: "cuhk",
    type: "图文指南",
    tag: "中文引文指南",
    title: "使用了 AI，引用和记录怎样整理？",
    source: "香港中文大学（深圳）图书馆 · 中文",
    desc: "从引用、转述与概述的区别，读到生成式 AI 的引用和使用记录建议。",
    limit: "最终要求以你的学校、课程或期刊规定为准。",
    url: "https://library.cuhk.edu.cn/zh-hans/citation-guides",
  },
  {
    id: "ubc",
    type: "图文指南",
    tag: "信息核对",
    title: "AI 给出的引用，先查回原文",
    source: "UBC 图书馆 · 英文",
    desc: "介绍如何交叉核对 AI 提供的信息，确认引用是否存在、原文是否支持相关说法。",
    limit: "适合遇到参考文献或事实性结论时查阅；可配合浏览器翻译阅读。",
    url: "https://guides.library.ubc.ca/EvaluatingSources/GenerativeAI",
  },
  {
    id: "datawhale",
    type: "社区选读",
    tag: "进阶社区教程",
    title: "用迭代练习，把提示写得更清楚",
    source: "Datawhale · LLM Cookbook · 中文",
    desc: "社区整理的开发者教程，涵盖提示、总结和转换等主题，可按需要选择章节阅读。",
    limit: "包含 Python、Notebook 与 API 操作。它是进阶选读，不是零代码论文课。",
    url: "https://github.com/datawhalechina/llm-cookbook",
  },
];
const guides = [
  {
    id: "first",
    title: "第一次用 AI 辅助论文，从一个小问题开始",
    desc: "准备背景、提出请求、检查回答，再继续追问。",
    tag: "入门 / 从这里读起",
  },
  {
    id: "outline",
    title: "提纲写好了，怎样让 AI 帮你找问题",
    desc: "用一个课程论文练习，检查范围、逻辑和证据。",
    tag: "方法 / 提纲讨论",
  },
  {
    id: "revise",
    title: "别只说“润色”：看懂每一处修改",
    desc: "把段落目的说清楚，对照建议保留自己的表达。",
    tag: "方法 / 草稿修改",
  },
  {
    id: "connect",
    title: "从 newpaper 到 Sub9api，怎样开始",
    desc: "认识跳转后的 Sloth Code 网站，找到账号与配置入口。",
    tag: "接入 / 使用路径",
  },
];
let scene = 0,
  resourceFilter = "全部";
const promptBox = (text, id) =>
  `<pre class="prompt" id="${id}">${escapeHtml(text)}</pre><button class="copy" data-copy="${id}">复制提问示例</button>`;
function guideCards() {
  return `<div class="cards">${guides.map((g, i) => `<a href="#article/${g.id}" class="guide-card"><span class="number">0${i + 1} / ${g.tag}</span><h3>${g.title}</h3><p>${g.desc}</p><span class="text-link">阅读材料 →</span></a>`).join("")}</div>`;
}
function resourceCards(items) {
  return `<div class="resource-grid">${items.map((r) => `<article class="resource"><span class="badge">${r.tag}</span><h3>${r.title}</h3><div class="by">${r.source}</div><p>${r.desc}</p><div class="caveat">${r.limit}</div><div class="resource-links">${external(r.url, r.video ? "课程与课件" : "阅读原始资料")}${r.video ? external(r.video, "观看第 3 讲") : ""}</div></article>`).join("")}</div>`;
}
function start() {
  return `<div class="start"><div><h2>带上一个问题，开始一次尝试。</h2><p>点击后打开 Sub9api 网站（页面品牌为 Sloth Code）。<br>在那里注册、查看配置指南与可用模型；newpaper 提供学习材料。</p></div>${go()}</div>`;
}
function sceneContent() {
  const s = scenes[scene];
  return `<h3>${s.title}</h3><p>${s.desc}</p><pre class="prompt" id="scene-prompt">${escapeHtml(s.prompt)}</pre><div class="scene-bottom"><button class="copy" data-copy="scene-prompt">复制提问示例</button><a href="#article/${s.article}" class="text-link">看看完整使用方法 →</a></div>`;
}
function home() {
  return `<div class="hero"><div><div class="label">LEARN TO ASK. LEARN TO THINK.</div><h1>写论文的路上，<br><span>多一个 AI 帮手。</span></h1><p class="intro">从读懂材料、讨论提纲，到修改表达。<br>在这里找到方法，带着自己的问题去尝试。</p><div class="actions"><a class="primary" href="#article/first">先读入门材料 →</a>${external("https://slothcode.dev", "前往 Sub9api", "secondary")}</div><p class="fine">newpaper 提供材料与分享 · Sub9api 提供模型接入</p></div><aside class="hero-card"><div class="label">从一个具体问题开始</div><h2>不是只问“怎么写”，<br>也问“哪里还没想清楚”。</h2><div class="note">这是我的主题、课程要求和提纲。<br>请指出范围过大或逻辑跳跃的地方，<br>说明理由，暂时不要替我重写。</div><p>提问示例 · 不是模型实测回答</p><a href="#article/outline">一起拆解这次提问 →</a></aside></div><div class="strip"><span><strong>先学一点</strong>　短教程与可复制的练习</span><span><strong>有据可查</strong>　外部资料注明作者与来源</span><span><strong>再去使用</strong>　直接前往 Sub9api</span></div><section><div class="section-head"><div><h2>你现在卡在哪一步？</h2><p>选一个场景，看看可以怎样开始对话。</p></div><span class="fine">原创提问练习</span></div><div class="scene-shell"><div class="scene-tabs" role="group" aria-label="论文使用场景">${scenes.map((s, i) => `<button data-scene="${i}" aria-pressed="${i === scene}">${s.label}<small>${s.small}</small></button>`).join("")}</div><div class="scene-content" id="scene-content">${sceneContent()}</div></div></section><section><div class="section-head"><div><h2>先读这四份材料</h2><p>不必一次学完，从眼前的任务开始。</p></div><a href="#guides" class="text-link">全部材料 →</a></div>${guideCards()}</section><section class="resources"><div class="section-head"><div><h2>值得打开的外部资料</h2><p>来自课程作者、大学图书馆与开放学习社区。</p></div><a href="#resources" class="text-link">查看全部 5 份 →</a></div>${resourceCards(resources.slice(0, 3))}</section>${start()}<div class="faq"><h2>开始之前，你可能想知道</h2><details><summary>newpaper 和 Sub9api 是什么关系？</summary><p>newpaper 是使用材料与分享入口；点击“前往 Sub9api”会打开 slothcode.dev，其当前页面品牌为 Sloth Code。账号与接入操作在该站完成。</p></details><details><summary>打开 Sub9api 就能直接聊天吗？</summary><p>当前公开首页提供账号、API 密钥与兼容工具的配置路径。请先看它的新手配置教程；本 demo 没有验证登录后的对话界面，不把跳转等同于打开聊天窗口。</p></details><details><summary>这里的材料可以直接用在论文里吗？</summary><p>提问示例可以按自己的任务改写。事实、引用和修改建议需要回到原始材料核对，并按所在课程要求使用和说明 AI。</p></details></div>`;
}
const sources = (ids) =>
  `<h2>延伸阅读</h2><ul>${ids
    .map((id) => {
      let r = resources.find((x) => x.id === id);
      return `<li>${external(r.url, r.title)}<br><span class="fine">${r.source}</span></li>`;
    })
    .join("")}</ul>`;
function articleBody(id) {
  if (id === "first")
    return `<p class="lead">第一次使用，不必让 AI 同时处理整篇论文。先选择一个你能检查结果的小任务，例如解释一段材料。</p><h2>1. 准备三个信息</h2><p>写下你正在做的任务、已经有的材料，以及具体不明白的地方。先用自己的草稿或有权使用的短段落练习。</p><div class="callout">练习设定：你准备写一篇关于校园阅读空间的课程论文，读到一段讨论“空间使用”和“学习投入”的材料，但不理解两者的关系。这是编辑设定的练习，不是真实研究结果。</div><h2>2. 用一个具体问题开始</h2>${promptBox(scenes[0].prompt, "article-prompt")}<h2>3. 检查，而不只是接受</h2><p>把回答中的解释逐句与原文比较：有没有把相关性说成因果？有没有新增材料中不存在的结论？如果无法判断，先标记为待核对。</p><h2>4. 根据回答继续追问</h2><p>例如：“你刚才说的关系，对应原文哪一句？如果原文没有说明，请明确指出。”如果模型无法访问原文，要提供必要的短片段，而不是默认它读过链接。</p><h2>这次练习怎样算有帮助？</h2><p>你能用自己的话解释这个概念，并说出解释来自哪里。若答案只是更长，却仍然无法对照原文，就继续缩小问题。</p>${sources(["lee", "ubc"])}`;
  if (id === "outline")
    return `<p class="lead">让 AI 帮你检查提纲，最有价值的是发现尚未想清楚的地方。先给足背景，再要求说明理由。</p><h2>把问题从“大主题”缩小</h2><div class="callout">原创练习：主题暂定“校园阅读空间与学生学习”。你的提纲是：① 阅读空间的类型；② 学生成绩；③ 改进建议。这里只用来练习检查逻辑，不预设两者存在因果关系。</div><p>比起直接说“帮我完善提纲”，先补充课程篇幅、可用资料和研究对象。AI 才能围绕同一个任务给建议。</p>${promptBox(scenes[1].prompt, "article-prompt")}<h2>阅读建议时，抓住三个问题</h2><ol><li><strong>范围：</strong>在规定篇幅和时间内，能否解释这么大的主题？</li><li><strong>关系：</strong>从阅读空间跳到成绩，有没有缺少定义和中间论证？</li><li><strong>证据：</strong>哪些判断需要调查、观察或文献支持？现有材料能不能支持？</li></ol><h2>再追问一次</h2><p>可以问：“请只挑最影响结构的一处问题，给出两种缩小范围的方向，并说明各自需要什么材料。”由你根据实际能获得的资料选择。</p><p>这里提供的是提问和检查方法，没有使用真实模型生成对比结果，也不代表某个模型一定会给出这些建议。</p>${sources(["academy", "datawhale"])}`;
  if (id === "revise")
    return `<p class="lead">“润色”包含很多不同目标：更简洁、更准确、更连贯。先说清你希望改善哪一点，修改才容易判断。</p><h2>先给出段落的任务</h2><p>例如“这一段要说明研究动机”，并列出不希望改变的术语或观点。请 AI 先找问题，再给改写建议。</p>${promptBox(scenes[2].prompt, "article-prompt")}<h2>用一句话练习核对</h2><div class="callout">原创练习句：“问卷中，一些受访者认为安静的座位有助于集中注意力。”如果建议改为“安静座位显著提升了学生成绩”，就改变了证据强度与研究对象，不能因为句子更有力就采用。</div><h2>逐条决定要不要接受</h2><ol><li>有没有把“可能”“部分”等限定条件删掉？</li><li>有没有新增原稿没有提供的数字、事实或引用？</li><li>改完以后，还是不是你本来要表达的意思？</li></ol><p>把有价值的表达调整留下，把不符合材料的改动退回。必要时追问：“只改善句子衔接，不改变观点、限定条件和证据强度。”</p><h2>保留自己的修改记录</h2><p>保存原稿、请求与最终采用的修改；按课程或学校要求说明 AI 的参与方式。外部指南可作参考，但不能替代本校规定。</p>${sources(["academy", "cuhk"])}`;
  return `<p class="lead">newpaper 帮你了解使用方法。真正的账号与模型接入在 Sub9api 完成，其网站地址是 slothcode.dev，页面名称是 Sloth Code。</p><h2>1. 打开 Sub9api 网站</h2><p>点击下方按钮，在新标签页打开网站。公开首页可以看到“登录”“创建账户”和“新手配置教程”。</p><div class="actions">${go()}</div><h2>2. 根据首页指引开通与配置</h2><p>公开首页展示的路径是：创建 API 密钥、连接常用工具、查看使用明细。配置操作请以网站当前的新手教程为准。</p><div class="actions">${external("https://slothcode.dev/connect", "查看新手配置教程", "secondary")}</div><div class="callout">接入服务和聊天窗口不是一回事。当前首页重点介绍 Codex 与 OpenAI 兼容工具的接入。我们尚未验证登录后的完整路径，因此这里不假设你注册后就能直接聊天。</div><h2>3. 配置完成后，再带上一个练习</h2><p>在你配置好的工具中，粘贴自己的短材料，改写一条 newpaper 提问示例。先用一个小任务检查能否正常使用，再考虑更长的材料。</p><h2>模型与费用在哪里看？</h2><p>以 Sub9api 账号中实际显示的可用分组、模型和价格为准。newpaper 不在这里填写未经确认的模型清单、价格或优惠。</p><div class="disclosure">公开首页核对日期：2026-10-23。已核对首页文案及登录、注册、配置教程入口；未注册账号、未支付、未创建密钥，也未验证真实模型调用。</div>`;
}
function article(id) {
  const g = guides.find((x) => x.id === id);
  if (!g)
    return `<div class="page-heading"><h1>这份材料还没有收录</h1><p><a href="#guides">返回材料列表 →</a></p></div>`;
  return `<div class="article-layout"><article class="article-body"><a href="#guides" class="text-link">← 返回入门材料</a><h1>${g.title}</h1><div class="meta">newpaper 编写 · Demo 内容草案 · ${g.id === "connect" ? "公开入口说明" : "原创方法与练习"}</div>${articleBody(id)}<div class="next">下一步：<a href="${id === "connect" ? "#article/first" : "#article/connect"}">${id === "connect" ? "读第一份入门材料" : "了解怎样前往 Sub9api"}</a></div></article><aside class="aside"><h3>入门材料</h3>${guides.map((x) => `<a href="#article/${x.id}" ${x.id === id ? 'aria-current="page"' : ""}>${x.title}</a>`).join("")}<p>账号与模型接入在 Sub9api 网站完成。</p>${go()}</aside></div>`;
}
function resourcePage() {
  return `<div class="page-heading"><a href="#home" class="text-link">← 返回首页</a><div class="label">CURATED READING</div><h1>把资料读回原始来源。</h1><p>这里整理简短导读与原始链接。选择你需要的主题，打开作者或机构的页面继续阅读。</p></div><div class="filters" role="group" aria-label="资源类型">${["全部", "视频课程", "图文指南", "社区选读"].map((t) => `<button data-filter="${t}" aria-pressed="${resourceFilter === t}">${t}</button>`).join("")}</div><div id="resource-list">${resourceCards(resources.filter((r) => resourceFilter === "全部" || r.type === resourceFilter))}</div><p class="disclosure">整理于 2026-10-23。图文已核对页面内容；视频核对到官方课程目录与链接，未完整观看。本站提供原创导读，不转载完整文章或视频；被列出的作者与机构不代表与 newpaper 有合作或背书关系。</p><section>${start()}</section>`;
}
function render() {
  const hash = location.hash.slice(1) || "home";
  if (hash.startsWith("article/")) app.innerHTML = article(hash.split("/")[1]);
  else if (hash === "guides")
    app.innerHTML = `<div class="page-heading"><a class="text-link" href="#home">← 返回首页</a><div class="label">START SMALL</div><h1>从眼前的一个问题开始。</h1><p>四份短材料，帮助你把论文学习中的任务拆小，再带进一次具体的对话。</p></div><section>${guideCards()}</section>${start()}`;
  else if (hash === "resources") app.innerHTML = resourcePage();
  else app.innerHTML = home();
  document.title =
    (hash.startsWith("article/")
      ? guides.find((x) => x.id === hash.split("/")[1])?.title || "材料"
      : "论文学习与 AI 使用材料") + " · newpaper";
}
let noticeTimer;
function notify(msg) {
  document.getElementById("notice").textContent = msg;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (document.getElementById("notice").textContent = ""), 3000);
}
document.addEventListener("click", async (e) => {
  const s = e.target.closest("[data-scene]");
  if (s) {
    scene = Number(s.dataset.scene);
    document
      .querySelectorAll("[data-scene]")
      .forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.scene) === scene)));
    document.getElementById("scene-content").innerHTML = sceneContent();
    return;
  }
  const f = e.target.closest("[data-filter]");
  if (f) {
    resourceFilter = f.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === resourceFilter)));
    document.getElementById("resource-list").innerHTML = resourceCards(
      resources.filter((r) => resourceFilter === "全部" || r.type === resourceFilter),
    );
    return;
  }
  const c = e.target.closest("[data-copy]");
  if (c) {
    const el = document.getElementById(c.dataset.copy);
    try {
      await navigator.clipboard.writeText(el.textContent);
      notify("已复制，请把占位内容换成自己的材料。");
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      notify("已选中示例，请按 Ctrl+C 或 ⌘C 复制。");
    }
  }
});
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
  app.setAttribute("tabindex", "-1");
  app.focus({ preventScroll: true });
});
render();
