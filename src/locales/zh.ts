export default {
  menu: {
    annotation: '立即标注',
    labelConfig: '标签配置'
  },
  common: {
    upload: '上传',
    import: '导入配置',
    importSuccess: '导入成功',
    importFailed: '导入失败',
    export: '导出配置',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
    exportFormat: '导出格式',
    selectExportFormat: '请选择导出格式',
    unannotatedWarning: '共有 {count} 个原始文件未标注，原始文件的序号背景色改为了<span style="color: #d03050">红色</span>，请确认是否继续导出数据',
    unannotatedDetail: '如：{indices} 未标注',
    formats: {
        tagzero: 'TagZero JSON (原生)',
        coco: 'COCO (JSON)',
        yolo: 'YOLO (TXT + Zip)',
        voc: 'Pascal VOC (XML + Zip)'
    },
    delete: '删除',
    edit: '编辑',
    cancel: '取消',
    confirm: '确认',
    add: '添加',
    addNew: '新增',
    continueAdd: '继续新增',
    fullscreen: '全屏',
    exitFullscreen: '恢复',
    noImage: '无图片',
    clickToUpload: '点击上传',
    uploadFolder: '上传文件夹',
    uploadSingle: '上传单张图片',
    uploadMultiple: '上传多张图片',
    emptyStateTip: '暂无图片，请上传'
  },
  annotation: {
    presetLabels: '预设标签',
    noLabelSet: '未选择标签集',
    annotations: '标注结果',
    uploadImages: '上传图片',
    taskTitle: '任务标题',
    taskTitlePlaceholder: '可选任务标题',
    labelSet: '标签集',
    selectLabelSet: '请选择预设标签集',
    images: '图片',
    selectImageTip: '请选择或上传图片开始标注',
    addLabel: '添加标签',
    enterLabelName: '输入新标签名称',
    selectLabelFirst: '请先选择一个标签',
    noLabels: '无可选标签，请先完善标签列表',
    originalFiles: '原始文件',
    annotationResults: '标注结果',
    realTimeSync: '标签同步：',
    syncTip: '如果开启标签同步，预设标签的【新增】、【删除】会同步修改选中的标签集'
  },
  shapes: {
    rect: '矩形',
    triangle: '三角形',
    circle: '圆形',
    polygon: '多边形'
  },
  toolbar: {
    undo: '撤销',
    redo: '重做',
    zoomIn: '放大',
    zoomOut: '缩小',
    resetZoom: '重置缩放',
    magnifierZoom: '放大镜倍数',
    magnifierSize: '放大镜尺寸'
  },
  labelConfig: {
    editSet: '编辑标签集',
    newSet: '新建标签集',
    name: '名称',
    setNamePlaceholder: '标签集名称',
    presetImage: '预设图片',
    labels: '标签列表',
    labelNamePlaceholder: '标签名称',
    labelValuePlaceholder: '标签值',
    deleteConfirm: '确定要删除这个标签集吗？',
    validation: {
      nameRequired: '请输入标签集名称',
      labelsRequired: '标签列表不能为空',
      labelNameRequired: '标签名称不能为空',
      duplicateLabelName: '标签名称不能重复'
    }
  }
}
