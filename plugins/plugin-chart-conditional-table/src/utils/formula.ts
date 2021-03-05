export default function parseInfixString(formulaString: string) {
  let operators = [];
  let values: Array<number> = [];

  for (let i = 0; i < formulaString.length; i++) {
    if (formulaString[i] === ' ') {
      continue;
    } else if (formulaString[i] === '(') {
      operators.push(formulaString[i]);
    } else if (!isNaN(parseInt(formulaString[i]))) {
      let actualValue = '';
      let currentValue = formulaString[i];
      while (i < formulaString.length && !isNaN(Number(currentValue))) {
        actualValue = currentValue;
        i++;
        currentValue += formulaString[i];
      }
      i--;
      values.push(parseFloat(actualValue));
    } else if (formulaString[i] === ')') {
      while (operators.length && operators[operators.length - 1] !== '(') {
        let value2: any = values.pop();
        let value1: any = values.pop();
        let op: any = operators.pop();

        values.push(applyOp(value1, value2, op));
      }
      if (operators.length) {
        operators.pop();
      }
    } else {
      while (
        operators.length &&
        precedence(operators[operators.length - 1]) >= precedence(formulaString[i])
      ) {
        let value2: any = values.pop();
        let value1: any = values.pop();
        let op: any = operators.pop();

        values.push(applyOp(value1, value2, op));
      }
      operators.push(formulaString[i]);
    }
  }
  while (operators.length) {
    let value2: any = values.pop();
    let value1: any = values.pop();
    let op: any = operators.pop();

    values.push(applyOp(value1, value2, op));
  }

  return values[0];
}

function precedence(op: string): number {
  if (op == '+' || op == '-') return 1;
  if (op == '*' || op == '/') return 2;
  return 0;
}

function applyOp(a: number, b: number, op: string): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return a / b;
  }

  return 0;
}
