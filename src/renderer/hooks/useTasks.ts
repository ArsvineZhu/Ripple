import { useState } from 'react';
import { useAppState } from '../components/AppStateProvider';
export function useTasks() {
  const { state, updateState } = useAppState();
  const tasks = state.tasks;
  const [taskText, setTaskText] = useState('');
  function addTask() {
    if (taskText.trim()) {
      updateState({ tasks: [...tasks, taskText.trim()] });
      setTaskText('');
    }
  }
  function removeTask(index: number) {
    updateState({ tasks: tasks.filter((_, i) => i !== index) });
  }
  return { tasks, taskText, setTaskText, addTask, removeTask };
}
