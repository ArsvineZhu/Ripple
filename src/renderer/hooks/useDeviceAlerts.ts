import type { Dispatch, SetStateAction } from 'react';
import type { IslandMode } from '../../shared/contracts';
import { useState, useEffect, useRef } from 'react';

export function useDeviceAlerts(setMode: Dispatch<SetStateAction<IslandMode>>) {
  const [bluetooth, setBluetooth] = useState(false);
  const [bluetoothAlert, setBluetoothAlert] = useState(false);
  const [cameraInUse, setCameraInUse] = useState(false);
  const [cameraAlert, setCameraAlert] = useState(false);
  const [microphoneInUse, setMicrophoneInUse] = useState(false);
  const [microphoneAlert, setMicrophoneAlert] = useState(false);
  const captureAlertQueue = useRef<('camera' | 'microphone')[]>([]);
  const captureAlertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureAlertDisplayed = useRef({ camera: false, microphone: false });
  useEffect(() => {
    const fetchBluetooth = async () => {
      if (window.electronAPI?.getBluetoothStatus) {
        try {
          const isConnected = await window.electronAPI.getBluetoothStatus();
          setBluetooth(isConnected);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchBluetooth();
    const interval = setInterval(fetchBluetooth, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (bluetooth === true) {
      setMode('quick');
      setBluetoothAlert(true);
      const timerId = setTimeout(() => {
        setMode('still');
        setBluetoothAlert(false);
      }, 3000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [bluetooth, setMode]);
  useEffect(() => {
    const fetchCamera = async () => {
      if (window.electronAPI?.getCameraStatus) {
        try {
          const inUse = await window.electronAPI.getCameraStatus();
          setCameraInUse(inUse);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchCamera();
    const interval = setInterval(fetchCamera, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const fetchMicrophone = async () => {
      if (window.electronAPI?.getMicrophoneStatus) {
        try {
          const inUse = await window.electronAPI.getMicrophoneStatus();
          setMicrophoneInUse(inUse);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMicrophone();
    const interval = setInterval(fetchMicrophone, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const processCaptureQueue = () => {
      if (captureAlertTimer.current || captureAlertQueue.current.length === 0) return;
      const nextAlert = captureAlertQueue.current.shift();
      if (!nextAlert) return;

      setMode('quick');
      if (nextAlert === 'camera') {
        setCameraAlert(true);
      } else {
        setMicrophoneAlert(true);
      }

      captureAlertTimer.current = setTimeout(() => {
        if (nextAlert === 'camera') {
          setCameraAlert(false);
        } else {
          setMicrophoneAlert(false);
        }
        captureAlertTimer.current = null;
        if (captureAlertQueue.current.length > 0) {
          processCaptureQueue();
        } else {
          setMode('still');
        }
      }, 3000);
    };

    if (cameraInUse && !captureAlertDisplayed.current.camera) {
      captureAlertQueue.current.push('camera');
      captureAlertDisplayed.current.camera = true;
    }
    if (!cameraInUse) {
      captureAlertDisplayed.current.camera = false;
    }

    if (microphoneInUse && !captureAlertDisplayed.current.microphone) {
      captureAlertQueue.current.push('microphone');
      captureAlertDisplayed.current.microphone = true;
    }
    if (!microphoneInUse) {
      captureAlertDisplayed.current.microphone = false;
    }

    captureAlertQueue.current = captureAlertQueue.current.filter((item) => {
      if (item === 'camera' && !cameraInUse) return false;
      if (item === 'microphone' && !microphoneInUse) return false;
      return true;
    });

    processCaptureQueue();

    return () => {
      if (!cameraInUse && !microphoneInUse) {
        if (captureAlertTimer.current) {
          clearTimeout(captureAlertTimer.current);
          captureAlertTimer.current = null;
        }
        captureAlertQueue.current = [];
      }
    };
  }, [cameraInUse, microphoneInUse, setMode]);
  return { bluetoothAlert, cameraInUse, cameraAlert, microphoneInUse, microphoneAlert };
}
