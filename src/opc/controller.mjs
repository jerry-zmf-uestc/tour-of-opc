import { classifyTask } from './router.mjs';
import { defaultWorkspaceRoot, FileTaskStore } from './task-store.mjs';
import { MemorySyncer } from './memory-sync.mjs';
import { ContentPublisher } from './publisher.mjs';
import { ContentWorkflowRunner } from './workflows/content-runner.mjs';
import { SimpleWorkflowRunner } from './workflows/simple-runner.mjs';

export class OpcController {
  constructor({ root = defaultWorkspaceRoot(), store, runner, contentRunner } = {}) {
    this.store = store || new FileTaskStore({ root });
    this.runner = runner || new SimpleWorkflowRunner({ store: this.store });
    this.contentRunner = contentRunner || new ContentWorkflowRunner({ store: this.store });
    this.publisher = new ContentPublisher({ store: this.store });
    this.memorySyncer = new MemorySyncer({ store: this.store });
  }

  init() {
    return this.store.ensureWorkspace();
  }

  createTask({ title, type, inputs = {} }) {
    const route = classifyTask(title, { type });
    const task = this.store.createTaskRecord({ title, route, inputs });
    return this.runner.runTask(task, { route });
  }

  getTaskStatus(id) {
    return this.store.getTaskStatus(id);
  }

  listTasks() {
    return this.store.listTasks();
  }

  approveTask({ id, gate }) {
    return this.store.approveGate({ id, gate });
  }

  retryTask({ id, reason = '' }) {
    const task = this.store.requestRetry({ id, reason });
    return this.runner.runTask(task, { retry: true });
  }

  getTaskEvents(id) {
    return this.store.getTaskEvents(id);
  }

  runTask(id, options = {}) {
    const task = this.store.getTaskStatus(id);
    if (task.type === 'content') {
      return this.contentRunner.runTask(task, options);
    }
    return this.runner.runTask(task, options);
  }

  publishTask({ id, channel, execute = false }) {
    return this.publisher.publishTask({ id, channel, execute });
  }

  syncMemory({ id, memoryRoot } = {}) {
    return this.memorySyncer.syncTask({ id, memoryRoot });
  }
}
