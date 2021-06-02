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
import React, { createRef, useEffect, useMemo, useCallback, useState } from 'react';
import { t, tn, DataRecordValue, DataRecord } from '@superset-ui/core';
import { DefaultSortTypes, ColumnInstance, ColumnWithLooseAccessor } from 'react-table';
import { FaSort, FaSortUp as FaSortAsc, FaSortDown as FaSortDesc } from 'react-icons/fa';
import { extent as d3Extent, max as d3Max } from 'd3-array';
import { TableChartTransformedProps, DataType, DataColumnMeta } from './types';
import formatValue from './utils/formatValue';
import DataTable, {
  DataTableProps,
  SearchInputProps,
  SelectPageSizeRendererProps,
  SizeOption,
} from './DataTable';
import { PAGE_SIZE_OPTIONS } from './plugin/controlPanel';
import Styles from './Styles';

type ValueRange = [number, number];

/**
 * Return sortType based on data type
 */
function getSortTypeByDataType(dataType: DataType): DefaultSortTypes {
  if (dataType === DataType.DateTime) {
    return 'datetime';
  }
  if (dataType === DataType.String) {
    return 'alphanumeric';
  }
  return 'basic';
}

/**
 * Cell background to render columns as horizontal bar chart
 */
function cellBar({
  value,
  valueRange,
  colorPositiveNegative = false,
  alignPositiveNegative,
}: {
  value: number;
  valueRange: ValueRange;
  colorPositiveNegative: boolean;
  alignPositiveNegative: boolean;
}) {
  const [minValue, maxValue] = valueRange;
  const r = colorPositiveNegative && value < 0 ? 150 : 0;
  if (alignPositiveNegative) {
    const perc = Math.abs(Math.round((value / maxValue) * 100));
    // The 0.01 to 0.001 is a workaround for what appears to be a
    // CSS rendering bug on flat, transparent colors
    return (
      `linear-gradient(to right, rgba(${r},0,0,0.2), rgba(${r},0,0,0.2) ${perc}%, ` +
      `rgba(0,0,0,0.01) ${perc}%, rgba(0,0,0,0.001) 100%)`
    );
  }
  const posExtent = Math.abs(Math.max(maxValue, 0));
  const negExtent = Math.abs(Math.min(minValue, 0));
  const tot = posExtent + negExtent;
  const perc1 = Math.round((Math.min(negExtent + value, negExtent) / tot) * 100);
  const perc2 = Math.round((Math.abs(value) / tot) * 100);
  // The 0.01 to 0.001 is a workaround for what appears to be a
  // CSS rendering bug on flat, transparent colors
  return (
    `linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.001) ${perc1}%, ` +
    `rgba(${r},0,0,0.2) ${perc1}%, rgba(${r},0,0,0.2) ${perc1 + perc2}%, ` +
    `rgba(0,0,0,0.01) ${perc1 + perc2}%, rgba(0,0,0,0.001) 100%)`
  );
}

function SortIcon<D extends object>({ column }: { column: ColumnInstance<D> }) {
  const { isSorted, isSortedDesc } = column;
  let sortIcon = <FaSort />;
  if (isSorted) {
    sortIcon = isSortedDesc ? <FaSortDesc /> : <FaSortAsc />;
  }
  return sortIcon;
}

function SearchInput({ count, value, onChange }: SearchInputProps) {
  return (
    <span className="dt-global-filter">
      {t('Search')}{' '}
      <input
        className="form-control input-sm"
        placeholder={tn('search.num_records', count)}
        value={value}
        onChange={onChange}
      />
    </span>
  );
}

function SelectPageSize({ options, current, onChange }: SelectPageSizeRendererProps) {
  return (
    <span className="dt-select-page-size form-inline">
      {t('page_size.show')}{' '}
      <select
        className="form-control input-sm"
        value={current}
        onBlur={() => {}}
        onChange={e => {
          onChange(Number((e.target as HTMLSelectElement).value));
        }}
      >
        {options.map(option => {
          const [size, text] = Array.isArray(option) ? option : [option, option];
          return (
            <option key={size} value={size}>
              {text}
            </option>
          );
        })}
      </select>{' '}
      {t('page_size.entries')}
    </span>
  );
}

// function generateExcel(data: any) {
//   const requestOptions = {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   };
//   // 'https://adapt.agriodisha.nic.in/api'
//   fetch('http://68.183.81.222:8000/api/superset-excel', requestOptions)
//     .then(response => response.json())
//     .then(data => {
//       if (data && data.data && data.data.data && data.data.data.url) {
//         const newWin = window.open(data.data.data.url, '_blank');
//         if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
//           alert('Please Allow Pop Up');
//         }
//       }
//     });
// }

export default function ConditionalTable<D extends DataRecord = DataRecord>(
  props: TableChartTransformedProps<D> & {
    sticky?: DataTableProps<D>['sticky'];
  },
) {
  const {
    height,
    width,
    groups,
    data,
    conditions,
    columns: columnsMeta,
    alignPositiveNegative = false,
    colorPositiveNegative = false,
    includeSearch = false,
    pageSize = 0,
    // showCellBars = false,
    emitFilter = false,
    sortDesc = false,
    onChangeFilter,
    filters: initialFilters,
    sticky = true, // whether to use sticky header
  } = props;

  let showCellBars = false;

  const rootElem = createRef<HTMLDivElement>();

  useEffect(() => {
    // const root = rootElem.current as HTMLElement;
    // console.log('Plugin element', root);
  });

  // console.log('Plugin props', props);

  const pageSizeOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.filter(([n, _]) => n <= 2 * data.length) as SizeOption[],
    [data.length],
  );

  const [filters, setFilters] = useState(initialFilters);

  const getValueRange = useCallback(
    function getValueRange(key: string) {
      if (typeof data?.[0]?.[key] === 'number') {
        const nums = data.map(row => row[key]) as number[];
        return (alignPositiveNegative
          ? [0, d3Max(nums.map(Math.abs))]
          : d3Extent(nums)) as ValueRange;
      }
      return null;
    },
    [alignPositiveNegative, data],
  );

  const isActiveFilterValue = useCallback(
    function isActiveFilterValue(key: string, val: DataRecordValue) {
      return !!filters && filters[key]?.includes(val);
    },
    [filters],
  );

  const toggleFilter = useCallback(
    function toggleFilter(key: string, val: DataRecordValue) {
      const updatedFilters = { ...(filters || {}) };
      if (filters && isActiveFilterValue(key, val)) {
        updatedFilters[key] = filters[key].filter((x: DataRecordValue) => x !== val);
      } else {
        updatedFilters[key] = [...(filters?.[key] || []), val];
      }
      setFilters(updatedFilters);
      if (onChangeFilter) {
        onChangeFilter(updatedFilters);
      }
    },
    [filters, isActiveFilterValue, onChangeFilter],
  );

  const getColumnConfigs = useCallback(
    (column: DataColumnMeta, i: number): ColumnWithLooseAccessor<D> => {
      const { key, label, dataType } = column;
      let className = '';
      if (dataType === DataType.Number) {
        className += ' dt-metric';
      } else if (emitFilter) {
        className += ' dt-is-filter';
      }
      let disableSortBy = false;
      if (conditions) {
        for (const condition of conditions) {
          if (condition.column === key) {
            // headerObj.disableFilters = condition.disableFilters;
            disableSortBy = condition.disableSortBy;
            if (condition.alignment) {
              className += ` text-${condition.alignment}`;
            }
            break;
          }
        }
      }
      if (i === 0 && props.freezeFirstRow) {
        className += ` stick-left`;
      }
      const valueRange = showCellBars && getValueRange(key);
      return {
        id: String(i), // to allow duplicate column keys
        // must use custom accessor to allow `.` in column names
        // typing is incorrect in current version of `@types/react-table`
        // so we ask TS not to check.
        accessor: ((datum: D) => datum[key]) as never,
        Cell: ({ column: col, value }: { column: ColumnInstance<D>; value: DataRecordValue }) => {
          const [isHtml, text] = formatValue(column, value);
          const style = {
            background: valueRange
              ? cellBar({
                  value: value as number,
                  valueRange,
                  alignPositiveNegative,
                  colorPositiveNegative,
                })
              : undefined,
          };
          const html = isHtml ? { __html: text } : undefined;
          const cellProps = {
            // show raw number in title in case of numeric values
            title: typeof value === 'number' ? String(value) : undefined,
            onClick: emitFilter && !valueRange ? () => toggleFilter(key, value) : undefined,
            className: `${className}${
              isActiveFilterValue(key, value) ? ' dt-is-active-filter' : ''
            }`,
            style,
          };
          if (html) {
            // eslint-disable-next-line react/no-danger
            return <td {...cellProps} dangerouslySetInnerHTML={html} />;
          }
          // If cellProps renderes textContent already, then we don't have to
          // render `Cell`. This saves some time for large tables.
          return <td {...cellProps}>{text}</td>;
        },
        Header: ({ column: col, title, onClick, style }) => {
          return (
            <th
              title={title}
              className={col.isSorted ? `${className || ''} is-sorted` : className}
              style={style}
              onClick={onClick}
            >
              {label}
              {disableSortBy ? '' : <SortIcon column={col} />}
            </th>
          );
        },
        disableSortBy,
        sortDescFirst: sortDesc,
        sortType: getSortTypeByDataType(dataType),
      };
    },
    [
      alignPositiveNegative,
      colorPositiveNegative,
      emitFilter,
      getValueRange,
      isActiveFilterValue,
      showCellBars,
      sortDesc,
      toggleFilter,
    ],
  );

  const columns = useMemo(() => {
    return columnsMeta.map(getColumnConfigs);
  }, [columnsMeta, getColumnConfigs]);

  let parents: any = [];
  let columnGroups: any = [];
  let columnKeys: any = [];
  let groupColumnMap: any = {};
  let columnGroupMap: any = {};
  let columnIndexMap: any = {};

  if (groups && groups.length) {
    // getting all the column names
    columnsMeta.forEach(column => {
      columnKeys.push(column.key);
    });
    //
    groups.forEach(group => {
      if (group.children) {
        group.children.forEach((child: any) => {
          if (child.childKey && columnKeys.indexOf(child.childKey) !== -1) {
            columnGroupMap[child.childKey] = group.column;
            if (groupColumnMap.hasOwnProperty(group.column)) {
              groupColumnMap[group.column].push(child.childKey);
            } else {
              groupColumnMap[group.column] = [child.childKey];
            }
          }
        });
      }
    });

    if (Object.keys(groupColumnMap).length) {
      columnsMeta.forEach((columnMeta, index) => {
        let thClassName = '';
        if (parents.length === 0 && props.freezeFirstRow) {
          thClassName = 'stick-left';
        }
        if (columnGroupMap.hasOwnProperty(columnMeta.key)) {
          if (columnIndexMap.hasOwnProperty(columnGroupMap[columnMeta.key])) {
            parents[columnIndexMap[columnGroupMap[columnMeta.key]]].columns.push(columns[index]);
            columnGroups[columnIndexMap[columnGroupMap[columnMeta.key]]].children.push(
              columnMeta.key,
            );
          } else {
            columnIndexMap[columnGroupMap[columnMeta.key]] = parents.length;
            columnGroups.push({
              name: columnGroupMap[columnMeta.key],
              children: [columnMeta.key],
            });
            parents.push({
              id: String(index) + columnMeta.key,
              Header: () => {
                return (
                  <th
                    className={thClassName}
                    colSpan={groupColumnMap[columnGroupMap[columnMeta.key]].length}
                  >
                    {columnGroupMap[columnMeta.key]}
                  </th>
                );
              },
              columns: [columns[index]],
            });
          }
        } else {
          columnGroups.push({
            name: columnMeta.key,
            children: [columnMeta.key],
          });
          parents.push({
            id: String(index) + columnMeta.key,
            Header: () => {
              return <th className={thClassName}>{columnMeta.key}</th>;
            },
            columns: [columns[index]],
          });
        }
      });
    }
  }

  // console.log('--->', columnsMeta);
  // console.log('--->', groupColumnMap);
  // console.log('--->', columnGroupMap);
  // console.log('--->', columnIndexMap);
  // console.log('---> xx', parents);
  // console.log('xxxx', columnGroups);

  return (
    <Styles
      ref={rootElem}
      boldText={props.boldText}
      headerFontSize={props.headerFontSize}
      height={height}
      width={width}
      hasMultipleHeader={parents.length}
    >
      <div className="row">
        <div className="col-md-6">
          <h3>{props.headerText}</h3>
        </div>
        {/* {props.includeExcel ? (
          <div className="col-md-6">
            <i className="fa fa-file-excel-o float-right" aria-hidden="true" onClick={() => generateExcel({ columns: columnsMeta, conditions, data, groups: columnGroups })} />
          </div>
        ) : null} */}
      </div>
      <DataTableWrapper<D>
        // @ts-ignore
        conditions={conditions}
        freezeFirstRow={props.freezeFirstRow}
        columns={parents.length > 0 ? parents : columns}
        data={data}
        tableClassName="table table-striped table-condensed"
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        width={width}
        height={height - (props.includeExcel ? 10 : 0)}
        maxPageItemCount={width > 340 ? 9 : 7}
        noResults={(filter: string) => t(filter ? 'No matching records found' : 'No records found')}
        searchInput={includeSearch && SearchInput}
        selectPageSize={pageSize !== null && SelectPageSize}
        sticky={sticky}
      />
    </Styles>
  );
}

class DataTableWrapper<D extends DataRecord = DataRecord> extends React.Component {
  timeout = null;

  constructor(
    props: TableChartTransformedProps<D> & {
      sticky?: DataTableProps<D>['sticky'];
    },
  ) {
    super(props);
    this.state = {
      showTable: true,
    };
  }

  componentWillReceiveProps(nextProps: any, nextContext: any): void {
    this.setState({ showTable: false });
    if (this.timeout) {
      // @ts-ignore
      clearTimeout(this.timeout);
    }
    // @ts-ignore
    this.timeout = setTimeout(() => {
      this.setState({ showTable: true });
      this.timeout = null;
    }, 300);
  }

  render() {
    // @ts-ignore
    const { showTable } = this.state;
    // @ts-ignore
    return <DataTable<D> showMainHeader={showTable} {...this.props} />;
  }
}
