// src/App.js
import React from 'react';
import InstanceList from './components/InstanceList';
import InstanceForm from './components/InstanceForm';

function App() {
  return (
    <div>
      <h1>Instance Manager</h1>
      <InstanceForm />
      <InstanceList />
    </div>
  );
}

export default App;
