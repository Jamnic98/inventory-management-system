import React, { useState, useEffect } from 'react';
import EnhancedTable from './components/item-table.js';
import axios from 'axios';

const socket = new WebSocket('ws://localhost:5000');

function App() {
  const [allItems, setAllItems] = useState([]);
  const [response, setResponse] = useState('');

  socket.addEventListener('open', async () => {
    setAllItems(await getAllItems());
  });

  socket.addEventListener('message', async (event) => {
    /*     const item = JSON.parse(event.data);
    console.log(item);
    console.log(item.fullDocument.name);
 */ setAllItems(
      await getAllItems()
    );
  });

  const getAllItems = async () => {
    const response = await axios.get('/current-items');
    return response.data;
  };

  const addItem = async () => {
    const item = {
      name: 'fairy liquid',
      quantity: 1,
      room: 'kitchen',
      location: 'under sink cupboard',
      expirationDate: new Date(),
      lowStockAlert: true,
    };
    const response = await axios.post('/current-items/add', item);
    setResponse(response.data);
  };

  return (
    <div>
      {response}
      <button onClick={addItem}>add</button>
      <EnhancedTable allItems={allItems} />
    </div>
  );
}

export default App;
