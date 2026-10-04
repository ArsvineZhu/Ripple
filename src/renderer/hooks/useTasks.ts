import { useState, useEffect } from 'react';

import { storage } from '../lib/storage';
export function useTasks() {
  const [tasks, setTasks] = useState(storage.read('tasks', []));
  const [taskText, setTaskText] = useState('');
  useEffect(() => storage.setItem('tasks', JSON.stringify(tasks)), [tasks]);
  function addTask() {
    if (taskText.trim()) {
      setTasks((prev) => [...prev, taskText.trim()]);
      setTaskText('');
    }
  }
  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }
  return { tasks, taskText, setTaskText, addTask, removeTask };
}
