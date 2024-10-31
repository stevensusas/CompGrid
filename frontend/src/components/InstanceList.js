// src/components/InstanceList.js
import React, { useEffect, useState } from 'react';
import { getInstances } from '../services/api';
import InstanceActions from './InstanceActions';

function InstanceList() {
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getInstances();
      setInstances(data);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2>Instances</h2>
      <ul>
        {instances.map(instance => (
          <li key={instance.instance_name}>
            {instance.instance_name} - {instance.booted ? 'Running' : 'Stopped'}
            <InstanceActions instanceName={instance.instance_name} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InstanceList;
