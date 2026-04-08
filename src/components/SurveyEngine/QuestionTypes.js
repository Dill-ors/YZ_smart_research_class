import { 
  Type, AlignLeft, Circle, CheckSquare, 
  Grid, Star, ArrowDownUp, Upload, Layers, List, Edit2
} from 'lucide-react';

export const QUESTION_TYPES = [
  { 
    type: 'title', 
    label: '标题与描述', 
    icon: Type, 
    defaultProps: { 
      label: '问卷标题', 
      level: 'h1', 
      align: 'center', 
      description: '请输入问卷副标题或描述说明...' 
    } 
  },
  { 
    type: 'text', 
    label: '段落说明', 
    icon: AlignLeft, 
    defaultProps: { 
      label: '文字说明', 
      content: '此处输入详细的说明文字，支持分段和富文本。' 
    } 
  },
  {
    type: 'radio',
    label: '单选题',
    icon: Circle,
    defaultProps: {
      label: '单选题标题',
      options: ['选项 1', '选项 2'],
      layout: 'vertical',
      required: true,
      logicJump: {},
      level: 'none'
    }
  },
  {
    type: 'checkbox',
    label: '多选题',
    icon: CheckSquare,
    defaultProps: {
      label: '多选题标题',
      options: ['选项 1', '选项 2', '选项 3'],
      layout: 'vertical',
      min: 0,
      max: 0,
      required: true,
      level: 'none'
    }
  },
  {
    type: 'matrix',
    label: '矩阵题',
    icon: Grid,
    defaultProps: {
      label: '矩阵题标题',
      mode: 'radio', // radio, checkbox, input
      topLeftLabel: '', // 第一行第一列的属性标签
      allowAddRows: false, // 允许填报者动态添加行
      rows: ['行选项 1', '行选项 2'],
      cols: ['列选项 1', '列选项 2', '列选项 3'],
      required: true,
      level: 'none'
    }
  },
  {
    type: 'rate',
    label: '评分题',
    icon: Star,
    defaultProps: {
      label: '评分题标题',
      maxStar: 5,
      shape: 'star', // star, number, slider
      required: true,
      level: 'none'
    }
  },
  {
    type: 'sort',
    label: '排序题',
    icon: ArrowDownUp,
    defaultProps: {
      label: '排序题标题',
      options: ['排序项 1', '排序项 2', '排序项 3'],
      required: true,
      level: 'none'
    }
  },
  {
    type: 'upload',
    label: '文件上传',
    icon: Upload,
    defaultProps: {
      label: '文件上传标题',
      maxFiles: 1,
      maxSize: 10, // MB
      accept: 'image/*,application/pdf',
      required: false,
      level: 'none'
    }
  },
  {
    type: 'blank',
    label: '填空题',
    icon: Edit2,
    defaultProps: {
      label: '填空题标题',
      placeholder: '请输入内容...',
      layout: 'vertical',
      required: true,
      level: 'none'
    }
  },
  {
    type: 'lesson_record',
    label: '听课记录',
    icon: List,
    defaultProps: {
      label: '课堂听课记录',
      description: '请填写您的听课记录',
      required: true,
      level: 'none'
    }
  },
  { 
    type: 'pagination', 
    label: '分页导航', 
    icon: Layers, 
    defaultProps: { 
      label: '分页', 
      showProgress: true 
    } 
  }
];
