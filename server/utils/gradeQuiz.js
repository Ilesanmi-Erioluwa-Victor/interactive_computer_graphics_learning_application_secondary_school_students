const gradeQuiz = ({ questions, answers = [], passMarkPercent = 50 }) => {
  let score = 0;
  let totalPoints = 0;

  const graded = (questions || []).map((question) => {
    totalPoints += question.points;

    const answer = answers.find((a) => String(a.question) === String(question._id));
    const correctSet = new Set(
      (question.options || []).filter((o) => o.isCorrect).map((o) => String(o._id))
    );
    const selectedSet = new Set(
      (answer?.selectedOptions || []).map((s) => String(s))
    );

    let isCorrect = false;
    if (correctSet.size === 0) {
      isCorrect = selectedSet.size === 0;
    } else {
      isCorrect =
        selectedSet.size === correctSet.size &&
        [...correctSet].every((id) => selectedSet.has(id));
    }
    if (isCorrect) score += question.points;

    return {
      question: question._id,
      isCorrect,
      correctAnswers: [...correctSet],
      explanation: question.explanation,
    };
  });

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  return {
    score,
    totalPoints,
    percentage,
    passed: percentage >= passMarkPercent,
    graded,
  };
};

export default gradeQuiz;
