const value = { cells: { "行选项 1_0": "hello" } };
const cellKey = "行选项 1_0";
const occupied = { userId: 'admin', val: 'hello' };
const isMe = true;

const myVal = (value && value.cells && value.cells[cellKey] !== undefined) 
  ? value.cells[cellKey] 
  : (isMe ? occupied.val : '');
  
const hasLocalValue = value && value.cells && value.cells[cellKey] !== undefined;
const displayVal = hasLocalValue ? myVal : (occupied?.val || '');

console.log({ myVal, hasLocalValue, displayVal });
