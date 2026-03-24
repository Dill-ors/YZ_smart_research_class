const currentUserId = 'admin';
const userRole = 'admin';
const mode = 'board';

const value = { cells: { 'row0_0': 'hello' }, addedRows: [] }; // my answers[q.id]

const responses = [
  { userId: 'admin', userName: '管理员', answer: { cells: { 'row0_0': 'hello' }, addedRows: [] } }
];

const matrixResponses = (mode === 'board' || mode === 'fill') ? responses : [];

const occupiedCells = {};
matrixResponses.forEach(r => {
  if (r.answer && r.answer.cells) {
    Object.entries(r.answer.cells).forEach(([key, val]) => {
      if (val !== undefined && val !== '' && val !== false) {
         if (!occupiedCells[key] || occupiedCells[key].userId === r.userId) {
            occupiedCells[key] = { userId: r.userId, userName: r.userName, val };
         }
      }
    });
  }
});

console.log("occupiedCells:", occupiedCells);

const cellKey = 'row0_0';
const occupied = occupiedCells[cellKey];
const isMe = occupied?.userId === currentUserId;
const isOccupiedByOther = occupied && !isMe;

const myVal = (value && value.cells && value.cells[cellKey] !== undefined) 
  ? value.cells[cellKey] 
  : (isMe ? occupied.val : '');
  
const hasLocalValue = value && value.cells && value.cells[cellKey] !== undefined;
const displayVal = hasLocalValue ? myVal : (occupied?.val || '');

console.log({
  isMe, isOccupiedByOther, myVal, hasLocalValue, displayVal
});