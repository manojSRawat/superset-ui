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
import React, { createRef, useEffect } from 'react';
import { styled } from '@superset-ui/core';
import { useFilters, usePagination, useSortBy, useTable } from 'react-table';
import {
  ConditionalTableProps,
  ConditionalTableStylesProps,
  ConditionProps,
  TableProps,
} from './types';

// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts

const Styles = styled.div<ConditionalTableStylesProps>`
  // padding: ${({ theme }) => theme.gridUnit * 4}px;
  // border-radius: ${({ theme }) => theme.gridUnit * 2}px;
  // overflow-y: scroll;

  .main-container {
    height: 300;
  }

  .tableWrap {
    display: block;
    max-width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
    border-bottom: 1px solid black;
  }

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
    padding: 10px;
  }

  table {
    box-shadow: 0 0 0 1px #e0e0e0;
  }

  table td {
    vertical-align: middle !important;
    font-size: 14px;
    border: 1px solid #e0e0e0;
    padding: 0 10px;
  }

  table thead th svg {
    top: 15px !important;
  }

  .flex-paginate {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

function getHeader(data: Array<object>, conditions: Array<ConditionProps>) {
  const headers: any = [];
  Object.keys(data[0]).forEach(header => {
    const headerObj = {
      Header: header,
      accessor: header,
      disableFilters: true,
      disableSortBy: false,
    };
    if (conditions) {
      for (const condition of conditions) {
        if (condition.column === header) {
          headerObj.disableFilters = condition.disableFilters;
          headerObj.disableSortBy = condition.disableSortBy;
          break;
        }
      }
    }
    headers.push(headerObj);
  });

  return headers;
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

  console.log('Plugin props', props);

  const columns = getHeader(data, conditions);

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
      <div style={{ width, height: height - 50, overflowY: 'scroll' }}>
        <Table columns={columns} data={data} conditions={conditions} />
      </div>
    </Styles>
  );
}

function getCellData(cellKey: string, cellValue: any, conditions: Array<ConditionProps>) {
  let colorProperty = 'rgba(255, 255, 255, 255)';
  let align = 'left';
  let parsedValue = cellValue;

  if (conditions) {
    for (const condition of conditions) {
      if (condition.column === cellKey && condition.conditions) {
        if (condition.alignment) {
          align = condition.alignment;
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
                parsedValue = 0;
              }
              break;
            case 'PERCENTAGE':
              parsedValue = parsedValue ? `${parsedValue}%` : '0';
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

  return {
    style: { backgroundColor: colorProperty },
    class: `text-${align}`,
    value: parsedValue,
  };
}

function DefaultColumnFilter(x: any) {
  return (
    <input
      value={x.column.filterValue || ''}
      placeholder="Search"
      onChange={e => {
        x.column.setFilter(e.target.value || undefined);
      }}
    />
  );
}

function Table(props: TableProps) {
  const { columns, data, conditions } = props;
  const defaultColumn = React.useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    [],
  );

  // @ts-ignore
  const {
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    { columns, data, initialState: { pageIndex: 0 }, defaultColumn },
    useFilters,
    useSortBy,
    usePagination,
  );
  const total = {};
  let showTotal = false;

  data.forEach((d: any) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const key in d) {
      // eslint-disable-next-line no-prototype-builtins
      if (total.hasOwnProperty(key)) {
        if (!isNaN(Number(d[key]))) {
          // @ts-ignore
          total[key] += Math.round(Number(d[key]) * 100) / 100;
          // @ts-ignore
          total[key] = Math.round(total[key] * 100) / 100;
        }
      } else {
        // @ts-ignore
        total[key] = isNaN(Number(d[key])) ? '-' : Math.round(Number(d[key]) * 100) / 100;
      }
    }
  });

  if (conditions) {
    // eslint-disable-next-line no-restricted-syntax
    for (const condition of conditions) {
      if (condition.showTotal) {
        showTotal = true;
        break;
      }
    }
  }

  return (
    <>
      <div className="tableWrap">
        <table>
          <thead>
            {headerGroups.map((headerGroup, headerGroupIndex: number) => (
              <tr key={headerGroupIndex.toString()}>
                {headerGroup.headers.map((column: any, headerIndex: number) => (
                  <th {...column.getHeaderProps()} key={headerIndex.toString()}>
                    <div>
                      <span {...column.getSortByToggleProps()}>
                        {column.render('Header')}
                        {/* eslint-disable-next-line no-nested-ternary */}
                        {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                      </span>
                    </div>
                    {/* Render the columns filter UI */}
                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {page.map((row: any, i: number) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={i.toString()}>
                  {row.cells.map((cell: any, cellIndex: number) => {
                    const cellData = getCellData(
                      cell.column.id,
                      cell.row.original[cell.column.id],
                      conditions,
                    );
                    return (
                      <td
                        key={cellIndex.toString()}
                        {...cell.getCellProps()}
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
                {Object.keys(total).map((cellKey: string, index) => {
                  const cellData = getCellData(cellKey, total[cellKey], conditions);
                  return (
                    <td
                      key={index.toString()}
                      style={{ ...cellData.style, borderTop: '2px solid black' }}
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
      </div>
      <div>
        <div>
          <div className="pagination flex-paginate">
            <div>
              <button
                type="button"
                className="btn"
                disabled={!canPreviousPage}
                onClick={() => gotoPage(0)}
              >
                {'<<'}
              </button>{' '}
              <button
                type="button"
                className="btn"
                disabled={!canPreviousPage}
                onClick={() => previousPage()}
              >
                {'<'}
              </button>{' '}
            </div>
            <div>
              <span>
                Page{' '}
                <strong>
                  <input
                    type="number"
                    defaultValue={pageIndex + 1}
                    style={{ width: '100px' }}
                    onChange={e => {
                      const p = e.target.value ? Number(e.target.value) - 1 : 0;
                      gotoPage(p);
                    }}
                  />{' '}
                  of {pageOptions.length}
                </strong>{' '}
              </span>{' '}
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                }}
              >
                {[10, 20, 30, 40, 50].map(ps => (
                  <option key={ps} value={ps}>
                    Show {ps}
                  </option>
                ))}
              </select>{' '}
            </div>
            <div>
              <button
                type="button"
                className="btn"
                disabled={!canNextPage}
                onClick={() => nextPage()}
              >
                {'>'}
              </button>{' '}
              <button
                type="button"
                className="btn"
                disabled={!canNextPage}
                onClick={() => gotoPage(pageCount - 1)}
              >
                {'>>'}
              </button>{' '}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
