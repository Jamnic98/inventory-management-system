import React, { useState, useEffect, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SimpleModal from './simple-modal.js';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import {
  TextField,
  FormControlLabel,
  Switch,
  Checkbox,
  MenuItem,
  Box,
} from '@material-ui/core';

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

export default function EditItemModal(props) {
  const {
    tree,
    isOpen,
    closeEditItemModal,
    itemsToModify,
    setItemsToModify,
    updateItemById,
    allItems,
    setAllItems,
    setAlert,
  } = props;

  const modalStyle = {};

  const classes = useStyles();
  const [itemToEdit, setItemToEdit] = useState(null);
  const [checked, setChecked] = useState();
  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);

  const getRooms = useCallback(() => {
    let rooms = [];
    tree._traverse((node) => {
      if (node.layer === 1) {
        rooms = [node.label, ...rooms];
      }
    });
    return rooms;
  }, [tree]);

  const getLocations = useCallback(
    (room) => {
      let locations = [];
      if (itemToEdit) {
        tree._traverse((node) => {
          if (node.layer === 2 && node.parent === room) {
            locations = [node.label, ...locations];
          }
        });
      }
      return locations;
    },
    [itemToEdit, tree]
  );

  const handleConfirmButton = () => {
    const { _id } = itemToEdit;
    const updatedItems = allItems.map((item) => {
      if (item._id === _id) {
        return itemToEdit;
      } else {
        return item;
      }
    });

    setAllItems(updatedItems);
    updateItemById(itemToEdit);
    setItemsToModify([]);
    setAlert({ message: `Item${itemsToModify.length > 1 ? 's' : ''} edited` });
    closeEditItemModal();
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
      default:
        break;
    }
  };

  const handleRoomChange = (e) => {
    const room = e.target.value;
    if (isLocationInRoom(room)) {
      const updatedItem = {
        ...itemToEdit,
        room: room,
      };
      setItemToEdit(updatedItem);
    } else {
      const updatedItem = {
        ...itemToEdit,
        room: room,
        location: getLocations(room)[0],
      };
      setItemToEdit(updatedItem);
    }
  };

  const isLocationInRoom = (room) => {
    const { location } = itemToEdit;
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
      ...itemToEdit,
      location: location,
    };
    setItemToEdit(updatedItem);
  };

  const toggleLowStockAlert = () => {
    const updatedItem = {
      ...itemToEdit,
      lowStockAlert: !itemToEdit.lowStockAlert,
    };
    setItemToEdit(updatedItem);
  };

  const changeName = (name) => {
    const updatedItem = { ...itemToEdit, name: name };
    setItemToEdit(updatedItem);
  };

  const changeQuantity = (quantity) => {
    if (quantity > -1) {
      const updatedItem = {
        ...itemToEdit,
        quantity: quantity,
      };
      setItemToEdit(updatedItem);
    }
  };

  const changeDate = (date) => {
    const updatedItem = {
      ...itemToEdit,
      expirationDate: new Date(date),
    };
    setItemToEdit(updatedItem);
  };

  useEffect(() => {
    setItemToEdit({ ...itemsToModify[0] });
    setChecked(parseInt(Date.parse(itemsToModify[0].expirationDate)) === 0);
    setRooms(getRooms());
  }, [itemsToModify, getRooms, getLocations]);

  useEffect(() => {
    if (itemToEdit) {
      setLocations(getLocations(itemToEdit.room));
    }
  }, [itemToEdit, getLocations]);

  const setOutput = () => {
    if (itemToEdit) {
      const { name, quantity, room, location, lowStockAlert } = itemToEdit;
      return (
        <SimpleModal
          title='Edit Item'
          isOpen={isOpen}
          closeModal={closeEditItemModal}
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
                  checked={!checked}
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
                  defaultValue={new Date(itemsToModify[0].expirationDate)
                    .toISOString()
                    .slice(0, 10)}
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
