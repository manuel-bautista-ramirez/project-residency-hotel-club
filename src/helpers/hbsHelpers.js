export const hbsHelpers = {
  eq: (a, b) => a === b,
  or: (...args) => {
    args.pop(); // último argumento es "options" de Handlebars
    return args.some(Boolean);
  },
  and: (...args) => {
    args.pop();
    return args.every(Boolean);
  },
  not: (a) => !a,

  // Helper para comparar mayor que
  gt: (a, b) => a > b,
  // Helper para comparar menor que
  lt: (a, b) => a < b,
  // Helper para comparar menor o igual que
  lte: (a, b) => a <= b,
  // Helper para comparar mayor o igual que
  gte: (a, b) => a >= b,
  //json: (context) => JSON.stringify(context)
};
