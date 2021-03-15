import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import PageHeader from './components/page-header.js';
import ExpiringSoonPanel from './components/expiring-soon-panel.js';
import LowStockPanel from './components/low-stock-panel.js';
import EnhancedTable from './components/enhanced-table.js';
import axios from 'axios';
import Typography from '@material-ui/core/Typography';

const socket = new WebSocket('ws://192.168.68.116:8080');

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
}));

function App() {
  const classes = useStyles();
  // const expirationDate = new Date().toLocaleDateString('en-GB');
  const [allItems, setAllItems] = useState([]);
  const [response, setResponse] = useState('');

  useEffect(() => {
    getAllItems().then((items) => setAllItems(items));
  }, []);

  socket.addEventListener('message', async () => {
    setAllItems(await getAllItems());
  });

  const getAllItems = async () => {
    const response = await axios.get('/current-items');
    return response.data.reverse();
  };

  const addItem = async () => {
    try {
      const item = {
        name: 'flash bleach',
        quantity: 1,
        room: 'kitchen',
        location: 'under sink cupboard',
        expirationDate: new Date(),
        lowStockAlert: true,
      };
      const response = await axios.post('/current-items/add', item);
      setAllItems([...allItems, response.data]);
      socket.send('add');
    } catch (error) {
      console.error(error);
    }
  };

  const deleteItemById = async (itemId) => {
    try {
      await axios.delete(`/current-items/${itemId}`);
      socket.send('delete');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <PageHeader>
        <div className={classes.root}>
          <Grid
            spacing={2}
            container
            justify='space-evenly'
            direction='row'
            alignItems='center'
          >
            <Grid item xs={12}>
              <Typography variant='h5'>All Items</Typography>
              <Paper>
                <EnhancedTable
                  addItem={addItem}
                  deleteItemById={deleteItemById}
                  allItems={allItems}
                  setAllItems={setAllItems}
                />
              </Paper>
            </Grid>
            <Grid
              container
              item
              xs={12}
              spacing={2}
              justify='flex-start'
              direction='row'
              alignItems='flex-start'
            >
              <Grid xs={9} lg={10} xl={11} item>
                <Typography variant='h6'>
                  Expiring Soon{/*  (after {expirationDate}) */}
                </Typography>
                <ExpiringSoonPanel tableData={allItems} />
              </Grid>
              <Grid xs={3} lg={2} xl={1} item>
                <Typography variant='h6'>Low Stock</Typography>
                <Paper>
                  <LowStockPanel listItems={allItems} />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </PageHeader>
    </div>
  );
}

export default App;
