export default {
  menu: {
    annotation: 'Immediate Annotation',
    labelConfig: 'Label Config'
  },
  common: {
    upload: 'Upload',
    export: 'Export Data',
    exportSuccess: 'Export successful',
    exportFormat: 'Export Format',
    selectExportFormat: 'Select Export Format',
    unannotatedWarning: 'There are {count} unannotated original files. The background color of their indices has been changed to <span style="color: #d03050">red</span>. Please confirm whether to continue exporting data.',
    unannotatedDetail: 'E.g.: {indices} unannotated',
    formats: {
        tagzero: 'TagZero JSON (Native)',
        coco: 'COCO (JSON)',
        yolo: 'YOLO (TXT + Zip)',
        voc: 'Pascal VOC (XML + Zip)'
    },
    delete: 'Delete',
    edit: 'Edit',
    cancel: 'Cancel',
    confirm: 'Confirm',
    add: 'Add',
    addNew: 'Add New',
    continueAdd: 'Continue Adding',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    noImage: 'No Image',
    clickToUpload: 'Click to Upload',
    uploadFolder: 'Upload Folder',
    uploadSingle: 'Upload Single Image',
    uploadMultiple: 'Upload Multiple Images',
    emptyStateTip: 'No images, please upload'
  },
  annotation: {
    presetLabels: 'Preset Labels',
    noLabelSet: 'No Label Set Selected',
    annotations: 'Annotations',
    uploadImages: 'Upload Images',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'Optional task title',
    labelSet: 'Label Set',
    selectLabelSet: 'Select a label set',
    images: 'Images',
    selectImageTip: 'Select or upload an image to start',
    addLabel: 'Add Label',
    enterLabelName: 'Enter new label name',
    selectLabelFirst: 'Please select a label first',
    noLabels: 'No selectable labels, please complete the label list first',
    originalFiles: 'Original Files',
    annotationResults: 'Annotation Results',
    realTimeSync: 'Label Sync:',
    syncTip: 'If Label Sync is enabled, [Add] and [Delete] operations on preset labels will sync to the selected label set.'
  },
  shapes: {
    rect: 'Rect',
    triangle: 'Triangle',
    circle: 'Circle',
    polygon: 'Polygon'
  },
  toolbar: {
    undo: 'Undo',
    redo: 'Redo',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom'
  },
  labelConfig: {
    editSet: 'Edit Label Set',
    newSet: 'New Label Set',
    name: 'Name',
    setNamePlaceholder: 'Label Set Name',
    presetImage: 'Preset Image',
    labels: 'Labels',
    labelNamePlaceholder: 'Label Name',
    labelValuePlaceholder: 'Label Value',
    deleteConfirm: 'Are you sure you want to delete this label set?',
    validation: {
      nameRequired: 'Label set name is required',
      labelsRequired: 'Label list cannot be empty',
      labelNameRequired: 'Label name cannot be empty',
      duplicateLabelName: 'Label name cannot be duplicate'
    }
  }
}
