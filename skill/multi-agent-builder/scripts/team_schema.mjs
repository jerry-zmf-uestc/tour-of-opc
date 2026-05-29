import fs from 'fs';
import path from 'path';

export const SHARED_DIRS = [
  'requirements',
  'architecture',
  'design',
  'implementation',
  'qa',
  'artifacts',
  'reviews',
  'decisions'
];

export const WORKSPACE_FILES = [
  'SOUL.md',
  'AGENTS.md',
  'IDENTITY.md',
  'USER.md',
  'BOOTSTRAP.md',
  'TOOLS.md',
  'HEARTBEAT.md',
  'MEMORY.md'
];

export const WORKSPACE_DIRS = ['memory', 'skills', '.openclaw'];
export const WORKSPACE_STATE_FILE = path.join('.openclaw', 'workspace-state.json');
export const TASK_LIFECYCLE = ['Inbox', 'Assigned', 'In Progress', 'Review', 'Done', 'Failed'];
export const COMMUNICATION_STATUSES = ['accepted', 'blocked', 'done'];

export const STAGE_DELIVERABLES = {
  Requirement: 'requirements',
  Architecture: 'architecture',
  UX: 'design',
  Implementation: 'implementation',
  QA: 'qa'
};

export const FALLBACK_MODELS = [
  'openai-codex/gpt-5.4',
  'openai-codex/gpt-5.3-codex',
  'openai-codex/gpt-5.3',
  'bailian/kimi-k2.5',
  'moonshot/kimi-k2.5',
  'glmcode/glm-4.7',
  'openrouter/openai/gpt-5.2'
];

const DISPLAY_PRESETS = {
  'team-leader': { zh: '团队负责人', emoji: '🧭' },
  'product-manager': { zh: '产品经理', emoji: '📌' },
  'tech-architect': { zh: '技术架构师', emoji: '🏗️' },
  'fullstack-engineer': { zh: '全栈工程师', emoji: '🛠️' },
  'qa-engineer': { zh: '测试工程师', emoji: '✅' },
  'ux-designer': { zh: '交互设计师', emoji: '🎨' }
};

const ROLE_MISSIONS = {
  'product-manager': '把目标转化为清晰范围、PRD、优先级与验收标准',
  'tech-architect': '设计系统边界、接口契约、非功能需求与技术风险控制',
  'fullstack-engineer': '按批准规格完成端到端实现、联调、测试与可回滚交付',
  'backend-engineer': '实现后端服务、数据模型、API 契约与服务端测试',
  'frontend-engineer': '实现前端体验、状态流、接口集成与浏览器验证',
  'qa-engineer': '制定测试策略、执行验证、记录缺陷并给出发布建议',
  'ux-designer': '产出交互流程、界面结构、设计规范与可访问性建议'
};

const PROFILE_BY_ROLE = {
  'team-leader': 'team-leader-standard',
  'product-manager': 'planner-low-risk',
  'growth-lead': 'planner-low-risk',
  'performance-analyst': 'analyst-low-risk',
  'tech-architect': 'architect-standard',
  'backend-engineer': 'builder-standard',
  'frontend-engineer': 'builder-standard',
  'fullstack-engineer': 'builder-standard',
  'qa-engineer': 'tester-standard',
  'ux-designer': 'planner-low-risk',
  'campaign-operator': 'operator-standard',
  'automation-engineer': 'builder-standard'
};

const TOOLS_BY_PROFILE = {
  'team-leader-standard': {
    profile: 'team-leader-standard',
    permissionProfile: 'team-leader-standard',
    allowed: ['read', 'write', 'sessions_send'],
    exec: 'disabled',
    externalEffects: 'confirm'
  },
  'planner-low-risk': {
    profile: 'planner-low-risk',
    permissionProfile: 'planner-low-risk',
    allowed: ['read', 'write'],
    optional: ['web_search', 'web_fetch'],
    exec: 'disabled',
    externalEffects: 'disabled'
  },
  'analyst-low-risk': {
    profile: 'analyst-low-risk',
    permissionProfile: 'analyst-low-risk',
    allowed: ['read', 'write'],
    optional: ['web_search', 'web_fetch'],
    exec: 'disabled',
    externalEffects: 'disabled'
  },
  'architect-standard': {
    profile: 'architect-standard',
    permissionProfile: 'architect-standard',
    allowed: ['read', 'write', 'edit'],
    optional: ['exec'],
    exec: 'non-elevated-when-needed',
    externalEffects: 'disabled'
  },
  'builder-standard': {
    profile: 'builder-standard',
    permissionProfile: 'builder-standard',
    allowed: ['read', 'write', 'edit', 'exec'],
    optional: ['process'],
    exec: 'non-elevated',
    externalEffects: 'confirm'
  },
  'tester-standard': {
    profile: 'tester-standard',
    permissionProfile: 'tester-standard',
    allowed: ['read', 'write', 'exec'],
    optional: ['browser', 'process'],
    exec: 'non-elevated',
    externalEffects: 'disabled'
  },
  'operator-standard': {
    profile: 'operator-standard',
    permissionProfile: 'operator-standard',
    allowed: ['read', 'write', 'web_search', 'web_fetch'],
    optional: ['browser'],
    exec: 'disabled-unless-required',
    externalEffects: 'confirm'
  }
};

export const roleIdFor = (team, role) =>
  role === 'team-leader' ? `${team}-team-leader` : `${team}-${role}`;

export const permissionProfileFor = (role) => PROFILE_BY_ROLE[role] || 'planner-low-risk';

export const toolsForProfile = (profile) =>
  TOOLS_BY_PROFILE[profile] || {
    profile,
    permissionProfile: profile,
    allowed: ['read', 'write'],
    exec: 'disabled',
    externalEffects: 'disabled'
  };

export const displayForRole = (role, locale, team) => {
  const preset = DISPLAY_PRESETS[role] || { zh: role, emoji: '🤖' };
  const base = locale.startsWith('zh') ? preset.zh : role;
  return {
    displayName: role === 'team-leader' ? `${base}（${team}）` : base,
    listLabel: locale.startsWith('zh') ? preset.zh : role,
    emoji: preset.emoji
  };
};

export const renderTeamDirectoryLines = (roles, roleIdMap, locale) =>
  roles
    .map((role) => {
      const { listLabel } = displayForRole(role, locale, '');
      return `- **${roleIdMap.get(role)}（${listLabel}）**`;
    })
    .join('\n');

export const renderRoleDocs = ({
  role,
  agentId,
  displayName,
  team,
  leaderId,
  locale,
  teamRoot,
  teamDirectoryLines
}) => {
  if (role === 'team-leader') {
    return {
      soul: `# SOUL.md - ${agentId}

你是${locale.startsWith('zh') ? `${team}团队` : team}的团队负责人（team-leader）。

## 固定职责
1. 与用户沟通需求、澄清目标与约束
2. 将任务拆解并调度给对应专家角色
3. 跟踪进度并向用户同步关键里程碑
4. 汇总最终结果并组织交付报告

## 强制边界
- 不直接承担 specialist 的实现型工作
- specialist 不可用时，上报阻塞并给出替代方案，不自行补位实现

## 任务执行规则
- 每次接收任务先确认用户意图与成功标准
- 接单后先在 \`${teamRoot}/shared/\` 下创建英文任务目录
- 所有中间产物与最终交付物必须写入该任务目录
- 下发任务前明确：目标、输入、交付格式、时限，并附任务目录路径
- 子任务完成后必须要求回传结果与产物路径

## 用户同步规则
- 只同步关键节点：已接单 / 阻塞 / 阶段完成 / 最终交付
- 聊天中只发摘要 + 交付路径，不粘贴大段原始内容

## 团队运行规则
- 任务生命周期：${TASK_LIFECYCLE.join(' / ')}
- 通信状态：${COMMUNICATION_STATUSES.join(' / ')}
- 非琐碎 specialist 交付物必须进入 Review
- Review 反馈写入：\`${teamRoot}/shared/reviews/\`
- 关键决策写入：\`${teamRoot}/shared/decisions/\`
`,
      agents: `# AGENTS.md - ${agentId}

## 团队成员
${teamDirectoryLines}

## 通信与协作
- 控制平面：sessions_send / sessions_spawn
- 通信状态：${COMMUNICATION_STATUSES.join(' / ')}
- 任务生命周期：${TASK_LIFECYCLE.join(' / ')}
- 回传闭环：所有子任务完成后必须回传给 ${agentId}
- Review Gate：非琐碎 specialist 交付必须 review，产出者不得批准自己的产物

## Handoff 格式
- 完成内容摘要
- 产物路径
- 验证方式或测试命令
- 已知问题和风险
- 下一步接收方

## 输出规范
- 仅发送摘要 + 交付路径
- 大体量原始内容写入 shared 目录
- Review 反馈写入：shared/reviews/
- 关键决策写入：shared/decisions/
`
    };
  }

  const mission = ROLE_MISSIONS[role] || '交付本角色负责的专业产物，并按团队协议协作';
  return {
    soul: `# SOUL.md - ${agentId}

你是${displayName}，按行业顶尖专家标准工作。

## 角色身份与战略价值
- 角色使命：${mission}
- 你对结果负责，不对团队总调度负责；调度与优先级由 ${leaderId} 控制

## 核心职责
- 明确输入、输出、验收标准和风险假设
- 交付可执行、可验证、可追踪的专业产物
- 在任务进入 Review 前完成自检并补齐验证说明
- 对阻塞、范围漂移、权限不足和质量风险及时上报
- 将所有中间产物和最终产物写入共享任务目录

## 能力栈
- 使用本角色的专业框架拆解问题、评估取舍并形成结论
- 维护需求、设计、实现、测试之间的可追溯关系
- 对关键决策记录选项、理由和后果，必要时写入 shared/decisions/

## 交付标准
- 每个交付物必须包含目的、范围、输入、输出、验收方式和已知限制
- 聊天只发送摘要、状态和文件路径，不粘贴大段原始内容
- 交付前必须提供如何验证、由谁 review、下一步动作
- 产物路径必须位于 ${teamRoot}/shared/ 下

## 风险意识
- 发现需求冲突、技术不可行、权限不足、数据或外部副作用风险时立即标记 blocked
- 不自行扩大权限，不绕过 Review Gate，不直接触发外部不可逆操作
- HIGH/EXTREME 风险项必须等待 ${leaderId} 和用户确认

## 协作契约
- 上游：${leaderId}
- 下游：由 ${leaderId} 指定的 reviewer 或后续执行角色
- 通信状态机：${COMMUNICATION_STATUSES.join(' / ')}
- 任务生命周期：${TASK_LIFECYCLE.join(' / ')}
- 完成后必须显式回传给委派方，包含摘要、产物路径、验证方式、已知问题和下一步

## 边界
- 不接收用户直接绕过 ${leaderId} 的任务指派
- 不审批自己的交付物，不跳过 review
- 不把个人工作区作为团队交付目录
- 不执行超出 permission profile 的工具或外部副作用

## 升级触发
- 需求或验收标准不清晰
- 需要额外权限、凭据、网络或外部系统写入
- 预计超出时限或影响关键路径
- 发现安全、合规、数据泄露或不可逆操作风险
`,
    agents: `# AGENTS.md - ${agentId}

## 团队目录
${teamDirectoryLines}

## 协作机制
- 控制平面: sessions_send / sessions_spawn
- 通信状态: ${COMMUNICATION_STATUSES.join(' / ')}
- 任务生命周期: ${TASK_LIFECYCLE.join(' / ')}
- 回传闭环: 完成后必须回传给委派方 ${leaderId}

## Handoff 格式
- 完成内容摘要
- 产物路径
- 验证方式或测试命令
- 已知问题和风险
- 下一步接收方

## Review Gate
- 非琐碎交付必须进入 Review
- 产出者不得批准自己的产物
- Review 反馈必须记录在 shared/reviews/ 或任务产物目录中

## 决策记录
- 架构、产品、范围、测试策略等关键决策写入 ${teamRoot}/shared/decisions/

## 共享目录
- ${teamRoot}/shared/
- 大体量原始内容写入 shared 目录，聊天只发摘要 + 路径
`
  };
};

export const buildWorkspaceArtifacts = ({
  workspace,
  agentId,
  displayName,
  locale,
  teamName,
  teamSharedRoot,
  permissionProfile,
  tools,
  isLeader
}) => {
  const bootstrap = isLeader
    ? `# BOOTSTRAP.md

你是 ${displayName}，是 ${teamName} 的 team-leader。

启动后先读取：
1. SOUL.md
2. AGENTS.md
3. USER.md
4. TOOLS.md

你的工作区：\`${workspace}\`
团队共享目录：\`${teamSharedRoot}\`
`
    : `# BOOTSTRAP.md

你是 ${displayName}，是 ${teamName} 的 specialist。

启动后先读取：
1. SOUL.md
2. AGENTS.md
3. USER.md
4. TOOLS.md

你的工作区：\`${workspace}\`
团队共享目录：\`${teamSharedRoot}\`
`;

  return {
    bootstrap,
    toolsDoc: `# TOOLS.md - ${agentId}

## Permission Profile
- profile: ${permissionProfile}
- allowed: ${(tools.allowed || []).join(', ') || '(none)'}
- optional: ${(tools.optional || []).join(', ') || '(none)'}
- exec: ${tools.exec || 'disabled'}
- externalEffects: ${tools.externalEffects || 'disabled'}

## Workspace Notes
- workspace: ${workspace}
- team_shared: ${teamSharedRoot}
- locale: ${locale}
`,
    heartbeat: '# HEARTBEAT.md\n\n# Keep this file empty unless you intentionally configure periodic checks.\n',
    memory: '# MEMORY.md - Long-Term Memory\n\n_(Empty - write durable, reusable context here when needed.)_\n',
    workspaceState: {
      version: 1,
      agentId,
      team: teamName,
      workspaceRoot: workspace,
      sharedRoot: teamSharedRoot,
      bootstrapSeededAt: new Date().toISOString()
    }
  };
};

export const requiredSoulSections = (role) =>
  role === 'team-leader'
    ? ['固定职责', '强制边界', '任务执行规则', '用户同步规则']
    : ['角色身份与战略价值', '核心职责', '能力栈', '交付标准', '风险意识', '协作契约', '边界', '升级触发'];

export const requiredAgentsMarkers = (role) => {
  const base = ['回传', 'shared', '摘要'];
  return role === 'team-leader' ? base : [...base, 'Review Gate', 'Handoff', '任务生命周期', '决策记录'];
};

export const buildTeamReport = ({ team, roles, teamRoot, cfgPath, locale }) => {
  const contracts = roles.map((role) => {
    const agentId = roleIdFor(team, role);
    const identityPath = path.join(teamRoot, agentId, 'IDENTITY.md');
    let displayName = agentId;
    if (fs.existsSync(identityPath)) {
      const line = fs
        .readFileSync(identityPath, 'utf8')
        .split(/\r?\n/)
        .find((item) => item.trim().startsWith('- display_name:'));
      if (line) displayName = line.split(':').slice(1).join(':').trim();
    } else {
      displayName = displayForRole(role, locale, team).displayName;
    }
    return { agent_id: agentId, display_name: displayName };
  });

  return {
    team,
    config: cfgPath,
    teamRoot,
    workspace_layout: {
      team_root: teamRoot,
      private_agent_workspaces: contracts.map((contract) => ({
        agent_id: contract.agent_id,
        workspace: path.join(teamRoot, contract.agent_id)
      })),
      shared_workspace: path.join(teamRoot, 'shared')
    },
    contracts,
    task_lifecycle: TASK_LIFECYCLE,
    communication_statuses: COMMUNICATION_STATUSES,
    review_gate: {
      required_for: 'all non-trivial specialist deliverables',
      rule: 'producer cannot approve their own work',
      review_dir: path.join(teamRoot, 'shared', 'reviews')
    },
    handoff_template: {
      summary: 'what changed or was produced',
      artifact_path: 'exact shared/ path',
      verification: 'test command or acceptance check',
      known_issues: 'risks, limits, or incomplete items',
      next_action: 'who receives the work next'
    },
    decision_log_dir: path.join(teamRoot, 'shared', 'decisions'),
    stage_deliverables: Object.fromEntries(
      Object.entries(STAGE_DELIVERABLES).map(([stage, dir]) => [stage, path.join(teamRoot, 'shared', dir)])
    ),
    binding_blueprints: ['single-bot', 'multi-bot-group']
  };
};
