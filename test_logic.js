const currentUserId = 'admin';
const responses = [
  { userId: 'admin', userName: 'Admin', answer: { cells: { 'Row1_0': 'My answer' }, addedRows: ['NewRow'] } },
  { userId: 'user2', userName: 'User 2', answer: { cells: { 'Row2_0': 'User 2 answer', 'NewRow_0': 'U2 in NewRow' }, addedRows: [] } }
];

const matrixResponses = responses;
const value = { cells: { 'Row1_0': 'My answer' }, addedRows: ['NewRow'] }; // my local answers
const props = { rows: ['Row1', 'Row2'], cols: ['Col1'], mode: 'input' };

let customRows = [];
matrixResponses.forEach(r => {
  if (r.answer && r.answer.addedRows) {
    r.answer.addedRows.forEach(rowName => {
      if (!customRows.includes(rowName)) customRows.push(rowName);
    });
  }
});
if (value && value.addedRows) {
  value.addedRows.forEach(rowName => {
    if (!customRows.includes(rowName)) customRows.push(rowName);
  });
}

const allRows = [...props.rows, ...customRows];

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

console.log("allRows:", allRows);
console.log("occupiedCells:", occupiedCells);

allRows.forEach(rowName => {
  props.cols.forEach((col, cIdx) => {
    const cellKey = `${rowName}_${cIdx}`;
    const occupied = occupiedCells[cellKey];
    const isMe = occupied?.userId === currentUserId;
    const isOccupiedByOther = occupied && !isMe;
    
    const myVal = (value && value.cells && value.cells[cellKey] !== undefined) 
      ? value.cells[cellKey] 
      : (isMe ? occupied.val : '');
      
    const hasLocalValue = value && value.cells && value.cells[cellKey] !== undefined;
    const displayVal = hasLocalValue ? myVal : (occupied?.val || '');
    
    console.log(`Cell ${cellKey}: occupiedBy=${occupied?.userId}, isMe=${isMe}, isOccupiedByOther=${isOccupiedByOther}, displayVal=${displayVal}`);
  });
});
