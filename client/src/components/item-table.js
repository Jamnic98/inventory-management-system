import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';

const ROWS_PER_PAGE = 5;

const headCells = [
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'Name',
  },
  { id: 'quantity', numeric: true, disablePadding: false, label: 'Quantity' },
  { id: 'room', numeric: false, disablePadding: false, label: 'Room' },
  { id: 'location', numeric: false, disablePadding: false, label: 'Location' },
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
            align={headCell.numeric ? 'center' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'default'}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
  },
  tableRow: {
    cursor: 'pointer',
  },
  tableContainer: {
    minHeight: 220,
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
  const { allItems } = props;

  const classes = useStyles();
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [filterWord, setFilterWord] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  console.log(
    '🚀 ~ file: item-table.js ~ line 106 ~ EnhancedTable ~ filteredData',
    filteredData
  );

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
      const newSelecteds = filteredData.map((n) => n.name);
      setSelected(newSelecteds);
    } else {
      setSelected([]);
    }
  };

  const handleClick = (_event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
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

  const isSelected = (name) => selected.indexOf(name) !== -1;

  const emptyRows =
    ROWS_PER_PAGE -
    Math.min(ROWS_PER_PAGE, filteredData.length - page * ROWS_PER_PAGE);

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <TableContainer className={classes.tableContainer}>
          <Table
            className={classes.table}
            aria-labelledby='tableTitle'
            size='small'
            aria-label='enhanced table'
          >
            <EnhancedTableHead
              classes={classes}
              numSelected={selected.length}
              onSelectAllClick={handleSelectAllClick}
              rowCount={filteredData.length}
            />
            <TableBody>
              {filteredData
                .slice(
                  page * ROWS_PER_PAGE,
                  page * ROWS_PER_PAGE + ROWS_PER_PAGE
                )
                .map((row, index) => {
                  const isItemSelected = isSelected(row.name);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      className={classes.tableRow}
                      hover
                      onClick={(event) => handleClick(event, row.name)}
                      role='checkbox'
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.name}
                      selected={isItemSelected}
                    >
                      <TableCell padding='checkbox'>
                        <Checkbox
                          checked={isItemSelected}
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                      <TableCell
                        component='th'
                        id={labelId}
                        scope='row'
                        padding='none'
                        align='left'
                      >
                        {row.name}
                      </TableCell>
                      <TableCell align='center'>{row.quantity}</TableCell>
                      <TableCell align='left'>{row.room}</TableCell>
                      <TableCell align='left'>{row.location}</TableCell>
                      <TableCell align='center'>
                        {new Date(row.expirationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align='center'>
                        {row.lowStockAlert.toString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 33 * emptyRows }}>
                  <TableCell colSpan={7} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TextField
          onChange={(e) => {
            setPage(0);
            setFilterWord(e.target.value.trim().toLowerCase());
          }}
          fullWidth
          margin='dense'
          label='Search by item name'
          variant='outlined'
        ></TextField>
        <TablePagination
          rowsPerPageOptions={0}
          component='div'
          count={filteredData.length}
          rowsPerPage={ROWS_PER_PAGE}
          page={page}
          onChangePage={handleChangePage}
        />
      </Paper>
    </div>
  );
}
