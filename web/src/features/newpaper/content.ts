/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
// Original Chinese learning materials, adapted from the Newpaper editorial demo.
export const scenes = [
  {
    label: '读懂一段材料',
    small: '从概念与论证入手',
    title: '不急着总结，先弄清这段话在说什么。',
    desc: '贴入你有权使用的短段落，指出具体疑问。解释后，再对照原文检查。',
    prompt:
      '我正在阅读一段与课程论文有关的材料：\n【粘贴短段落】\n\n我不理解的地方是：【具体疑问】。\n请只根据这段材料，解释关键概念和论证关系；指出哪些信息原文没有说明，不要补写作者的结论。',
    article: 'first',
  },
  {
    label: '讨论论文提纲',
    small: '找范围与逻辑缺口',
    title: '让 AI 先找问题，再由你决定怎么改。',
    desc: '带上课程要求与已有提纲，要求逐条解释问题，而不是直接生成整篇正文。',
    prompt:
      '我的课程论文主题是：【主题】。\n课程要求：【要求】。已有提纲：【提纲】。\n请检查选题范围、各部分之间的逻辑，以及还缺少哪些证据。\n按“问题—理由—我需要补充的信息”列出建议，暂时不要替我重写。',
    article: 'outline',
  },
  {
    label: '修改草稿表达',
    small: '知道为什么改',
    title: '比“帮我润色”再具体一点。',
    desc: '先明确段落的目的，让每一处建议都可对照、可取舍。',
    prompt:
      '下面这段文字想表达：【段落目的】。\n原文：【你的草稿】。\n请指出含糊、重复或逻辑跳跃的地方，并用“原句—修改建议—理由”的形式反馈。\n保留我的观点与专业术语，不添加新的事实或文献。',
    article: 'revise',
  },
]

export const resources = [
  {
    id: 'lee',
    type: '视频课程',
    tag: '中文课程',
    title: '从“怎么问”开始理解生成式 AI',
    source: '李宏毅 · 台湾大学 · 2024 年课程',
    desc: '可先看第 3 讲，了解提示和提供更多信息的思路。课程主页同时提供课件与视频目录。',
    limit:
      '入门原理课，并非论文写作专课。视频在 YouTube；已核对官方目录，未完整观看。',
    url: 'https://speech.ee.ntu.edu.tw/~hylee/genai/2024-spring.php',
    video: 'https://youtu.be/A3Yx35KrSN0',
  },
  {
    id: 'academy',
    type: '图文指南',
    tag: '学生提示示例',
    title: '看看学生可以怎样提出具体请求',
    source: 'OpenAI Academy · Juliann Igo · 英文',
    desc: '涵盖作文反馈、研究材料整理等提问例子。适合观察如何交代任务和预期反馈。',
    limit:
      '原文面向 ChatGPT Edu；可借鉴任务拆解与提问方式，不代表 Codex 或 Sloth Code 提供相同产品功能。',
    url: 'https://academy.openai.com/en/public/clubs/higher-education-05x4z/resources/prompt-pack-for-students',
  },
  {
    id: 'cuhk',
    type: '图文指南',
    tag: '中文引文指南',
    title: '使用了 AI，引用和记录怎样整理？',
    source: '香港中文大学（深圳）图书馆 · 中文',
    desc: '从引用、转述与概述的区别，读到生成式 AI 的引用和使用记录建议。',
    limit: '最终要求以你的学校、课程或期刊规定为准。',
    url: 'https://library.cuhk.edu.cn/zh-hans/citation-guides',
  },
  {
    id: 'ubc',
    type: '图文指南',
    tag: '信息核对',
    title: 'AI 给出的引用，先查回原文',
    source: 'UBC 图书馆 · 英文',
    desc: '介绍如何交叉核对 AI 提供的信息，确认引用是否存在、原文是否支持相关说法。',
    limit: '适合遇到参考文献或事实性结论时查阅；可配合浏览器翻译阅读。',
    url: 'https://guides.library.ubc.ca/EvaluatingSources/GenerativeAI',
  },
  {
    id: 'datawhale',
    type: '社区选读',
    tag: '进阶社区教程',
    title: '用迭代练习，把提示写得更清楚',
    source: 'Datawhale · LLM Cookbook · 中文',
    desc: '社区整理的开发者教程，涵盖提示、总结和转换等主题，可按需要选择章节阅读。',
    limit:
      '包含 Python、Notebook 与 API 操作。它是进阶选读，不是零代码论文课。',
    url: 'https://github.com/datawhalechina/llm-cookbook',
  },
  {
    id: 'codex',
    type: '视频课程',
    tag: '官方演示',
    title: '观察 Codex 的实际工作流程',
    source: 'OpenAI Developers · 官方视频 · 英文',
    desc: '从官方精选视频了解 Codex 演示，再回到自己的小任务中练习说明目标与检查结果。',
    limit:
      '产品演示并非论文写作课程；功能与使用方式以官方最新说明和实际配置为准。',
    url: 'https://developers.openai.com/learn/videos',
  },
]

export const guides = [
  {
    id: 'first',
    title: '第一次用 AI 辅助论文，从一个小问题开始',
    desc: '准备背景、提出请求、检查回答，再继续追问。',
    tag: '入门 / 从这里读起',
  },
  {
    id: 'outline',
    title: '提纲写好了，怎样让 AI 帮你找问题',
    desc: '用一个课程论文练习，检查范围、逻辑和证据。',
    tag: '方法 / 提纲讨论',
  },
  {
    id: 'revise',
    title: '别只说“润色”：看懂每一处修改',
    desc: '把段落目的说清楚，对照建议保留自己的表达。',
    tag: '方法 / 草稿修改',
  },
  {
    id: 'connect',
    title: '把学习任务带进 Codex：先准备，再检查',
    desc: '准备材料、说明边界，在配置好的工具中完成一次可检查的练习。',
    tag: '实践 / Codex 工作流',
  },
]
