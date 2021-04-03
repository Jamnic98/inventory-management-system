import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import SimpleModal from './simple-modal.js';
import List from '@material-ui/core/List';
import Button from '@material-ui/core/Button';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ArrowRightOutlinedIcon from '@material-ui/icons/ArrowRightOutlined';

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
}));

export default function AddItemsModal(props) {
  const {
    isOpen,
    closeModal,
    itemsToAdd,
    updateItemById,
    setItemsToModify,
    allItems,
    setAllItems,
  } = props;
  const classes = useStyles();

  const modalStyle = {
    minWidth: '85%',
  };

  const [modalList, setModalList] = useState([]);

  useEffect(() => {
    const list = itemsToAdd.map((item) => {
      const selected = item.selected || 1;
      return { selected: selected, ...item };
    });
    setModalList(list);
  }, [itemsToAdd]);

  const handleAddButton = (itemID) => {
    const updatedList = modalList.map((listItem) => {
      if (listItem._id === itemID) {
        listItem.selected += 1;
      }
      return listItem;
    });
    setModalList(updatedList);
  };

  const handleRemoveButton = (itemID) => {
    const updatedList = modalList.map((listItem) => {
      if (listItem._id === itemID) {
        listItem.selected -= 1;
      }
      return listItem;
    });
    setModalList(updatedList);
  };

  const handleConfirmButton = () => {
    let modifiedItems = [...allItems];
    modalList.forEach((listItem) => {
      const { quantity } = listItem;
      const { selected, ...rest } = listItem;
      const updatedItem = { ...rest, quantity: quantity + selected };
      modifiedItems = modifiedItems.map((item) => {
        return item._id === updatedItem._id ? updatedItem : item;
      });
      updateItemById(updatedItem);
    });
    setItemsToModify([]);
    setAllItems(modifiedItems);
    closeModal();
  };

  return (
    <SimpleModal
      title='Add Items'
      isOpen={isOpen}
      closeModal={closeModal}
      style={modalStyle}
    >
      <Divider />
      <List className={classes.modalContentContainer}>
        {modalList.map((item, index) => {
          return (
            <div key={item._id}>
              <ListItem>
                <ArrowRightOutlinedIcon fontSize='default' />
                <ListItemText
                  primary={item.name}
                  secondary={`${item.room} ${item.location}`}
                />
                <IconButton
                  tabIndex={-1}
                  color='secondary'
                  onClick={() => handleAddButton(item._id)}
                >
                  <AddIcon />
                </IconButton>
                <span
                  style={{ fontSize: '1.2em', margin: '0.3em' }}
                >{`${item.selected}`}</span>
                <IconButton
                  tabIndex={-1}
                  color='secondary'
                  onClick={() => handleRemoveButton(item._id)}
                  disabled={item.selected === 1}
                >
                  <RemoveIcon />
                </IconButton>
              </ListItem>
              {index !== itemsToAdd.length - 1 ? <Divider /> : null}
            </div>
          );
        })}
      </List>
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
}
