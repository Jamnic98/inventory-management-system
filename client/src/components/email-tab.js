import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowRightOutlinedIcon from '@material-ui/icons/ArrowRightOutlined';

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
    width: '100%',
  },
  list: { overflow: 'auto', maxHeight: '200px' },
}));

export default function EmailTab(props) {
  const classes = useStyles();
  const { emails, setEmails, addEmail, deleteEmailById } = props;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState(false);

  const handleDelete = (e, index) => {
    let updatedEmails = [];
    emails.forEach((email, i) => {
      if (index !== i) {
        updatedEmails.push(email);
      } else {
        deleteEmailById(email._id);
      }
    });
    setEmails(updatedEmails);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setName(name);
    setError(false);
  };

  const handleAddressChange = (e) => {
    const address = e.target.value;
    setAddress(address);
    setError(false);
  };

  const handleAddButton = () => {
    setError(true);
    if (name && address) {
      addEmail(name, address);
      setEmails([{ name, address }, ...emails]);
      setError(false);
      setName('');
      setAddress('');
    }
  };

  const setOutput = () => {
    return (
      <div className={classes.root}>
        <Button onClick={handleAddButton} color='primary' variant='outlined'>
          <AddIcon />
          Add new email
        </Button>
        <TextField
          helperText={error ? 'Enter name' : ''}
          error={error && name.length === 0}
          value={name}
          label='Name:'
          margin='dense'
          variant='outlined'
          fullWidth
          required
          onChange={(e) => handleNameChange(e)}
        />
        <TextField
          helperText={error ? 'Enter address' : ''}
          error={error && address.length === 0}
          value={address}
          label='Email address:'
          margin='dense'
          variant='outlined'
          fullWidth
          required
          onChange={(e) => handleAddressChange(e)}
        />
        <Box my={1}>
          <List className={classes.list}>
            {emails.map((email, index) => {
              return (
                <ListItem key={index}>
                  <ArrowRightOutlinedIcon />
                  <ListItemText
                    primary={email.name}
                    secondary={email.address}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={(e) => handleDelete(e, index)}
                      edge='end'
                      aria-label='delete'
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </div>
    );
  };

  return setOutput();
}
