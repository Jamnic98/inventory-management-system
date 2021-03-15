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
import Box from '@material-ui/core/Box';

const ROWS_PER_PAGE = 5;
const ROW_HEIGHT = 52.2;

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

export default function EnhancedTable(props) {
  const { allItems, deleteItemById, addItem, setAllItems } = props;

  const classes = useStyles();
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [filterWord, setFilterWord] = useState('');
  const [filteredItems, setFilteredData] = useState([]);

  const emptyRows =
    ROWS_PER_PAGE -
    Math.min(ROWS_PER_PAGE, filteredItems.length - page * ROWS_PER_PAGE);

  useEffect(() => {
    const regEx = new RegExp(filterWord, 'i');
    setFilteredData(
      allItems.filter((row) => {
        if (filterWord.length > 0) {
          return regEx.test(row.name);
        } else {
          return true;
        }
      })
    );
  }, [allItems, filterWord]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredItems.map((n) => n._id);
      setSelected(newSelecteds);
    } else {
      setSelected([]);
    }
  };

  const handleClick = (_event, _id) => {
    const selectedIndex = selected.indexOf(_id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, _id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const isSelected = (_id) => selected.indexOf(_id) !== -1;

  const setOutput = () => {
    return (
      <Box py={1}>
        <Box mx={1}>
          <Button onClick={addItem} variant='outlined'>
            add
          </Button>
          <Button
            //TODO: sort this shit out
            onClick={async () => {
              if (selected.length > 0) {
                const id = selected[0];
                deleteItemById(id);
                const updatedItems = allItems.filter((item) => item._id !== id);
                setAllItems(updatedItems);
                setSelected([]);
              }
            }}
            variant='outlined'
          >
            DELETE
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
              numSelected={selected.length}
              onSelectAllClick={handleSelectAllClick}
              rowCount={filteredItems.length}
            />
            <TableBody>
              {filteredItems
                .slice(
                  page * ROWS_PER_PAGE,
                  page * ROWS_PER_PAGE + ROWS_PER_PAGE
                )
                .map((row, index) => {
                  const isItemSelected = isSelected(row._id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      className={classes.tableRow}
                      hover
                      onClick={(event) => handleClick(event, row._id)}
                      role='checkbox'
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row._id}
                      selected={isItemSelected}
                    >
                      <TableCell
                        className={classes.tableCell}
                        padding='checkbox'
                      >
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
                          {new Date(row.expirationDate).toLocaleDateString()}
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
            onChange={(e) => {
              setPage(0);
              setFilterWord(e.target.value.trim().toLowerCase());
            }}
            fullWidth
            margin='dense'
            label='Search by item'
            variant='outlined'
          ></TextField>
          <TablePagination
            className={classes.tablePagination}
            rowsPerPageOptions={[0]}
            component='div'
            count={filteredItems.length}
            rowsPerPage={ROWS_PER_PAGE}
            page={page}
            onChangePage={handleChangePage}
          />
        </Box>
      </Box>
    );
  };

  return setOutput();
}
