import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SimpleModal from './simple-modal.js';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Checkbox from '@material-ui/core/Checkbox';
import MenuItem from '@material-ui/core/MenuItem';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles(() => ({
  modalContentContainer: {
    maxHeight: '60vh',
    overflow: 'auto',
  },
  bottom: {
    margin: '.8em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    width: '80%',
  },
  number: {
    width: '20%',
  },
  dropDown: {
    minWidth: '100%',
  },
}));

export default function AddNewItemModal(props) {
  const {
    tree,
    isOpen,
    closeModal,
    itemsToModify,
    setItemsToModify,
    addItem,
    allItems,
    setAllItems,
    setAlert,
  } = props;

  const modalStyle = {};

  const classes = useStyles();
  const [itemToAdd, setItemToAdd] = useState({
    name: '',
    quantity: 0,
    room: '',
    location: '',
    expirationDate: new Date(0),
    lowStockAlert: false,
  });

  const [checked, setChecked] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    setLocations(getLocations(itemToAdd.room));
    setRooms(getRooms());
  }, [itemToAdd]);

  const getRooms = () => {
    let rooms = [];
    tree._traverse((node) => {
      if (node.layer === 1) {
        rooms = [node.label, ...rooms];
      }
    });
    return rooms;
  };

  const getLocations = (room) => {
    let locations = [];
    if (itemToAdd) {
      tree._traverse((node) => {
        if (node.layer === 2 && node.parent === room) {
          locations = [node.label, ...locations];
        }
      });
    }
    return locations;
  };

  const handleConfirmButton = () => {
    if (allFieldsCompleted()) {
      addItem(itemToAdd);
      setItemsToModify([]);
      closeModal();
    } else {
      setAlert({ message: 'All fields must be completed', type: 'error' });
    }
  };

  const allFieldsCompleted = () => {
    for (const field of Object.values(itemToAdd)) {
      if (field === '') {
        return false;
      }
    }
    return true;
  };

  const handleChange = (e) => {
    switch (e.target.id) {
      case 'name':
        const name = e.target.value;
        changeName(name);
        break;
      case 'lowStockAlert':
        toggleLowStockAlert();
        break;
      case 'quantity':
        const quantity = e.target.value;
        changeQuantity(quantity);
        break;
      case 'expires':
        setChecked(!checked);
        break;
      case 'expirationDate':
        const date = e.target.value;
        changeDate(date);
        break;
    }
  };

  const handleRoomChange = (e) => {
    const room = e.target.value;
    if (isLocationInRoom(room)) {
      const updatedItem = {
        ...itemToAdd,
        room: room,
      };
      setItemToAdd(updatedItem);
    } else {
      const updatedItem = {
        ...itemToAdd,
        room: room,
        location: getLocations(room)[0],
      };
      setItemToAdd(updatedItem);
    }
  };

  const isLocationInRoom = (room) => {
    const { location } = itemToAdd;
    let locations = [];
    tree._traverse((node) => {
      if (node.layer === 2 && node.parent === room) {
        locations = [...locations, node.label];
      }
    });
    return locations.indexOf(location) !== -1;
  };

  const handleLocationChange = (e) => {
    const location = e.target.value;
    const updatedItem = {
      ...itemToAdd,
      location: location,
    };
    setItemToAdd(updatedItem);
  };

  const toggleLowStockAlert = () => {
    const updatedItem = {
      ...itemToAdd,
      lowStockAlert: !itemToAdd.lowStockAlert,
    };
    setItemToAdd(updatedItem);
  };

  const changeName = (name) => {
    const updatedItem = { ...itemToAdd, name: name };
    setItemToAdd(updatedItem);
  };

  const changeQuantity = (quantity) => {
    if (quantity > -1) {
      const updatedItem = {
        ...itemToAdd,
        quantity: quantity,
      };
      setItemToAdd(updatedItem);
    }
  };

  const changeDate = (date) => {
    const updatedDate = new Date(date);
    const updatedItem = {
      ...itemToAdd,
      expirationDate: updatedDate,
    };
    setItemToAdd(updatedItem);
  };

  const setOutput = () => {
    if (itemToAdd) {
      const {
        name,
        quantity,
        room,
        location,
        expirationDate,
        lowStockAlert,
      } = itemToAdd;
      return (
        <SimpleModal
          title='Add New Item'
          isOpen={isOpen}
          closeModal={closeModal}
          style={modalStyle}
        >
          <Divider />
          <Box m={2}>
            <TextField
              id='name'
              label='Item:'
              value={name}
              variant='outlined'
              margin='dense'
              onChange={(e) => handleChange(e)}
              className={classes.name}
            />
            <TextField
              id='quantity'
              label='Quantity:'
              type='number'
              value={quantity}
              onChange={(e) => handleChange(e)}
              InputLabelProps={{
                shrink: true,
              }}
              variant='outlined'
              margin='dense'
              className={classes.number}
            />
            <br />
            <TextField
              select
              id='room'
              label='Room:'
              value={room}
              variant='outlined'
              margin='dense'
              className={classes.dropDown}
              onChange={(e) => handleRoomChange(e)}
            >
              {rooms.map((option, index) => (
                <MenuItem id={index} key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <br />
            <TextField
              select
              id='location'
              label='Location:'
              value={location}
              variant='outlined'
              margin='dense'
              className={classes.dropDown}
              onChange={(e) => handleLocationChange(e)}
              disabled={itemToAdd.room === ''}
            >
              {locations.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <br />
            <FormControlLabel
              control={
                <Checkbox
                  color='secondary'
                  id='expires'
                  checked={checked}
                  onChange={(e) => handleChange(e)}
                />
              }
              label='Expiration date'
              labelPlacement='top'
            />
            <FormControlLabel
              className={classes.lowStockAlert}
              control={
                <TextField
                  id='expirationDate'
                  type='date'
                  defaultValue='yyyy-mm-dd'
                  className={classes.textField}
                  onChange={(e) => handleChange(e)}
                  disabled={checked}
                />
              }
            ></FormControlLabel>
            <br />
            <FormControlLabel
              className={classes.lowStockAlert}
              control={
                <Switch
                  id='lowStockAlert'
                  checked={lowStockAlert}
                  onChange={(e) => handleChange(e)}
                />
              }
              label='Low Stock Alert'
              labelPlacement='start'
            />
          </Box>
          <Divider />
          <div className={classes.bottom}>
            <Button
              variant='contained'
              color='primary'
              onClick={handleConfirmButton}
            >
              Confirm
            </Button>
          </div>
        </SimpleModal>
      );
    } else {
      return null;
    }
  };

  return setOutput();
}
