import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
  },
  paper: {
    maxWidth: '50vw',
    top: '10%',
    marginLeft: 'auto',
    marginRight: 'auto',
    position: 'absolute',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #000',
    outline: 'none',
  },
  cancelButton: {
    float: 'right',
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
        <Box m={1} p={1}>
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
