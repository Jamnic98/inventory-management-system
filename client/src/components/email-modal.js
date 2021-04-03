import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SimpleModal from './simple-modal.js';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';

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

function EmailModal(props) {
  const { closeEmailModal, isOpen, emails, sendEmails, lowStockItems } = props;
  const modalStyle = { minWidth: '300px' };
  const classes = useStyles();

  const [emailList, setEmailList] = useState([]);

  useEffect(() => {
    const modalList = emails.map((email) => {
      return { isSelected: false, ...email };
    });
    setEmailList(modalList);
  }, [emails]);

  const handleConfirmButton = () => {
    const message = lowStockItems
      .map((item) => {
        return item.name;
      })
      .join(', ');
    const addressList = emailList.map((email) => {
      if (email.isSelected) {
        return email.address;
      }
    });
    sendEmails(addressList, message);
    closeEmailModal();
  };

  const handleItemClick = (emailId) => {
    const updatedEmailList = emailList.map((email) => {
      if (emailId === email._id) {
        email.isSelected = !email.isSelected;
        return email;
      } else {
        return email;
      }
    });
    setEmailList(updatedEmailList);
  };

  return (
    <SimpleModal
      style={modalStyle}
      closeModal={closeEmailModal}
      isOpen={isOpen}
      title='Send Email Alert'
    >
      <Box m={2}>
        <List>
          <Divider />
          {emailList.map((email) => {
            return (
              <>
                <ListItem>
                  <ListItemIcon>
                    <Checkbox
                      onClick={() => handleItemClick(email._id)}
                      edge='start'
                      checked={email.isSelected}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ 'aria-labelledby': email._id }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={email.name} />
                </ListItem>
                <Divider />
              </>
            );
          })}
        </List>
      </Box>
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

export default EmailModal;
