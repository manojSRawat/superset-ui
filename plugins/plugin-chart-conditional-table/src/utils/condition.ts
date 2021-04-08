import { ConditionProps } from '../types';
import moment from 'moment';

function isConditionSatisfied(
  originalValue: any,
  comparativeValue: any,
  symbol: String,
  dataType: string,
  dateFormat: string,
) {
  let isComparisonSatisfied = false;
  switch (dataType) {
    case 'NUMBER':
      const oValue = parseFloat(originalValue);
      const cValue = parseFloat(comparativeValue);

      switch (symbol) {
        case 'GREATER':
        case '>':
          isComparisonSatisfied = oValue > cValue;
          break;
        case 'GREATER_EQUAL':
        case '>=':
          isComparisonSatisfied = oValue >= cValue;
          break;
        case 'LESS':
        case '<':
          isComparisonSatisfied = oValue < cValue;
          break;
        case 'LESS_EQUAL':
        case '<=':
          isComparisonSatisfied = oValue <= cValue;
          break;
        case 'EQUAL':
        case '=':
          isComparisonSatisfied = oValue === cValue;
          break;
      }
      break;
    case 'STRING':
      switch (symbol) {
        case 'EQUAL':
        case '=':
          isComparisonSatisfied = originalValue === comparativeValue;
      }
      break;
    case 'DATE':
      if (comparativeValue === 'now') {
        comparativeValue = moment();
      } else if (Number(comparativeValue)) {
        comparativeValue = moment(comparativeValue, dateFormat);
      }

      if (Number(originalValue)) {
        originalValue = moment.unix(originalValue / 1000);
      }

      switch (symbol) {
        case 'GREATER':
        case '>':
          isComparisonSatisfied = moment(originalValue).isAfter(comparativeValue);
          break;
        case 'GREATER_EQUAL':
        case '>=':
          isComparisonSatisfied = moment(originalValue).isSameOrAfter(comparativeValue);
          break;
        case 'LESS':
        case '<':
          isComparisonSatisfied = moment(originalValue).isBefore(comparativeValue);
          break;
        case 'LESS_EQUAL':
        case '<=':
          isComparisonSatisfied = moment(originalValue).isSameOrBefore(comparativeValue);
          break;
        case 'EQUAL':
        case '=':
          isComparisonSatisfied = moment(originalValue).isSame(comparativeValue);
          break;
      }
  }

  return isComparisonSatisfied;
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
    remarkColumn: '',
  };
  let dataType = 'STRING';

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
              dataType = 'NUMBER';
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
            case 'DATE':
              dataType = 'DATE';
              if (isNaN(cellValue)) {
                parsedValue = '';
              }
              if (Number(cellValue)) {
                parsedValue = moment.unix(parseInt(cellValue) / 1000).format(condition.dateFormat);
              } else {
                parsedValue = moment(cellValue).format(condition.dateFormat);
              }
              break;
          }
        }

        for (let i = 0; i < condition.conditions.length; i++) {
          if (
            !isNaN(condition.conditions[i].initialValue) &&
            !isNaN(condition.conditions[i].initialValue)
          ) {
            dataType = 'NUMBER';
          }
          if (
            condition.conditions[i].initialValue &&
            isConditionSatisfied(
              cellValue,
              condition.conditions[i].initialValue,
              condition.conditions[i].initialSymbol,
              dataType,
              condition.dateFormat,
            )
          ) {
            if (
              !condition.conditions[i].finalValue ||
              (condition.conditions[i].finalValue &&
                isConditionSatisfied(
                  cellValue,
                  condition.conditions[i].finalValue,
                  condition.conditions[i].finalSymbol,
                  dataType,
                  condition.dateFormat,
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
