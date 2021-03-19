import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import CloseIcon from '@material-ui/icons/Close';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    maxHeight: '80vh',
    maxWidth: '80vw',
    top: '15%',
    margin: 'auto',
    position: 'absolute',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #000',
    outline: 'none',
  },
  modalContentContainer: {
    height: '80%',
    overflow: 'auto',
  },
  cancelButton: {
    position: 'absolute',
    top: '0',
    right: '0',
    padding: '0.5em',
  },
}));

const getModalStyle = (dimensions) => {
  return dimensions;
};

export default function SimpleModal(props) {
  const { isOpen, closeModal, title, style } = props;
  const classes = useStyles();

  const [modalStyle] = useState(getModalStyle(style));

  return (
    <Modal
      open={isOpen}
      aria-labelledby='simple-modal-title'
      aria-describedby='simple-modal-description'
      disableBackdropClick
      className={classes.modal}
    >
      <div style={modalStyle} className={`${classes.paper}`}>
        <Box mx={1} mt={1}>
          <Button
            tabIndex={-1}
            className={classes.cancelButton}
            onClick={closeModal}
          >
            <CloseIcon />
          </Button>
          <Typography variant='h5'>{title}</Typography>
        </Box>
        {props.children}
      </div>
    </Modal>
  );
}
