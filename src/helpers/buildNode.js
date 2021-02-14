const nodeStyle = {
  borderColor: '#3385e9',
  borderRadius: '12px',
  borderStyle: 'solid',
  borderWidth: '2px',
  padding: 5,
  minWidth: '100px',
}

/**
 *
 * @param {x,y} x and y Coordinates
 */
export const buildNode = ({ id, x, y }) => {
  if (!x || !y) {
    throw new Error('XY Coordinates not available for buildNode')
  }
  const position = { x, y }

  return {
    id: id > 0 ? `${id}` : '-1',
    type: 'customNode',
    elType: 'NODE',
    sourcePosition: 'right',
    targetPosition: 'left',
    selected: false,
    data: {
      description: '',
      actors: 0,
      processTime: 0,
      waitTime: 0,
      pctCompleteAccurate: 100,
    },
    style: {
      borderColor: '#3385e9',
      borderRadius: '12px',
      borderStyle: 'solid',
      borderWidth: '2px',
      padding: 5,
      minWidth: '100px',
    },
    position,
  }
}
