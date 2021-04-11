import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import './room-location-tree.css';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    height: '300px',
    overflow: 'auto',
  },
  textField: {
    marginLeft: '0.5em',
    fontSize: '1.2em',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  dropDownButton: {
    cursor: 'pointer',
  },
  box: {
    cursor: 'pointer',
  },
}));

export default function RoomLocationTree(props) {
  const classes = useStyles();
  const {
    tree,
    handleClick,
    handleDoubleClick,
    handleKeyPressed,
    handleChange,
    setSelected,
    handleClickAway,
  } = props;

  const getPadding = (layer) => {
    return `${50 * layer}px`;
  };

  const createTree = (parentNode) => {
    const {
      id: nodeId,
      children,
      editing,
      label,
      layer,
      isSelected,
    } = parentNode;

    if (children.length === 0) {
      return (
        <ListItem
          key={nodeId}
          margin='dense'
          style={{ paddingLeft: getPadding(layer) }}
        >
          <ClickAwayListener
            mouseEvent='onClick'
            onClickAway={() => handleClickAway(nodeId)}
          >
            <div
              className={`${classes.box} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelected(nodeId)}
            >
              <ListItemText
                onDoubleClick={() => handleDoubleClick(nodeId)}
                primary={
                  <input
                    type='text'
                    value={label}
                    className={classes.textField}
                    disabled={!editing}
                    onChange={(e) => handleChange(e, nodeId)}
                    onKeyDown={(e) => handleKeyPressed(e)}
                  />
                }
              />
            </div>
          </ClickAwayListener>
        </ListItem>
      );
    } else {
      const {
        id: nodeId,
        layer,
        label,
        editing,
        isOpen,
        children,
        isSelected,
      } = parentNode;
      return (
        <div key={nodeId}>
          <ListItem
            margin='dense'
            onDoubleClick={() => handleDoubleClick(nodeId)}
            style={{ paddingLeft: getPadding(layer) }}
          >
            {isOpen ? (
              <ExpandLess
                fontSize='large'
                className={classes.dropDownButton}
                onClick={() => handleClick(nodeId)}
              />
            ) : (
              <ExpandMore
                fontSize='large'
                className={classes.dropDownButton}
                onClick={() => handleClick(nodeId)}
              />
            )}
            <ClickAwayListener
              mouseEvent='onClick'
              onClickAway={() => handleClickAway(nodeId)}
            >
              <div
                className={`${classes.box} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelected(nodeId)}
              >
                <ListItemText
                  primary={
                    <input
                      type='text'
                      value={label}
                      className={classes.textField}
                      disabled={!editing}
                      onChange={(e) => handleChange(e, nodeId)}
                      onKeyDown={(e) => handleKeyPressed(e)}
                    />
                  }
                />
              </div>
            </ClickAwayListener>
          </ListItem>
          <Collapse in={isOpen} timeout='auto' unmountOnExit>
            <List component='div' disablePadding>
              {children.map((node) => createTree(node))}
            </List>
          </Collapse>
        </div>
      );
    }
  };

  return (
    <div className={classes.root}>
      <List component='div' disablePadding>
        {createTree(tree._root)}
      </List>
    </div>
  );
}
