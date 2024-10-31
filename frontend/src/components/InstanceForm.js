// src/components/InstanceForm.js
import React, { useState } from 'react';
import { addInstance } from '../services/api';

function InstanceForm() {
  const [instanceData, setInstanceData] = useState({
    instanceName: '',
    systemType: '',
    cpuCoreCount: 1,
    storage: '',
    memory: '',
    ipAddress: '',
    priceTierId: 1
  });

  const handleChange = (e) => {
    setInstanceData({
      ...instanceData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addInstance(instanceData);
    alert('Instance added successfully');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Instance</h2>
      <input name="instanceName" placeholder="Instance Name" onChange={handleChange} required />
      <input name="systemType" placeholder="System Type" onChange={handleChange} required />
      <input name="cpuCoreCount" type="number" placeholder="CPU Core Count" onChange={handleChange} />
      <input name="storage" placeholder="Storage" onChange={handleChange} required />
      <input name="memory" placeholder="Memory" onChange={handleChange} required />
      <input name="ipAddress" placeholder="IP Address" onChange={handleChange} required />
      <input name="priceTierId" type="number" placeholder="Price Tier ID" onChange={handleChange} />
      <button type="submit">Add Instance</button>
    </form>
  );
}

export default InstanceForm;
