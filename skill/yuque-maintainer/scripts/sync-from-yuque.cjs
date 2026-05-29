#!/usr/bin/env node
require('../skills/yuque-ob-sync/scripts/sync-from-yuque.cjs').main().catch(error => {
  console.error('\n❌ 同步失败:', error.message);
  process.exit(1);
});
