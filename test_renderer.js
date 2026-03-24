const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Just simple stub to check logic
const qAnswer = { cells: { 'Row1_0': true }, addedRows: ['Row1'] };
const matrixResponses = [
  { userId: 'u1', userName: 'User 1', answer: qAnswer }
];

const occupiedCells = {};
matrixResponses.forEach(r => {
  const qAnswer = r.answer;
  if (qAnswer && qAnswer.cells) {
    Object.entries(qAnswer.cells).forEach(([key, val]) => {
      if (val !== undefined && val !== '' && val !== false) {
         if (!occupiedCells[key] || occupiedCells[key].userId === r.userId) {
            occupiedCells[key] = { userId: r.userId, userName: r.userName, val };
         }
      }
    });
  }
});

console.log("Occupied Cells:", occupiedCells);
