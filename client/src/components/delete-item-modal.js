import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SimpleModal from './simple-modal.js';
import List from '@material-ui/core/List';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import ArrowRightOutlinedIcon from '@material-ui/icons/ArrowRightOutlined';
import RemoveIcon from '@material-ui/icons/Remove';

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

export default function DeleteItemModal(props) {
  const {
    isOpen,
    closeDeleteItemModal,
    itemsToDelete,
    deleteItemById,
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
    const list = itemsToDelete.map((item) => {
      const selected = item.selected || 1;
      return { selected: selected, ...item };
    });
    setModalList(list);
  }, [itemsToDelete]);

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
      const { _id } = listItem;
      deleteItemById(_id);
      modifiedItems = modifiedItems.filter((item) => {
        return item._id !== listItem._id;
      });
    });
    setItemsToModify([]);
    setAllItems(modifiedItems);
    closeDeleteItemModal();
  };

  return (
    <SimpleModal
      title='Delete Items'
      isOpen={isOpen}
      closeModal={closeDeleteItemModal}
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
                <RemoveIcon />
              </ListItem>
              {index !== itemsToDelete.length - 1 ? <Divider /> : null}
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
