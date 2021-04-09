import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import SettingsIcon from '@material-ui/icons/Settings';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    overflow: 'visible',
  },
  hide: {
    display: 'none',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  button: {
    position: 'absolute',
    right: '0px',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));

export default function PageHeader(props) {
  const { openSettings } = props;
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position='fixed'>
        <Toolbar>
          <Typography variant='h6' noWrap>
            Inventory Management System
          </Typography>
          <Button className={classes.button} onClick={openSettings}>
            <SettingsIcon style={{ color: 'white' }} />
          </Button>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        {props.children}
      </main>
    </div>
  );
}
