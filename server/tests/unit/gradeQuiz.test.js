import gradeQuiz from '../../utils/gradeQuiz.js';

const makeQuestion = (id, { type = 'single-choice', options, points = 1, explanation = '' } = {}) => ({
  _id: id,
  type,
  points,
  explanation,
  options: options.map((o, i) => ({
    _id: `${id}-opt-${i}`,
    text: o.text,
    isCorrect: o.isCorrect,
  })),
});

describe('gradeQuiz — grading correctness (single-choice)', () => {
  const questions = [
    makeQuestion('q1', {
      options: [
        { text: 'A', isCorrect: true },
        { text: 'B', isCorrect: false },
        { text: 'C', isCorrect: false },
      ],
    }),
    makeQuestion('q2', {
      options: [
        { text: 'A', isCorrect: false },
        { text: 'B', isCorrect: true },
      ],
    }),
  ];

  test('all correct answers → 100% and passed', () => {
    const result = gradeQuiz({
      questions,
      passMarkPercent: 50,
      answers: [
        { question: 'q1', selectedOptions: ['q1-opt-0'] },
        { question: 'q2', selectedOptions: ['q2-opt-1'] },
      ],
    });
    expect(result.score).toBe(2);
    expect(result.totalPoints).toBe(2);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.graded.every((g) => g.isCorrect)).toBe(true);
  });

  test('no answers → 0% and failed', () => {
    const result = gradeQuiz({ questions, passMarkPercent: 50, answers: [] });
    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  test('half correct → 50% and passed at 50% pass mark', () => {
    const result = gradeQuiz({
      questions,
      passMarkPercent: 50,
      answers: [{ question: 'q1', selectedOptions: ['q1-opt-0'] }],
    });
    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(true);
  });

  test('wrong answer earns no points', () => {
    const result = gradeQuiz({
      questions,
      passMarkPercent: 50,
      answers: [{ question: 'q1', selectedOptions: ['q1-opt-1'] }],
    });
    expect(result.score).toBe(0);
    expect(result.graded[0].isCorrect).toBe(false);
  });

  test('ignore answers referencing unknown questions', () => {
    const result = gradeQuiz({
      questions,
      passMarkPercent: 50,
      answers: [{ question: 'unknown', selectedOptions: ['x'] }],
    });
    expect(result.totalPoints).toBe(2);
    expect(result.percentage).toBe(0);
  });
});

describe('gradeQuiz — multiple-choice all-or-nothing rule', () => {
  const q = makeQuestion('multi', {
    type: 'multiple-choice',
    options: [
      { text: 'Red', isCorrect: true },
      { text: 'Green', isCorrect: true },
      { text: 'Blue', isCorrect: false },
    ],
  });

  test('selecting exactly the correct set → full points', () => {
    const result = gradeQuiz({
      questions: [q],
      answers: [{ question: 'multi', selectedOptions: ['multi-opt-0', 'multi-opt-1'] }],
    });
    expect(result.score).toBe(1);
    expect(result.percentage).toBe(100);
  });

  test('missing one correct option → no points (all-or-nothing)', () => {
    const result = gradeQuiz({
      questions: [q],
      answers: [{ question: 'multi', selectedOptions: ['multi-opt-0'] }],
    });
    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
  });

  test('including an incorrect option → no points (all-or-nothing)', () => {
    const result = gradeQuiz({
      questions: [q],
      answers: [{ question: 'multi', selectedOptions: ['multi-opt-0', 'multi-opt-1', 'multi-opt-2'] }],
    });
    expect(result.score).toBe(0);
  });
});

describe('gradeQuiz — true/false and weighted points', () => {
  test('true/false question graded correctly', () => {
    const q = makeQuestion('tf', {
      type: 'true-false',
      options: [
        { text: 'True', isCorrect: true },
        { text: 'False', isCorrect: false },
      ],
    });
    const result = gradeQuiz({
      questions: [q],
      answers: [{ question: 'tf', selectedOptions: ['tf-opt-0'] }],
    });
    expect(result.percentage).toBe(100);
  });

  test('weighted points: correct 3-pt question and wrong 1-pt question → 75%', () => {
    const questions = [
      makeQuestion('w1', {
        points: 3,
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
      }),
      makeQuestion('w2', {
        points: 1,
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false },
        ],
      }),
    ];
    const result = gradeQuiz({
      questions,
      answers: [
        { question: 'w1', selectedOptions: ['w1-opt-0'] },
        { question: 'w2', selectedOptions: ['w2-opt-1'] },
      ],
    });
    expect(result.score).toBe(3);
    expect(result.totalPoints).toBe(4);
    expect(result.percentage).toBe(75);
  });
});

describe('gradeQuiz — edge cases', () => {
  test('empty questions → 0 without divide-by-zero NaN', () => {
    const result = gradeQuiz({ questions: [], answers: [] });
    expect(result.percentage).toBe(0);
    expect(Number.isNaN(result.percentage)).toBe(false);
  });

  test('duplicate submitted options are deduplicated', () => {
    const q = makeQuestion('d1', {
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
    });
    const result = gradeQuiz({
      questions: [q],
      answers: [{ question: 'd1', selectedOptions: ['d1-opt-0', 'd1-opt-0', 'd1-opt-0'] }],
    });
    expect(result.percentage).toBe(100);
  });

  test('string vs ObjectId ids are normalized', () => {
    const q = makeQuestion('obj', {
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
    });
    q.options = q.options.map((o) => ({ ...o, _id: { toString: () => o._id } }));
    const result = gradeQuiz({
      questions: [q],
      answers: [{ question: 'obj', selectedOptions: ['obj-opt-0'] }],
    });
    expect(result.percentage).toBe(100);
  });
});
