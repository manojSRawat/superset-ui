import { ConditionProps } from '../types';

function isConditionSatisfied(originalValue: any, comparativeValue: any, symbol: String) {
  if (!isNaN(originalValue) && !isNaN(comparativeValue)) {
    const oValue = parseFloat(originalValue);
    const cValue = parseFloat(comparativeValue);

    switch (symbol) {
      case 'GREATER':
      case '>':
        return oValue > cValue;
      case 'GREATER_EQUAL':
      case '>=':
        return oValue >= cValue;
      case 'LESS':
      case '<':
        return oValue < cValue;
      case 'LESS_EQUAL':
      case '<=':
        return oValue <= cValue;
      case 'EQUAL':
      case '=':
        return oValue === cValue;
      default:
        return false;
    }
  } else if (typeof originalValue === 'string' && typeof comparativeValue === 'string') {
    switch (symbol) {
      case 'EQUAL':
      case '=':
        return originalValue === comparativeValue;
      default:
        return false;
    }
  } else {
    return false;
  }
}

export default function getCellData(
  cellKey: string,
  cellValue: any,
  conditions: Array<ConditionProps>,
  isTotalRow = false,
) {
  let colorProperty = 'rgba(255, 255, 255, 255)';
  let align = 'left';
  let parsedValue = cellValue;
  let showTotal = false;
  let isImage = false;
  let imageParams = {
    height: 50,
    width: 50,
    remarkColumn: null,
  };

  console.log(conditions, ' ============--------------');
  if (conditions) {
    for (const condition of conditions) {
      if (condition.column === cellKey && condition.conditions) {
        if (condition.alignment) {
          align = condition.alignment;
        }
        showTotal = condition.showTotal;
        if (condition.thumbnailHeight) {
          imageParams.height = condition.thumbnailHeight;
        }
        if (condition.thumbnailWidth) {
          imageParams.width = condition.thumbnailWidth;
        }
        if (condition.remarkColumn) {
          imageParams.remarkColumn = condition.remarkColumn;
        }
        if (condition.format) {
          switch (condition.format) {
            case 'IN':
              if (parsedValue) {
                parsedValue = parsedValue.toString();
                let afterDecimal = '';
                if (parsedValue.indexOf('.') > 0) {
                  afterDecimal = parsedValue.slice(parsedValue.indexOf('.'), parsedValue.length);
                  parsedValue = parsedValue.slice(0, Math.max(0, parsedValue.indexOf('.')));
                }
                parsedValue = parsedValue.replace(/(\d)(?=(\d\d)+\d$)/g, '$1,') + afterDecimal;
              } else {
                cellValue = 0;
                parsedValue = 0;
              }
              break;
            case 'PERCENTAGE':
              cellValue = isNaN(cellValue) || cellValue === null ? 0 : cellValue;
              parsedValue = parsedValue ? `${parsedValue}%` : '0%';
              break;
            case 'IMAGE':
              isImage = true;
              break;
          }
        }

        for (let i = 0; i < condition.conditions.length; i++) {
          if (
            condition.conditions[i].initialValue &&
            isConditionSatisfied(
              cellValue,
              condition.conditions[i].initialValue,
              condition.conditions[i].initialSymbol,
            )
          ) {
            if (
              !condition.conditions[i].finalValue ||
              (condition.conditions[i].finalValue &&
                isConditionSatisfied(
                  cellValue,
                  condition.conditions[i].finalValue,
                  condition.conditions[i].finalSymbol,
                ))
            ) {
              colorProperty = `rgba(${condition.conditions[i].color.r},${condition.conditions[i].color.g},${condition.conditions[i].color.b},${condition.conditions[i].color.a})`;
              break;
            }
          }
        }
      }
    }
  }

  if (isTotalRow && !showTotal) {
    parsedValue = '';
  }

  return {
    style: { backgroundColor: colorProperty },
    class: `text-${align}`,
    value: parsedValue,
    isImage,
    imageParams,
  };
}
