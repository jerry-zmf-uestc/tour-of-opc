export const TEAM_TARGETS = {
  dev: 'openclaw-rd-team',
  content: 'openclaw-content-team',
  hybrid: 'team-a-then-b',
  ops: 'opc-router'
};

export const DEFAULT_ROUTES = [
  {
    type: 'hybrid',
    target_team: TEAM_TARGETS.hybrid,
    keywords: ['产品文档', '技术白皮书', '白皮书', '发布说明', '研发方案文章', '研发方案整理']
  },
  {
    type: 'dev',
    target_team: TEAM_TARGETS.dev,
    keywords: ['开发', '修复', 'bug', '接口', '前端', '后端', '部署', '测试', '重构', '代码', 'web app']
  },
  {
    type: 'content',
    target_team: TEAM_TARGETS.content,
    keywords: ['文章', '文档', '公众号', '飞书', '知识库', '初稿', '选题', '内容', 'obsidian']
  },
  {
    type: 'ops',
    target_team: TEAM_TARGETS.ops,
    keywords: ['状态', '审批', '复盘', '重试', '经验']
  }
];

export const classifyTask = (title, options = {}) => {
  const explicitType = options.type?.trim();
  if (explicitType) {
    const route = DEFAULT_ROUTES.find((item) => item.type === explicitType);
    if (!route) {
      throw new Error(`Unsupported task type: ${explicitType}`);
    }
    return { ...route, matched_keyword: null };
  }

  const normalized = String(title || '').toLowerCase();
  for (const route of DEFAULT_ROUTES) {
    const matched = route.keywords.find((keyword) => normalized.includes(keyword.toLowerCase()));
    if (matched) {
      return { ...route, matched_keyword: matched };
    }
  }

  return {
    type: 'content',
    target_team: TEAM_TARGETS.content,
    keywords: [],
    matched_keyword: null
  };
};

export const renderRouterYaml = () => {
  const lines = ['routes:'];
  for (const route of DEFAULT_ROUTES) {
    lines.push(`  ${route.type}:`);
    lines.push(`    target: ${route.target_team}`);
    lines.push('    keywords:');
    for (const keyword of route.keywords) {
      lines.push(`      - ${keyword}`);
    }
  }
  return `${lines.join('\n')}\n`;
};
