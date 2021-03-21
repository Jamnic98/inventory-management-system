import React, { useState } from 'react';
import Lang from 'lodash';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import './room-location-tree.css';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    height: '300px',
    overflow: 'auto',
  },
  nested: {},
  textField: {
    marginLeft: '0.4em',
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
  const { tree, setTree } = props;

  const getPadding = (layer) => {
    return `${35 * layer}px`;
  };

  const handleClick = (label) => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      node.isSelected = false;
      if (label === node.label) {
        node.isOpen = !node.isOpen;
      }
    });
    setTree(treeCopy);
  };

  const handleDoubleClick = (label) => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      node.isSelected = false;
      if (label === node.label) {
        node.editing = true;
      } else {
        node.editing = false;
      }
    });
    setTree(treeCopy);
  };

  const handleKeyPressed = (e) => {
    if (e.key === 'Enter') {
      const treeCopy = Lang.cloneDeep(tree);
      treeCopy._traverse((node) => (node.editing = false));
      setTree(treeCopy);
    }
  };

  const handleChange = (e, label) => {
    const text = e.target.value;
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      if (label === node.label) {
        node.label = text;
      }
    });
    setTree(treeCopy);
  };

  const setSelected = (label) => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      if (label === node.label) {
        if (!isNodeSelected()) {
          node.isSelected = !node.isSelected;
        }
      } else {
        node.isSelected = false;
      }
    });
    setTree(treeCopy);
  };

  const isNodeSelected = () => {
    let output = false;
    tree._traverse((node) => {
      if (node.editing) {
        output = true;
      }
    });
    return output;
  };

  const clearEdit = () => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      node.editing = false;
    });
    setTree(treeCopy);
  };

  const createTree = (parentNode) => {
    const { children, editing, label, layer, isSelected } = parentNode;

    if (children.length === 0) {
      return (
        <ListItem style={{ paddingLeft: getPadding(layer) }}>
          <div
            className={`${classes.box} ${isSelected ? 'selected' : ''}`}
            onClick={() => setSelected(label)}
          >
            <ListItemText
              onClick={() => setSelected(label)}
              onDoubleClick={() => handleDoubleClick(label)}
              primary={
                <input
                  type='text'
                  value={label}
                  className={classes.textField}
                  disabled={!editing}
                  onChange={(e) => handleChange(e, label)}
                  onKeyDown={(e) => handleKeyPressed(e)}
                />
              }
            />
          </div>
        </ListItem>
      );
    } else {
      const {
        layer,
        label,
        editing,
        isOpen,
        children,
        isSelected,
      } = parentNode;
      return (
        <>
          <ListItem
            onDoubleClick={() => handleDoubleClick(label)}
            className={classes.nested}
            style={{ paddingLeft: getPadding(layer) }}
          >
            {isOpen ? (
              <ExpandLess
                className={classes.dropDownButton}
                onClick={() => handleClick(label)}
              />
            ) : (
              <ExpandMore
                className={classes.dropDownButton}
                onClick={() => handleClick(label)}
              />
            )}
            <div
              className={`${classes.box} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelected(label)}
            >
              <ListItemText
                primary={
                  <input
                    type='text'
                    value={label}
                    className={classes.textField}
                    disabled={!editing}
                    onChange={(e) => handleChange(e, label)}
                    onKeyDown={(e) => handleKeyPressed(e)}
                  />
                }
              />
            </div>
          </ListItem>
          <Collapse in={isOpen} timeout='auto' unmountOnExit>
            <List component='div' disablePadding>
              {children.map((node) => createTree(node))}
            </List>
          </Collapse>
        </>
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
