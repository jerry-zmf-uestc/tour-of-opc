import { OpcController } from './controller.mjs';
import { defaultWorkspaceRoot, FileTaskStore, registryPathFor } from './task-store.mjs';

export { defaultWorkspaceRoot, registryPathFor };

export const ensureWorkspace = ({ root = defaultWorkspaceRoot() } = {}) =>
  new FileTaskStore({ root }).ensureWorkspace();

export const createTask = ({ root = defaultWorkspaceRoot(), title, type, inputs = {} }) =>
  new OpcController({ root }).createTask({ title, type, inputs });

export const getTaskStatus = ({ root = defaultWorkspaceRoot(), id }) =>
  new OpcController({ root }).getTaskStatus(id);

export const listTasks = ({ root = defaultWorkspaceRoot() } = {}) =>
  new OpcController({ root }).listTasks();

export const approveTask = ({ root = defaultWorkspaceRoot(), id, gate }) =>
  new OpcController({ root }).approveTask({ id, gate });

export const retryTask = ({ root = defaultWorkspaceRoot(), id, reason = '' }) =>
  new OpcController({ root }).retryTask({ id, reason });

export const getTaskEvents = ({ root = defaultWorkspaceRoot(), id }) =>
  new OpcController({ root }).getTaskEvents(id);

export const runTask = ({ root = defaultWorkspaceRoot(), id, wikiRoot }) =>
  new OpcController({ root }).runTask(id, { wikiRoot });

export const publishTask = ({ root = defaultWorkspaceRoot(), id, channel, execute = false }) =>
  new OpcController({ root }).publishTask({ id, channel, execute });

export const syncMemory = ({ root = defaultWorkspaceRoot(), id, memoryRoot } = {}) =>
  new OpcController({ root }).syncMemory({ id, memoryRoot });
