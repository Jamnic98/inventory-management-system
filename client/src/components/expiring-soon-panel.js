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
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';

const ROWS_PER_PAGE = 6;
const ROW_HEIGHT = 32.2;

const headCells = [
  {
    id: 'item',
    label: 'Item',
  },
  {
    id: 'expirationDate',
    label: 'Exp. date',
  },
  {
    id: 'room',
    label: 'Room',
  },
  {
    id: 'location',
    label: 'Location',
  },
];

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
  tableCell: {
    width: '25%',
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

function ExpiringSoonPanel(props) {
  const { tableData } = props;

  const classes = useStyles();
  const [page, setPage] = useState(0);

  const emptyRows =
    ROWS_PER_PAGE -
    Math.min(ROWS_PER_PAGE, tableData.length - page * ROWS_PER_PAGE);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const setOutput = () => {
    return (
      <Paper className={classes.paper}>
        <TableContainer className={classes.tableContainer}>
          <Table
            className={classes.table}
            aria-labelledby='tableTitle'
            size='small'
            aria-label='enhanced table'
          >
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell key={headCell.id} align='center' padding='default'>
                    <div className={classes.textContainer}>
                      {headCell.label}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData
                .slice(
                  page * ROWS_PER_PAGE,
                  page * ROWS_PER_PAGE + ROWS_PER_PAGE
                )
                .map((row, index) => {
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      className={classes.tableRow}
                      hover
                      role='checkbox'
                      tabIndex={-1}
                      key={row._id}
                    >
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
                          {new Date(row.expirationDate).toLocaleDateString()}
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
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: ROW_HEIGHT * emptyRows }}>
                  <TableCell colSpan={4} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          className={classes.tablePagination}
          rowsPerPageOptions={[0]}
          component='div'
          count={tableData.length}
          rowsPerPage={ROWS_PER_PAGE}
          page={page}
          onChangePage={handleChangePage}
        />
      </Paper>
    );
  };

  return setOutput();
}

export default ExpiringSoonPanel;
