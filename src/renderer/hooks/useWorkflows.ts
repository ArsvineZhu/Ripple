import type { Workflow } from '../../shared/contracts';
import { useState } from 'react';

import { openApp } from '../lib/launch';
import { storage } from '../lib/storage';
export function useWorkflows() {
  const [workflows, setWorkflows] = useState(storage.read('workflows', []));
  const [workflowName, setWorkflowName] = useState('');
  const [workflowUrls, setWorkflowUrls] = useState('');
  async function openWorkflow(workflow: Workflow) {
    if (!workflow || !workflow.urls) return;
    for (let i = 0; i < workflow.urls.length; i++) {
      openApp(workflow.urls[i]);
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  function addWorkflow() {
    if (workflowName.trim() && workflowUrls.trim()) {
      const urls = workflowUrls
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url);
      const newWorkflow = { name: workflowName.trim(), urls: urls };
      const updatedWorkflows = [...workflows, newWorkflow];
      setWorkflows(updatedWorkflows);
      storage.setItem('workflows', JSON.stringify(updatedWorkflows));
      setWorkflowName('');
      setWorkflowUrls('');
    }
  }
  function removeWorkflow(index: number) {
    const updatedWorkflows = workflows.filter((_, i) => i !== index);
    setWorkflows(updatedWorkflows);
    storage.setItem('workflows', JSON.stringify(updatedWorkflows));
  }
  return {
    workflows,
    workflowName,
    setWorkflowName,
    workflowUrls,
    setWorkflowUrls,
    openWorkflow,
    addWorkflow,
    removeWorkflow,
  };
}
