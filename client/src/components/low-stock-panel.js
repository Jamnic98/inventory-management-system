import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import ArrowRightOutlinedIcon from '@material-ui/icons/ArrowRightOutlined';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    overflow: 'auto',
    height: 261,
  },
  listSection: {
    backgroundColor: 'inherit',
  },
  button: {
    width: '100%',
  },
}));

function LowStockPanel(props) {
  const { listItems } = props;
  const classes = useStyles();

  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const filteredList = listItems.filter((item) => {
      return item.lowStockAlert;
    });
    setFilteredData(filteredList);
  }, [listItems]);

  return (
    <Box py={1}>
      <List dense className={classes.root}>
        {filteredData.map((item, index) => {
          return (
            <ListItem key={index}>
              <ArrowRightOutlinedIcon fontSize='small' />
              <ListItemText primary={item.name} />
            </ListItem>
          );
        })}
      </List>
      <Box m={1}>
        <Button color='primary' variant='contained' className={classes.button}>
          Send alert
        </Button>
      </Box>
    </Box>
  );
}

export default LowStockPanel;
