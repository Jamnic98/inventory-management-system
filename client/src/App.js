import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import PageHeader from './components/page-header.js';
import ExpiringSoonPanel from './components/expiring-soon-panel.js';
import SettingsModal from './components/settings-modal.js';
import RemoveItemModal from './components/remove-item-modal.js';
import LowStockPanel from './components/low-stock-panel.js';
import MainTable from './components/main-table.js';
import SnackBar from '@material-ui/core/SnackBar';
import Slide from '@material-ui/core/Slide';
import Alert from '@material-ui/lab/Alert';
import axios from 'axios';

const socket = new WebSocket('ws://localhost:8080');

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
}));

function App() {
  const classes = useStyles();
  const [alert, setAlert] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [itemsToModify, setItemsToModify] = useState([]);
  const [settings, setSettings] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

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
        name: "ben & jerry's ice cream",
        quantity: 3,
        room: 'kitchen',
        location: 'freezer',
        expirationDate: new Date(0),
        lowStockAlert: true,
      };
      const response = await axios.post('/current-items/add', item);
      setAllItems([response.data, ...allItems]);
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

  const updateItemById = async (updatedItem) => {
    try {
      const { _id } = updatedItem;
      const response = await axios.put(
        `/current-items/update/${_id}`,
        updatedItem
      );
    } catch (error) {
      console.error(error);
    }
  };

  const openSettings = () => {
    setSettings(true);
  };

  const closeSettings = () => {
    setSettings(false);
  };

  const openRemoveModal = () => {
    setRemoving(true);
  };

  const closeRemoveModal = () => {
    setRemoving(false);
  };

  const openEditModal = () => {
    setEditing(true);
  };

  const closeEditModal = () => {
    setEditing(false);
  };

  const closeAlert = () => {
    setAlert(null);
  };

  return (
    <div>
      <PageHeader openSettings={openSettings}>
        <div className={classes.root}>
          <Grid
            spacing={2}
            container
            justify='space-evenly'
            direction='row'
            alignItems='center'
          >
            <Grid item xs={12}>
              <Box m={1}>
                <Typography variant='h6'>
                  <b>All Items:</b>
                </Typography>
              </Box>
              <Paper>
                <MainTable
                  addItem={addItem}
                  allItems={allItems}
                  setAllItems={setAllItems}
                  openRemoveModal={openRemoveModal}
                  itemsToModify={itemsToModify}
                  setItemsToModify={setItemsToModify}
                  setAlert={setAlert}
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
                <Box m={1}>
                  <Typography variant='h6'>
                    <b>Expiring Soon:</b>
                  </Typography>
                </Box>
                <ExpiringSoonPanel tableData={allItems} />
              </Grid>
              <Grid xs={3} lg={2} xl={1} item>
                <Box m={1}>
                  <Typography variant='h6'>
                    <b>Low Stock:</b>
                  </Typography>
                </Box>
                <Paper>
                  <LowStockPanel listItems={allItems} />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </PageHeader>
      {settings ? (
        <SettingsModal isOpen={settings} closeSettings={closeSettings} />
      ) : null}
      {removing ? (
        <RemoveItemModal
          itemsToRemove={itemsToModify}
          isOpen={removing}
          closeRemoveModal={closeRemoveModal}
          deleteItemById={deleteItemById}
          updateItemById={updateItemById}
          setItemsToModify={setItemsToModify}
          allItems={allItems}
          setAllItems={setAllItems}
        />
      ) : null}
      {alert ? (
        <SnackBar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          open={alert !== undefined}
          message={alert.message}
          autoHideDuration={2500}
          onClose={closeAlert}
        >
          <Alert severity={alert.type}>{alert.message}</Alert>
        </SnackBar>
      ) : null}
    </div>
  );
}

export default App;
