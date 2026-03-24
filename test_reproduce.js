const latestResponses = [
  { id: 1, userId: 'admin', userName: 'Admin', time: '2023', answers: { q1: { cells: { 'Row1_0': 'My Answer' }, addedRows: [] } } }
];

const user = { username: 'admin', role: 'admin' };
const mode = 'fill';
const qId = 'q1';

const responsesProp = latestResponses.map(r => ({ 
  userId: r.userId, 
  userName: r.userName, 
  time: r.time, 
  answer: r.answers?.[qId] 
})).filter(r => r.answer !== undefined && r.answer !== null && r.answer !== '');

const matrixResponses = (mode === 'board' || mode === 'fill') ? responsesProp : [];

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

// Now let's simulate answers state
const answers = {};
const myRes = latestResponses.find(r => r.userId === user?.username);
if (myRes) {
  answers[qId] = myRes.answers[qId];
}

const value = answers[qId];
console.log("value:", value);

const currentUserId = user.username;
const cellKey = 'Row1_0';

const occupied = occupiedCells[cellKey];
const isMe = occupied?.userId === currentUserId;
const isOccupiedByOther = occupied && !isMe;

const myVal = (value && value.cells && value.cells[cellKey] !== undefined) 
  ? value.cells[cellKey] 
  : (isMe ? occupied.val : '');
  
const hasLocalValue = value && value.cells && value.cells[cellKey] !== undefined;
const displayVal = hasLocalValue ? myVal : (occupied?.val || '');
  
const cellDisabled = isOccupiedByOther; // ignoring isDisabled for now

console.log({
  isMe,
  isOccupiedByOther,
  myVal,
  hasLocalValue,
  displayVal,
  cellDisabled
});
