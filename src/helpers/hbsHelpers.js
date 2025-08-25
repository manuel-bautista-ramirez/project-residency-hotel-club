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
  not: (a) => !a
};
