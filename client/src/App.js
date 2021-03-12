import React, { useState, useEffect } from 'react';
import EnhancedTable from './components/item-table.js';
import axios from 'axios';

function App() {
  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    getAllItems().then((items) => setAllItems(items));
  }, []);

  const getAllItems = async () => {
    const response = await axios.get('/current-items');
    return response.data;
  };

  return (
    <div>
      <EnhancedTable allItems={allItems} />
    </div>
  );
}

export default App;
