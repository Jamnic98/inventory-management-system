import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Box from '@material-ui/core/Box';
import InputAdornment from '@material-ui/core/InputAdornment';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import EditIcon from '@material-ui/icons/Edit';

const ROWS_PER_PAGE = 5;
const ROW_HEIGHT = 53;

const headCells = [
  {
    id: 'item',
    numeric: false,
    disablePadding: true,
    label: 'Item',
  },
  { id: 'quantity', numeric: true, disablePadding: false, label: 'Quantity' },
  { id: 'room', numeric: true, disablePadding: false, label: 'Room' },
  { id: 'location', numeric: true, disablePadding: false, label: 'Location' },
  {
    id: 'expirationDate',
    numeric: true,
    disablePadding: false,
    label: 'Exp. date',
  },
  {
    id: 'lowStockAlert',
    numeric: true,
    disablePadding: false,
    label: 'Low Stock Alert',
  },
];

function EnhancedTableHead(props) {
  const { onSelectAllClick, numSelected, rowCount } = props;
  const classes = useStyles();

  return (
    <TableHead>
      <TableRow>
        <TableCell padding='checkbox'>
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all items' }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'center' : 'center'}
            padding={headCell.disablePadding ? 'none' : 'default'}
          >
            <div className={classes.textContainer}>{headCell.label}</div>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    minHeight: `${100 + (ROWS_PER_PAGE - 1) * ROW_HEIGHT}px`,
  },
  tableRow: {
    cursor: 'pointer',
  },
  textContainer: {
    display: 'block',
    /* width: '100%', */
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tablePagination: {
    display: 'flex',
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
}));

export default function MainTable(props) {
  const {
    allItems,
    setAdding,
    openRemoveModal,
    openEditItemModal,
    openDeleteItemModal,
    itemsToModify,
    setItemsToModify,
    setAlert,
  } = props;
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [filterWord, setFilterWord] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const emptyRows =
    ROWS_PER_PAGE -
    Math.min(ROWS_PER_PAGE, filteredData.length - page * ROWS_PER_PAGE);

  useEffect(() => {
    const trimmedFW = filterWord.trim().toLowerCase();
    const regEx = new RegExp(trimmedFW, 'i');
    setFilteredData(
      allItems.filter((row) => {
        if (trimmedFW.length > 0) {
          return regEx.test(row.name);
        } else {
          return true;
        }
      })
    );
  }, [allItems, filterWord]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setItemsToModify(filteredData);
    } else {
      setItemsToModify([]);
    }
  };

  const handleClick = (_event, item) => {
    const itemIDArray = itemsToModify.map((item) => item._id);
    const selectedIndex = itemIDArray.indexOf(item._id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(itemsToModify, item);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(itemsToModify.slice(1));
    } else if (selectedIndex === itemsToModify.length - 1) {
      newSelected = newSelected.concat(itemsToModify.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        itemsToModify.slice(0, selectedIndex),
        itemsToModify.slice(selectedIndex + 1)
      );
    }

    setItemsToModify(newSelected);
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const isSelected = (row) =>
    itemsToModify.map((item) => item._id).indexOf(row._id) !== -1;

  const setExpirationDate = (date) => {
    return parseInt(Date.parse(date)) !== 0
      ? new Date(date).toLocaleDateString('en-GB')
      : '-';
  };

  const handleAddButton = async () => {
    setAdding(true);
  };

  const handleRemoveButton = async () => {
    if (itemsToModify.length > 0) {
      openRemoveModal();
    } else {
      setAlert({ message: 'Select an item to remove', type: 'error' });
    }
  };

  const handleDeleteButton = async () => {
    if (itemsToModify.length > 0) {
      openDeleteItemModal();
    } else {
      setAlert({ message: 'Select an item to delete', type: 'error' });
    }
  };

  const handleEditButton = async () => {
    switch (itemsToModify.length) {
      case 0: {
        setAlert({ message: 'Select an item to edit', type: 'error' });
        break;
      }
      case 1: {
        openEditItemModal();
        break;
      }
      default:
        setAlert({
          message: 'Too many items selected, select only one',
          type: 'error',
        });
    }
  };

  return (
    <Box py={1}>
      <Box mx={1}>
        <ButtonGroup
          color='default'
          variant='text'
          size='large'
          aria-label='button group'
        >
          <Button onClick={handleAddButton} endIcon={<AddIcon>add</AddIcon>}>
            add
          </Button>
          <Button
            onClick={handleEditButton}
            endIcon={<EditIcon>edit</EditIcon>}
          >
            edit
          </Button>
          <Button
            onClick={handleRemoveButton}
            endIcon={<DeleteIcon>remove</DeleteIcon>}
          >
            remove
          </Button>
        </ButtonGroup>
        <Button
          size='large'
          style={{ float: 'right' }}
          onClick={handleDeleteButton}
          endIcon={<DeleteForeverIcon>delete</DeleteForeverIcon>}
        >
          delete
        </Button>
      </Box>
      <TableContainer className={classes.tableContainer}>
        <Table
          className={classes.table}
          aria-labelledby='tableTitle'
          aria-label='enhanced table'
        >
          <EnhancedTableHead
            classes={classes}
            numSelected={itemsToModify.length}
            onSelectAllClick={handleSelectAllClick}
            rowCount={filteredData.length}
          />
          <TableBody>
            {filteredData
              .slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE)
              .map((row, index) => {
                const isItemSelected = isSelected(row);
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                  <TableRow
                    className={classes.tableRow}
                    hover
                    onClick={(event) => handleClick(event, row)}
                    role='checkbox'
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row._id}
                  >
                    <TableCell className={classes.tableCell} padding='checkbox'>
                      <Checkbox
                        checked={isItemSelected}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </TableCell>
                    <TableCell
                      className={classes.tableCell}
                      component='th'
                      id={labelId}
                      scope='row'
                      padding='none'
                      align='center'
                    >
                      <div className={classes.textContainer}>{row.name}</div>
                    </TableCell>
                    <TableCell className={classes.tableCell} align='center'>
                      <div className={classes.textContainer}>
                        {row.quantity}
                      </div>
                    </TableCell>
                    <TableCell className={classes.tableCell} align='center'>
                      <div className={classes.textContainer}>{row.room}</div>
                    </TableCell>
                    <TableCell className={classes.tableCell} align='center'>
                      <div className={classes.textContainer}>
                        {row.location}
                      </div>
                    </TableCell>
                    <TableCell className={classes.tableCell} align='center'>
                      <div className={classes.textContainer}>
                        {setExpirationDate(row.expirationDate)}
                      </div>
                    </TableCell>
                    <TableCell className={classes.tableCell} align='center'>
                      <div className={classes.textContainer}>
                        {row.lowStockAlert.toString()}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            {emptyRows > 0 && (
              <TableRow style={{ height: ROW_HEIGHT * emptyRows }}>
                <TableCell colSpan={7} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mx={2}>
        <TextField
          width='90%'
          onChange={(e) => {
            setPage(0);
            setFilterWord(e.target.value);
          }}
          label='Search by item'
          variant='outlined'
          margin='normal'
          value={filterWord}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <Button onClick={() => setFilterWord('')}>
                  <CloseIcon />
                </Button>
              </InputAdornment>
            ),
          }}
        ></TextField>
        <TablePagination
          className={classes.tablePagination}
          rowsPerPageOptions={[0]}
          component='div'
          count={filteredData.length}
          rowsPerPage={ROWS_PER_PAGE}
          page={page}
          onChangePage={handleChangePage}
        />
      </Box>
    </Box>
  );
}
