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
export const articleBodies: Record<string, string> = {
  first: `第一次使用，不必让 AI 同时处理整篇论文。选择一个你能检查结果的小任务，例如解释一段材料。

## 1. 准备任务、材料和疑问
写下课程任务、已经有的材料，以及具体不明白的地方。先用自己的草稿或有权使用的短段落练习，不上传个人信息或未经授权的研究数据。

原创练习：你正在写关于校园阅读空间的课程论文，读到“空间使用”和“学习投入”的讨论，但不理解两者的关系。这是练习设定，不是真实研究结果。

## 2. 把材料放进一次明确的请求
在已经配置好的 Codex 工具中，提供必要的短片段或明确指定可读取的文件。说明只需要解释与建议，暂时不要修改文件。不要默认工具已经访问过某个链接或读过你的全部材料。

## 3. 对照原文检查
有没有把相关性说成因果？有没有新增原文不存在的结论？不能判断的地方，标记为待核对。可以追问：“这个解释对应原文哪一句？原文没有说明的地方请明确指出。”

## 4. 用自己的话说出来
一次有效练习的目标是：你能解释这个概念，也能指出解释来自哪里。回答变长不等于理解加深；仍然困惑时，继续缩小问题。`,
  outline: `让 AI 帮你检查提纲，价值在于发现尚未想清楚的地方。先给背景，再要求解释理由。

## 从大主题缩到可完成的任务
原创练习主题：“校园阅读空间与学生学习”。初步提纲：阅读空间类型、学生成绩、改进建议。这里不预设空间与成绩存在因果关系。

把课程篇幅、可用资料和研究对象写进请求。若使用项目文件，明确指出提纲文件与课程要求文件，并先要求只读检查。

## 抓住三个问题
- **范围**：规定篇幅与时间内，能否解释这么大的主题？
- **关系**：从阅读空间跳到成绩，是否缺少定义和中间论证？
- **证据**：哪些判断需要调查、观察或文献支持？已有材料是否足够？

## 再追问一次
“只挑最影响结构的一处问题，给出两种缩小范围的方向，并说明各自需要什么材料。”由你根据实际可获得的资料选择。

这些是原创提问练习，不是模型实测结果，也不承诺特定模型一定给出某种建议。`,
  revise: `“润色”可能意味着简洁、准确或连贯。先说明要改善哪一点，建议才容易判断。

## 先说段落的目的
例如“这一段要说明研究动机”，再列出必须保留的术语和观点。先请工具指出问题，再决定是否允许修改文件。

## 核对证据强度
原创练习句：“问卷中，一些受访者认为安静的座位有助于集中注意力。”若改为“安静座位显著提升了学生成绩”，就改变了证据强度与研究对象，不能只因为句子更有力而采用。

## 逐条决定是否接受
- 有没有删掉“可能”“部分”等限定条件？
- 有没有新增原稿没有提供的数字、事实或引用？
- 修改后是否仍是你想表达的意思？

若允许 Codex 修改文件，先保留原稿，再检查实际差异。可以要求：“只改善衔接，不改变观点、限定条件和证据强度。”

## 保留记录
保存原稿、请求和最终采用的修改；按课程或学校要求说明 AI 的参与方式。外部指南不能替代本校规定。`,
  connect: `newpaper 提供学习材料与原创练习；Sloth Code 是独立的外部服务入口。点击外链会在新标签页打开 slothcode.dev。

## 1. 先完成工具配置
如需通过 Sloth Code 接入，请以该站当前配置指南为准。账号、支持的工具与具体接入方式均由外站说明。newpaper 不在本页提供聊天、账户、密钥或付款功能。

## 2. 准备一个可检查的小任务
在已经配置好的 Codex 工具中，提供自己的短段落或明确指定材料文件。写清目标、背景和边界，例如：“只读材料并指出提纲中最需要补证据的一处，先不要修改文件。”

## 3. 检查结果，再决定下一步
将解释与原始材料对照。若涉及文件修改，先保留原稿，检查实际改动，再决定采用哪些建议。不要把生成的引用当作已经核实的文献。

## 使用边界
这些练习用于学习任务拆解、材料核对和修改判断，并不证明某个工具适合你的全部论文流程。请遵守学校的学术规范，不上传隐私或未经授权的数据。产品功能和配置以官方说明与实际环境为准。`,
}
