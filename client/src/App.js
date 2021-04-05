import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Tree from './components/tree.js';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import PageHeader from './components/page-header.js';
import ExpiringSoonPanel from './components/expiring-soon-panel.js';
import SettingsModal from './components/settings-modal.js';
import EmailModal from './components/email-modal.js';
import AddItemsModal from './components/add-items-modal.js';
import AddNewItemModal from './components/add-new-item-modal.js';
import DeleteItemModal from './components/delete-item-modal.js';
import RemoveItemModal from './components/remove-item-modal.js';
import EditItemModal from './components/edit-item-modal.js';
import LowStockPanel from './components/low-stock-panel.js';
import MainTable from './components/main-table.js';
import SnackBar from '@material-ui/core/SnackBar';
import Alert from '@material-ui/lab/Alert';
import axios from 'axios';
import './App.css';

const socket = new WebSocket('ws://192.168.68.116:8080');

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
}));

function App() {
  const classes = useStyles();
  const [tree, setTree] = useState(
    new Tree({
      id: 1,
      label: 'home',
      layer: 0,
      isOpen: true,
      isSelected: false,
      editing: false,
      children: [
        {
          id: 2,
          label: 'kitchen',
          layer: 1,
          isOpen: true,
          isSelected: false,
          editing: false,
          children: [
            {
              id: 4,
              label: 'under sink cupboard',
              layer: 2,
              isOpen: false,
              isSelected: false,
              editing: false,
              children: [],
              parent: 'kitchen',
            },
            {
              id: 5,
              label: 'main cupboard',
              layer: 2,
              isOpen: false,
              isSelected: false,
              editing: false,
              children: [],
              parent: 'kitchen',
            },
            {
              id: 6,
              label: 'top shelf cupboard',
              layer: 2,
              isOpen: false,
              isSelected: false,
              editing: false,
              children: [],
              parent: 'kitchen',
            },
          ],
          parent: 'home',
        },
        {
          id: 3,
          label: 'bathroom',
          layer: 1,
          isOpen: true,
          isSelected: false,
          editing: false,
          children: [
            {
              id: 7,
              label: 'under sink cupboard',
              layer: 2,
              isOpen: false,
              isSelected: false,
              editing: false,
              children: [],
              parent: 'bathroom',
            },
            {
              id: 8,
              label: 'end of bath cupboard',
              layer: 2,
              isOpen: false,
              isSelected: false,
              editing: false,
              children: [],
              parent: 'bathroom',
            },
          ],
          parent: 'home',
        },
      ],
      parent: null,
    })
  );
  const [allItems, setAllItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [emails, setEmails] = useState([]);
  const [alert, setAlert] = useState(null);
  const [itemsToModify, setItemsToModify] = useState([]);
  const [settings, setSettings] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    getAllItems().then((items) => setAllItems(items));
    getEmails().then((emails) => {
      setEmails(emails);
    });
    getLocations().then((locations) => setLocations(locations));
  }, []);

  socket.addEventListener('message', async (message) => {
    setAllItems(await getAllItems());
  });

  const getAllItems = async () => {
    const response = await axios.get('/current-items');
    return response.data.reverse();
  };

  const getLocations = async () => {
    const response = await axios.get('/rooms-and-locations');
    return response.data;
  };

  const deleteLocation = async (node) => {
    const { id, label } = node;
    // delete node and all children by deleting all nodes with parentNode === label
    // const response = await axios.delete('/rooms-and-locations/delete/');
    // return response.data;
  };

  const addLocation = async (node) => {
    const { id, label } = node;
  };

  const getEmails = async () => {
    const response = await axios.get('/emails');
    return response.data.reverse();
  };

  const addItem = async (item) => {
    try {
      const response = await axios.post('/current-items/add', item);
      setAllItems([response.data, ...allItems]);
      socket.send(JSON.stringify({ type: 'add' }));
    } catch (error) {
      console.error(error);
    }
  };

  const addEmail = async (name, address) => {
    const email = { name, address };
    const response = await axios.post('/emails/add', email);
    setEmails([response.data, ...emails]);
  };

  const sendEmails = (emailList, message) => {
    socket.send(
      JSON.stringify({
        type: 'email',
        subject: 'Low Stock Alert',
        content: message,
        recipients: emailList,
      })
    );
  };

  const deleteEmailById = async (emailId) => {
    await axios.delete(`emails/${emailId}`);
  };

  const deleteItemById = async (itemId) => {
    try {
      const res = await axios.delete(`/current-items/${itemId}`);
      socket.send(JSON.stringify({ type: 'delete' }));
    } catch (error) {
      console.error(error);
    }
  };

  const updateItemById = async (updatedItem) => {
    try {
      const { _id } = updatedItem;
      await axios.put(`/current-items/update/${_id}`, updatedItem);
      socket.send(JSON.stringify({ type: 'update' }));
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

  const openEmailModal = (lowStockItems) => {
    if (emails.length > 0) {
      setLowStockItems(lowStockItems);
      setEmailing(true);
    }
  };

  const closeEmailModal = () => {
    setEmailing(false);
  };

  const openEditItemModal = () => {
    setEditing(true);
  };

  const closeEditItemModal = () => {
    setEditing(false);
  };

  const openDeleteItemModal = () => {
    setDeleting(true);
  };

  const closeDeleteItemModal = () => {
    setDeleting(false);
  };

  const closeAddNewItemModal = () => {
    setAdding(false);
  };

  const closeAddItemsModal = () => {
    setAdding(false);
  };

  const closeAlert = () => {
    setAlert(null);
  };

  const setAddModal = () => {
    if (itemsToModify.length === 0) {
      return (
        <AddNewItemModal
          itemsToModify={itemsToModify}
          setItemsToModify={setItemsToModify}
          closeModal={closeAddNewItemModal}
          addItem={addItem}
          isOpen={adding}
          allItems={allItems}
          setAllItems={setAllItems}
          tree={tree}
          setAlert={setAlert}
        />
      );
    } else {
      return (
        <AddItemsModal
          itemsToAdd={itemsToModify}
          setItemsToAdd={setItemsToModify}
          setItemsToModify={setItemsToModify}
          closeModal={closeAddItemsModal}
          updateItemById={updateItemById}
          isOpen={adding}
          allItems={allItems}
          setAllItems={setAllItems}
          setAlert={setAlert}
          tree={tree}
        />
      );
    }
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
                  itemsToModify={itemsToModify}
                  setItemsToModify={setItemsToModify}
                  openRemoveModal={openRemoveModal}
                  openDeleteItemModal={openDeleteItemModal}
                  openEditItemModal={openEditItemModal}
                  setAdding={setAdding}
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
                  <span>(within 2 weeks)</span>
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
                  <LowStockPanel
                    openEmailModal={openEmailModal}
                    listItems={allItems}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </PageHeader>
      {settings ? (
        <SettingsModal
          tree={tree}
          setTree={setTree}
          emails={emails}
          setEmails={setEmails}
          addEmail={addEmail}
          deleteEmailById={deleteEmailById}
          isOpen={settings}
          closeSettings={closeSettings}
        />
      ) : null}
      {removing ? (
        <RemoveItemModal
          itemsToRemove={itemsToModify}
          setItemsToModify={setItemsToModify}
          isOpen={removing}
          closeRemoveModal={closeRemoveModal}
          deleteItemById={deleteItemById}
          updateItemById={updateItemById}
          allItems={allItems}
          setAllItems={setAllItems}
          setAlert={setAlert}
        />
      ) : null}
      {deleting ? (
        <DeleteItemModal
          itemsToDelete={itemsToModify}
          setItemsToModify={setItemsToModify}
          closeDeleteItemModal={closeDeleteItemModal}
          deleteItemById={deleteItemById}
          isOpen={deleting}
          allItems={allItems}
          setAllItems={setAllItems}
          setAlert={setAlert}
        />
      ) : null}
      {editing ? (
        <EditItemModal
          itemsToModify={itemsToModify}
          setItemsToModify={setItemsToModify}
          closeEditItemModal={closeEditItemModal}
          updateItemById={updateItemById}
          isOpen={editing}
          allItems={allItems}
          setAllItems={setAllItems}
          tree={tree}
          setAlert={setAlert}
        />
      ) : null}
      {adding ? setAddModal() : null}
      {emailing ? (
        <EmailModal
          itemsToRemove={itemsToModify}
          isOpen={emailing}
          closeEmailModal={closeEmailModal}
          lowStockItems={lowStockItems}
          emails={emails}
          sendEmails={sendEmails}
          setAlert={setAlert}
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
