import React, { useState } from 'react'
import { DropzoneDialog } from 'material-ui-dropzone'
import { IconButton } from '@material-ui/core'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'

import { toJson } from '../../../helpers'
import { useValueStream } from '../valueStreamContext'

const useStyles = makeStyles((theme) => ({
  button: { color: theme.palette.secondary.dark },
}))

const FileUpload = () => {
  const theme = useTheme()
  const classes = useStyles(theme)
  const { initState } = useValueStream()

  const [state, setState] = useState({ files: [] })

  let fileReader

  const handleRead = () => {
    const data = toJson(fileReader.result)
    if (data) {
      initState(data)
    } else {
      throw new Error('File not JSON')
    }
  }

  const handleFileChosen = (file) => {
    fileReader = new FileReader()
    fileReader.onloadend = handleRead
    fileReader.readAsText(file)
  }

  const handleClose = () => {
    setState({
      open: false,
    })
  }

  const handleSave = (files) => {
    // Saving files to state for further use and closing Modal.
    setState({
      files,
      open: false,
    })
    handleFileChosen(files[0])
  }

  const handleOpen = () => {
    setState({
      open: true,
    })
  }

  return (
    <div>
      <IconButton
        title="Open file upload"
        color="inherit"
        component="span"
        className={classes.button}
        onClick={handleOpen}
      >
        <CloudUploadIcon />
      </IconButton>

      <DropzoneDialog
        open={state.open}
        onSave={handleSave}
        filesLimit={1}
        acceptedFiles={['application/json']}
        showPreviews
        maxFileSize={5000000}
        onClose={handleClose}
        showPreviewsInFileUpload={false}
        showFileNames
        previewText="File:"
      />
    </div>
  )
}

export default FileUpload
