import React, { useEffect, useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@material-ui/core'
import { makeStyles, useTheme } from '@material-ui/core/styles'

import { getNodesums } from '../../helpers'
import { useValueStream } from './valueStreamContext'

const useStyles = makeStyles((theme) => ({
  tableContainer: {
    minWidth: 200,
  },

  title: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
}))

const Totals = () => {
  const { state } = useValueStream()
  const [totals, setTotals] = useState(getNodesums(state.elements))
  const theme = useTheme()
  const classes = useStyles(theme)

  useEffect(() => {
    const total = getNodesums(state.elements)
    setTotals(total)
  }, [state.elements])

  const rows = [
    { name: 'processTime', title: 'Work Time', value: totals.processTime },
    { name: 'waitTime', title: 'Wait Time', value: totals.waitTime },
    {
      name: 'averageActors',
      title: 'People / Step',
      value: totals.averageActors,
    },
    { name: 'peopleTime', title: 'Manual Time', value: totals.peopleTime },
    { name: 'avgPCA', title: 'Average C/A', value: `${totals.avgPCA}%` },
    {
      name: 'reworkTime',
      title: 'Rework Time',
      value: `${totals.reworkTime}`,
    },
    { name: 'totalTime', title: 'Total Time', value: totals.totalTime },
    {
      name: 'flowEfficiency',
      title: 'Flow Efficiency',
      value: `${totals.flowEfficiency}%`,
    },
  ]
  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        className={classes.tableContainer}
      >
        <Table className={classes.table} aria-label="simple table">
          <TableBody>
            <TableRow>
              <TableCell align="center" colSpan={2}>
                <Typography className={classes.title} gutterBottom>
                  Totals
                </Typography>
              </TableCell>
            </TableRow>
            {rows.map((row) => (
              <TableRow key={row.name} data-testid={row.name}>
                <TableCell align="left">{row.title}</TableCell>
                <TableCell align="right">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

export default Totals
