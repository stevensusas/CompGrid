// src/components/InstanceActions.js
import React from 'react';
import { startInstance, stopInstance, requestInstance } from '../services/api';

function InstanceActions({ instanceName }) {
  const handleStart = async () => {
    await startInstance(instanceName);
    alert(`${instanceName} started.`);
  };

  const handleStop = async () => {
    await stopInstance(instanceName);
    alert(`${instanceName} stopped.`);
  };

  const handleRequest = async () => {
    await requestInstance(instanceName);
    alert(`${instanceName} requested.`);
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
      <button onClick={handleRequest}>Request</button>
    </div>
  );
}

export default InstanceActions;
