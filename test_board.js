const latestResponses = [
  { id: 1, userId: 'u1', userName: 'User 1', answers: { q1: { cells: { 'R1_0': true } } } },
  { id: 2, userId: 'u2', userName: 'User 2', answers: { q1: { cells: { 'R2_0': true } } } }
];

const question = { id: 'q1' };
const responses = latestResponses.map(r => ({ userId: r.userId, userName: r.userName, answer: r.answers?.[question.id] }));

const occupiedCells = {};
responses.forEach(r => {
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

console.log(occupiedCells);
