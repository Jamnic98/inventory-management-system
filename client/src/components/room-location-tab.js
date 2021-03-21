import React, { useState } from 'react';
import RoomLocationTree from './room-location-tree.js';
import IconButton from '@material-ui/core/IconButton';
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core';
import Tree from './tree.js';

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    float: 'right',
  },
  root: {
    height: '100%',
    width: '100%',
  },
}));

export default function RoomLocationTab() {
  const classes = useStyles();

  const [tree, setTree] = useState(
    new Tree({
      label: 'home',
      layer: 0,
      isOpen: false,
      editing: false,
      isSelected: false,
      children: [
        {
          label: 'kitchen',
          layer: 1,
          isOpen: false,
          editing: false,
          isSelected: false,
          children: [
            {
              label: 'under sink cupboard',
              layer: 2,
              isOpen: false,
              editing: false,
              isSelected: false,
              children: [],
            },
            {
              label: 'main cupboard',
              layer: 2,
              isOpen: false,
              editing: false,
              isSelected: false,
              children: [],
            },
          ],
        },
        {
          label: 'bathroom',
          layer: 1,
          isOpen: false,
          editing: false,
          isSelected: false,
          children: [
            {
              label: 'under sink cupboard',
              layer: 2,
              isOpen: false,
              editing: false,
              isSelected: false,
              children: [],
            },
            {
              label: 'bath cupboard',
              layer: 2,
              isOpen: false,
              editing: false,
              isSelected: false,
              children: [],
            },
          ],
        },
      ],
    })
  );

  const handleDelete = () => {};

  const handleAddParent = () => {};

  const handleAddChild = () => {};

  return (
    <div className={classes.root}>
      <IconButton onClick={handleAddParent}>
        <AddIcon />
      </IconButton>
      <IconButton onClick={handleAddChild}>
        <PlaylistAddIcon />
      </IconButton>
      <IconButton onClick={handleDelete} className={classes.deleteButton}>
        <DeleteIcon />
      </IconButton>
      <RoomLocationTree tree={tree} setTree={setTree} />
    </div>
  );
}
