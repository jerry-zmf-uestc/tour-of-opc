export class SimpleWorkflowRunner {
  constructor({ store }) {
    this.store = store;
  }

  runTask(task) {
    if (!['created', 'retrying'].includes(task.status)) {
      return task;
    }
    return this.store.updateTaskStatus({
      task,
      status: 'assigned',
      event_type: 'task_assigned',
      message: `Assigned ${task.type} task to ${task.target_team}`
    });
  }
}
