/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useEffect, createRef } from 'react';
import { styled } from '@superset-ui/core';
import { ConditionalTableProps, ConditionalTableStylesProps } from './types';

// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts

const Styles = styled.div<ConditionalTableStylesProps>`
  padding: ${({ theme }) => theme.gridUnit * 4}px;
  border-radius: ${({ theme }) => theme.gridUnit * 2}px;
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  overflow-y: scroll;

  h3 {
    /* You can use your props to control CSS! */
    font-size: ${({ theme, headerFontSize }) => theme.typography.sizes[headerFontSize]};
    font-weight: ${({ theme, boldText }) => theme.typography.weights[boldText ? 'bold' : 'normal']};
  }

  .pivot_table.mt-25px {
    margin-top: 25px;
  }

  table tr {
    height: 50px;
    box-shadow: 0 1px 0 0 #e0e0e0;
  }

  .dashboard-chart {
    box-shadow: 0 0 0 1px #e0e0e0;
    margin-top: 25px;
  }

  table th {
    vertical-align: middle !important;
    font-size: 14px;
    border: 1px solid #e0e0e0;
  }

  table {
    box-shadow: 0 0 0 1px #e0e0e0;
  }

  table td {
    vertical-align: middle !important;
    font-size: 14px;
    border: 1px solid #e0e0e0;
  }

  table thead th svg {
    top: 15px !important;
  }

  text-left {
    text-align: left !important;
  }
  text-right {
    text-align: right !important;
  }
  text-center {
    text-align: center !important;
  }
`;

function getHeader(data: Array<object>) {
  return Object.keys(data[0]);
}

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

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

export default function ConditionalTable(props: ConditionalTableProps) {
  // height and width are the height and width of the DOM element as it exists in the dashboard.
  // There is also a `data` prop, which is, of course, your DATA 🎉
  const { data, height, width, conditions } = props;

  const rootElem = createRef<HTMLDivElement>();

  // Often, you just want to get a hold of the DOM and go nuts.
  // Here, you can do that with createRef, and the useEffect hook.
  useEffect(() => {
    const root = rootElem.current as HTMLElement;
    console.log('Plugin element', root);
  });
  let showTotal = false;
  let total: any = {};

  console.log('Plugin props', props);

  function getCellData(cellKey: string, cellValue: any, isTotal = false) {
    // value: Number, conditions: Array<any>
    let colorProperty = 'rgba(255, 255, 255, 255)';
    let align = 'left';
    let parsedValue = cellValue;
    let showTotalValue = false;

    if (conditions) {
      for (let condition of conditions) {
        if (condition.column === cellKey && condition.conditions) {
          if (condition.alignment) {
            align = condition.alignment;
          }
          if (condition.format) {
            switch (condition.format) {
              case 'IN':
                parsedValue = (parsedValue + '').replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
                break;
              case 'PERCENTAGE':
                parsedValue = parsedValue + '%';
                break;
            }
          }
          showTotalValue = condition.showTotal;
          if (!showTotal && condition.showTotal) {
            showTotal = condition.showTotal;
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
                colorProperty =
                  'rgba(' +
                  condition.conditions[i].color.r +
                  ',' +
                  condition.conditions[i].color.g +
                  ',' +
                  condition.conditions[i].color.b +
                  ',' +
                  condition.conditions[i].color.a +
                  ')';
                break;
              }
            }
          }
        }
      }
    }
    if (!isNaN(cellValue)) {
      if (total[cellKey] === '') {
        total[cellKey] = 0;
      }
      total[cellKey] += parseFloat(cellValue);
      if (!showTotalValue && isTotal) {
        parsedValue = '';
        colorProperty = 'rgba(255, 255, 255, 255)';
      }
    }

    return {
      style: { backgroundColor: colorProperty },
      class: 'text-' + align,
      value: parsedValue,
    };
  }

  if (data && Array.isArray(data) && data.length) {
    Object.keys(data[0]).forEach((key, index) => {
      total[key] = index === 0 ? 'Total' : '';
    });
  }

  return (
    <Styles
      ref={rootElem}
      boldText={props.boldText}
      headerFontSize={props.headerFontSize}
      height={height}
      width={width}
      conditions={props.conditions}
    >
      <h3>{props.headerText}</h3>
      <table className="table table-striped table-condensed">
        <thead>
          <tr>
            {getHeader(data).map((header, index) => {
              const cellData = getCellData(header, header);
              return (
                <th key={index.toString()} className={cellData.class}>
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            return (
              <tr key={rowIndex.toString()}>
                {Object.keys(row).map((cellKey, cellIndex) => {
                  const cellData = getCellData(cellKey, row[cellKey]);
                  return (
                    <td
                      key={cellKey.toString()}
                      style={{ ...cellData.style }}
                      className={cellData.class}
                    >
                      {cellData.value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {showTotal ? (
            <tr>
              {Object.keys(total).map((cellKey, index) => {
                const cellData = getCellData(cellKey, total[cellKey], true);
                return (
                  <td
                    key={index.toString()}
                    style={{ ...cellData.style }}
                    className={cellData.class}
                  >
                    {cellData.value}
                  </td>
                );
              })}
            </tr>
          ) : null}
        </tbody>
      </table>
    </Styles>
  );
}
