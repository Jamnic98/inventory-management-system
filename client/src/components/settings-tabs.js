import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import RoomLocationTab from './room-location-tab.js';
import EmailTab from './email-tab.js';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: 'theme.palette.background.paper',
    width: '100%',
    height: '100%',
  },
  tabPanel: {
    width: '100%',
    height: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
}));

export default function SettingsTabs(props) {
  const classes = useStyles();
  const { tree, setTree, emails, setEmails, addEmail, deleteEmailById } = props;
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const handleChange = (e, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <AppBar position='static' color='default'>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor='primary'
          textColor='primary'
          variant='fullWidth'
          aria-label='settings'
        >
          <Tab label='Rooms & Locations' {...a11yProps(0)} />
          <Tab label='Email' {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      <TabPanel
        className={classes.tabPanel}
        value={value}
        index={0}
        dir={theme.direction}
      >
        <RoomLocationTab tree={tree} setTree={setTree} />
      </TabPanel>
      <TabPanel
        className={classes.tabPanel}
        value={value}
        index={1}
        dir={theme.direction}
      >
        <EmailTab
          emails={emails}
          setEmails={setEmails}
          addEmail={addEmail}
          deleteEmailById={deleteEmailById}
        />
      </TabPanel>
    </div>
  );
}
