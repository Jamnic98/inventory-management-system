import React from 'react';
import RoomLocationTree from './room-location-tree.js';
import IconButton from '@material-ui/core/IconButton';
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core';
import Lang, { uniqueId } from 'lodash';

const useStyles = makeStyles(() => ({
  deleteButton: {
    float: 'right',
  },
  root: {
    height: '100%',
    width: '100%',
  },
}));

export default function RoomLocationTab(props) {
  const { tree, setTree } = props;
  const classes = useStyles();

  const handleDelete = () => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      if (node.isSelected) {
        treeCopy._removeNode(node.id, node.parent);
      }
    });
    setTree(treeCopy);
  };

  const handleDoubleClick = (nodeId) => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      node.isSelected = false;
      if (node.id === nodeId) {
        node.editing = true;
      } else {
        node.editing = false;
      }
    });
    setTree(treeCopy);
  };

  const handleClick = (nodeId) => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      node.isSelected = false;
      if (node.id === nodeId) {
        node.isOpen = !node.isOpen;
      }
    });
    setTree(treeCopy);
  };

  const handleClickAway = (nodeId) => {
    console.log(nodeId);
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      if (node.id === nodeId) {
        node.isSelected = false;
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

  const handleChange = (e, nodeId) => {
    const text = e.target.value;
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      if (node.id === nodeId) {
        node.label = text;
      }
    });
    setTree(treeCopy);
  };

  const setSelected = (nodeId) => {
    const treeCopy = Lang.cloneDeep(tree);
    treeCopy._traverse((node) => {
      if (node.id === nodeId) {
        if (!isEditing()) {
          node.isSelected = !node.isSelected;
        }
      } else {
        node.isSelected = false;
      }
    });
    setTree(treeCopy);
  };

  const isEditing = () => {
    let result = false;
    tree._traverse((node) => {
      if (node.editing) {
        result = true;
      }
    });
    return result;
  };

  const isSelected = () => {
    let output = false;
    tree._traverse((node) => {
      if (node.isSelected) {
        output = true;
      }
    });
    return output;
  };

  const disableAddChild = () => {
    if (isSelected()) {
      const selectedNode = getSelectedNode();
      return selectedNode.layer === 2;
    } else {
      return true;
    }
  };

  const handleAddChild = (nodeId) => {
    const treeCopy = Lang.cloneDeep(tree);
    if (tree._root !== null) {
      const selectedNode = getSelectedNode();
      const { label, parent, layer } = selectedNode;
      treeCopy._traverse((node) => {
        node.editing = false;
        if (node.label === label && node.parent === parent) {
          node.isOpen = true;
        }
      });
      treeCopy._addNode(
        uniqueId(),
        'new',
        layer + 1,
        false,
        false,
        false,
        label
      );
      setTree(treeCopy);
    } else {
      treeCopy._addNode(uniqueId(), 'home', 0, false, false, false, null);
      setTree(treeCopy);
    }
  };

  const getSelectedNode = () => {
    let result = null;
    tree._traverse((node) => {
      if (node.isSelected) {
        result = node;
      }
    });
    return result;
  };

  const setOutput = () => {
    if (tree._root !== null) {
      const selected = isSelected();
      return (
        <div className={classes.root}>
          <IconButton
            color='primary'
            disabled={disableAddChild()}
            onClick={handleAddChild}
          >
            <PlaylistAddIcon />
          </IconButton>
          <IconButton
            color='primary'
            disabled={!selected || tree._root.isSelected}
            onClick={handleDelete}
            className={classes.deleteButton}
          >
            <DeleteIcon />
          </IconButton>
          <RoomLocationTree
            handleClick={handleClick}
            handleDoubleClick={handleDoubleClick}
            handleKeyPressed={handleKeyPressed}
            handleChange={handleChange}
            setSelected={setSelected}
            tree={tree}
            setTree={setTree}
            handleClickAway={(e) => handleClickAway(e)}
          />
        </div>
      );
    }
  };

  return setOutput();
}
