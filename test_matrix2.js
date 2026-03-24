const value = { cells: { 'row1_0': 'test_from_value' } };
const occupiedCells = { 'row1_0': { userId: 'me', val: 'test' } };
const cellKey = 'row1_0';
const currentUserId = 'me';

const occupied = occupiedCells[cellKey];
const isMe = occupied?.userId === currentUserId;
const isOccupiedByOther = occupied && !isMe;

const myVal = (value && value.cells && value.cells[cellKey] !== undefined) 
  ? value.cells[cellKey] 
  : (isMe ? occupied.val : '');
  
const hasLocalValue = value && value.cells && value.cells[cellKey] !== undefined;
const displayVal = hasLocalValue ? myVal : (occupied?.val || '');

console.log({ myVal, displayVal, isOccupiedByOther });
