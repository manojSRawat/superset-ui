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
import React, { CSSProperties, createRef, useEffect, useMemo, useCallback, useState } from 'react';
import { t, tn, DataRecordValue, DataRecord, GenericDataType } from '@superset-ui/core';
import { DefaultSortTypes, ColumnInstance, ColumnWithLooseAccessor } from 'react-table';
import { FaSort, FaSortUp as FaSortAsc, FaSortDown as FaSortDesc } from 'react-icons/fa';
import { extent as d3Extent, max as d3Max } from 'd3-array';
import { TableChartTransformedProps, DataColumnMeta } from './types';
import { formatColumnValue } from './utils/formatValue';
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
function getSortTypeByDataType(dataType: GenericDataType): DefaultSortTypes {
  if (dataType === GenericDataType.TEMPORAL) {
    return 'datetime';
  }
  if (dataType === GenericDataType.STRING) {
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

function generateExcel(data: any) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };

  fetch('https://adapt.agriodisha.nic.in/api/api/superset-excel', requestOptions)
    .then(response => response.json())
    .then(data => {
      if (data && data.data && data.data.data && data.data.data.url) {
        const newWin = window.open(data.data.data.url, '_blank');
        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
          alert('Please Allow Pop Up');
        }
      }
    });
}

export default function ConditionalTable<D extends DataRecord = DataRecord>(
  props: TableChartTransformedProps<D> & {
    sticky?: DataTableProps<D>['sticky'];
  },
) {
  const {
    height,
    width,
    data,
    totals,
    isRawRecords,
    // rowCount = 0,
    columns: columnsMeta,
    alignPositiveNegative: defaultAlignPN = false,
    colorPositiveNegative: defaultColorPN = false,
    includeSearch = false,
    pageSize = 0,
    // serverPagination = false,
    // serverPaginationData,
    // setDataMask,
    // showCellBars = true,
    emitFilter = false,
    sortDesc = false,
    filters: initialFilters = {},
    sticky = true, // whether to use sticky header
    groups,
    conditions,
    // matrixOrderBy,
    // matrixOrderByOrder,
    onChangeFilter,
  } = props;

  let showCellBars = false;

  const rootElem = createRef<HTMLDivElement>();

  useEffect(() => {
    // const root = rootElem.current as HTMLElement;
    // console.log('Plugin element', root);
  });

  console.log('Plugin props', props);
  const getSharedStyle = (column: DataColumnMeta): CSSProperties => {
    const { isNumeric, config = {} } = column;
    const textAlign = config.horizontalAlign
      ? config.horizontalAlign
      : isNumeric
      ? 'right'
      : 'left';
    return {
      textAlign,
    };
  };

  const pageSizeOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.filter(([n, _]) => n <= 2 * data.length) as SizeOption[],
    [data.length],
  );

  const [filters, setFilters] = useState(initialFilters);

  const getValueRange = useCallback(
    function getValueRange(key: string, alignPositiveNegative: boolean) {
      if (typeof data?.[0]?.[key] === 'number') {
        const nums = data.map(row => row[key]) as number[];
        return (alignPositiveNegative
          ? [0, d3Max(nums.map(Math.abs))]
          : d3Extent(nums)) as ValueRange;
      }
      return null;
    },
    [data],
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
  const hiddenColumnKeys: any = [];

  const getColumnConfigs = useCallback(
    (column: DataColumnMeta, i: number): ColumnWithLooseAccessor<D> => {
      const { key, label, isNumeric, dataType, isMetric, config = {} } = column;
      const isFilter = !isNumeric && emitFilter;
      const columnWidth = Number.isNaN(Number(config.columnWidth))
        ? config.columnWidth
        : Number(config.columnWidth);

      // inline style for both th and td cell
      const sharedStyle: CSSProperties = getSharedStyle(column);

      const alignPositiveNegative =
        config.alignPositiveNegative === undefined ? defaultAlignPN : config.alignPositiveNegative;
      const colorPositiveNegative =
        config.colorPositiveNegative === undefined ? defaultColorPN : config.colorPositiveNegative;

      let className = '';
      if (isFilter) {
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
            if (condition.conditionalColumn) {
              hiddenColumnKeys.push(condition.conditionalColumn);
            }
            break;
          }
        }
      }

      if (i === 0 && props.freezeFirstColumn) {
        className += ` stick-left`;
      }

      const valueRange =
        (config.showCellBars === undefined ? showCellBars : config.showCellBars) &&
        (isMetric || isRawRecords) &&
        getValueRange(key, alignPositiveNegative);

      return {
        id: String(i), // to allow duplicate column keys
        // must use custom accessor to allow `.` in column names
        // typing is incorrect in current version of `@types/react-table`
        // so we ask TS not to check.
        accessor: ((datum: D) => datum[key]) as never,
        Cell: ({ value }: { value: DataRecordValue }) => {
          const [isHtml, text] = formatColumnValue(column, value);
          const html = isHtml ? { __html: text } : undefined;
          const cellProps = {
            // show raw number in title in case of numeric values
            title: typeof value === 'number' ? String(value) : undefined,
            onClick: emitFilter && !valueRange ? () => toggleFilter(key, value) : undefined,
            className: [
              className,
              value == null ? 'dt-is-null' : '',
              isActiveFilterValue(key, value) ? ' dt-is-active-filter' : '',
            ].join(' '),
            style: {
              ...sharedStyle,
              background: valueRange
                ? cellBar({
                    value: value as number,
                    valueRange,
                    alignPositiveNegative,
                    colorPositiveNegative,
                  })
                : undefined,
            },
          };
          if (html) {
            // eslint-disable-next-line react/no-danger
            return <td {...cellProps} dangerouslySetInnerHTML={html} />;
          }
          // If cellProps renderes textContent already, then we don't have to
          // render `Cell`. This saves some time for large tables.
          return <td {...cellProps}>{text}</td>;
        },
        Header: ({ column: col, onClick, style }) => (
          <th
            title="Shift + Click to sort by multiple columns"
            className={[className, col.isSorted ? 'is-sorted' : ''].join(' ')}
            style={{
              ...sharedStyle,
              ...style,
            }}
            onClick={onClick}
          >
            {/* can't use `columnWidth &&` because it may also be zero */}
            {config.columnWidth ? (
              // column width hint
              <div
                style={{
                  width: columnWidth,
                  height: 0.01,
                }}
              />
            ) : null}
            {label}
            <SortIcon column={col} />
          </th>
        ),
        Footer: totals ? (
          i === 0 ? (
            <th>{t('Totals')}</th>
          ) : (
            <td style={sharedStyle}>
              <strong>{formatColumnValue(column, totals[key])[1]}</strong>
            </td>
          )
        ) : undefined,
        sortDescFirst: sortDesc,
        disableSortBy,
        sortType: getSortTypeByDataType(dataType),
      };
    },
    [
      defaultAlignPN,
      defaultColorPN,
      emitFilter,
      getValueRange,
      isActiveFilterValue,
      isRawRecords,
      showCellBars,
      sortDesc,
      toggleFilter,
      totals,
      hiddenColumnKeys
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
  const hiddenColumns: Array<string> = [];
  // let matrixOrderByKey: any = null;

  // getting all the column names
  columnsMeta.forEach(column => {
    columnKeys.push(column.key);
    /*if (matrixOrderBy === column.key) {
      matrixOrderByKey = column.key;
    }*/
  });
  hiddenColumnKeys.forEach((hiddenColumnKey: any) => {
    const index = columnKeys.indexOf(hiddenColumnKey);
    if (index !== -1) {
      hiddenColumns.push(index.toString());
    }
  });
  if (groups && groups.length) {
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
        if (parents.length === 0 && props.freezeFirstColumn) {
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

  return (
    <Styles
      ref={rootElem}
      boldText={props.boldText}
      height={height}
      width={width}
      hasMultipleHeader={parents.length}
    >
      <div className="row">
        <div className="col-md-6">
          <h3>{props.headerText}</h3>
        </div>
        {props.includeExcel ? (
          <div className="col-md-6">
            <i
              className="fa fa-file-excel-o float-right excel-icon"
              aria-hidden="true"
              onClick={() =>
                generateExcel({ columns: columnsMeta, conditions, data, groups: columnGroups })
              }
            />
          </div>
        ) : null}
      </div>
      <DataTable<D>
        columns={parents.length > 0 ? parents : columns}
        data={data}
        // rowCount={rowCount}
        tableClassName="table table-striped table-condensed"
        pageSize={pageSize}
        // serverPaginationData={serverPaginationData}
        pageSizeOptions={pageSizeOptions}
        width={width}
        height={height - (props.includeExcel ? 10 : 0)}
        // serverPagination={serverPagination}
        // onServerPaginationChange={handleServerPaginationChange}
        // 9 page items in > 340px works well even for 100+ pages
        maxPageItemCount={width > 340 ? 9 : 7}
        noResults={(filter: string) => t(filter ? 'No matching records found' : 'No records found')}
        searchInput={includeSearch && SearchInput}
        selectPageSize={pageSize !== null && SelectPageSize}
        // not in use in Superset, but needed for unit tests
        sticky={sticky}
        // @ts-ignore
        conditions={conditions}
        hiddenColumns={hiddenColumns}
        freezeFirstRow={props.freezeFirstColumn || false}
      />
    </Styles>
  );
}
