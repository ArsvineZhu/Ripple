import type { Workflow } from '../../shared/contracts';
import { useState } from 'react';

import { openApp } from '../lib/launch';
import { splitWorkflowTargets } from '../lib/workflowTargets';
import { useAppState } from '../components/AppStateProvider';
export function useWorkflows() {
  const { state, updateState } = useAppState();
  const workflows = state.workflows;
  const [workflowName, setWorkflowName] = useState('');
  const [workflowUrls, setWorkflowUrls] = useState('');
  async function openWorkflow(workflow: Workflow) {
    if (!workflow || !workflow.urls) return;
    const failures: unknown[] = [];
    for (let i = 0; i < workflow.urls.length; i++) {
      try {
        await openApp(workflow.urls[i]);
      } catch (error) {
        failures.push(error);
      }
      if (i < workflow.urls.length - 1) await new Promise((r) => setTimeout(r, 400));
    }
    if (failures.length)
      throw new AggregateError(failures, 'Could not launch all workflow targets');
  }
  function addWorkflow() {
    const name = workflowName.trim();
    const urls = splitWorkflowTargets(workflowUrls);
    if (name && urls.length > 0) {
      const newWorkflow = { name, urls };
      updateState({ workflows: [...workflows, newWorkflow] });
      setWorkflowName('');
      setWorkflowUrls('');
    }
  }
  function removeWorkflow(index: number) {
    updateState({ workflows: workflows.filter((_, i) => i !== index) });
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
