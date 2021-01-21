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
import React, {
  useCallback,
  useRef,
  ReactNode,
  HTMLProps,
  MutableRefObject,
  Suspense,
  lazy,
} from 'react';
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  PluginHook,
  TableOptions,
  FilterType,
  IdType,
  Row,
} from 'react-table';
import matchSorter from 'match-sorter';
import GlobalFilter, { GlobalFilterProps } from './components/GlobalFilter';
import SelectPageSize, { SelectPageSizeProps, SizeOption } from './components/SelectPageSize';
import SimplePagination from './components/Pagination';
import useSticky from './hooks/useSticky';
import { ConditionProps } from '../types';
import getCellData from '../utils/condition';

export interface DataTableProps<D extends object> extends TableOptions<D> {
  tableClassName?: string;
  searchInput?: boolean | GlobalFilterProps<D>['searchInput'];
  selectPageSize?: boolean | SelectPageSizeProps['selectRenderer'];
  pageSizeOptions?: SizeOption[]; // available page size options
  maxPageItemCount?: number;
  hooks?: PluginHook<D>[]; // any additional hooks
  width?: string | number;
  height?: string | number;
  pageSize?: number;
  noResults?: string | ((filterString: string) => ReactNode);
  sticky?: boolean;
  wrapperRef?: MutableRefObject<HTMLDivElement>;
  conditions: Array<ConditionProps>;
}

let HH = null;
const HeaderTop = ({ parsedGroups }) => {
  window.localStorage.setItem('parsedGroups', JSON.stringify(parsedGroups));
  // const [debounce, setDebounce] = React.useState(null);
  return (
    <Suspense fallback={<div>...</div>}>
      <HH parsedGroups={parsedGroups} />
    </Suspense>
  );
};

export interface RenderHTMLCellProps extends HTMLProps<HTMLTableCellElement> {
  cellContent: ReactNode;
}

// Be sure to pass our updateMyData and the skipReset option
export default function DataTable<D extends object>({
  conditions,
  groups,
  showMainHeader,
  tableClassName,
  columns,
  data,
  width: initialWidth = '100%',
  height: initialHeight = 300,
  pageSize: initialPageSize = 0,
  initialState: initialState_ = {},
  pageSizeOptions = [10, 25, 50, 100, 200],
  maxPageItemCount = 9,
  sticky: doSticky,
  searchInput = true,
  selectPageSize,
  noResults = 'No data found',
  hooks,
  wrapperRef: userWrapperRef,
  ...moreUseTableOptions
}: DataTableProps<D>) {
  const tableHooks: PluginHook<D>[] = [
    useGlobalFilter,
    useSortBy,
    usePagination,
    doSticky ? useSticky : [],
    hooks || [],
  ].flat();
  const sortByRef = useRef([]); // cache initial `sortby` so sorting doesn't trigger page reset
  const pageSizeRef = useRef([initialPageSize, data.length]);
  const hasPagination = initialPageSize > 0 && data.length > 0; // pageSize == 0 means no pagination
  const hasGlobalControl = hasPagination || !!searchInput;
  const initialState = {
    ...initialState_,
    // zero length means all pages, the `usePagination` plugin does not
    // understand pageSize = 0
    sortBy: sortByRef.current,
    pageSize: initialPageSize > 0 ? initialPageSize : data.length || 10,
  };

  const defaultWrapperRef = useRef<HTMLDivElement>(null);
  const globalControlRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const wrapperRef = userWrapperRef || defaultWrapperRef;

  const defaultGetTableSize = useCallback(() => {
    if (wrapperRef.current) {
      // `initialWidth` and `initialHeight` could be also parameters like `100%`
      // `Number` reaturns `NaN` on them, then we fallback to computed size
      const width = Number(initialWidth) || wrapperRef.current.clientWidth;
      const height =
        (Number(initialHeight) || wrapperRef.current.clientHeight) -
        (globalControlRef.current?.clientHeight || 0) -
        (paginationRef.current?.clientHeight || 0);
      return { width, height };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHeight, initialWidth, wrapperRef, hasPagination, hasGlobalControl]);

  const defaultGlobalFilter: FilterType<D> = useCallback(
    (rows: Row<D>[], columnIds: IdType<D>[], filterValue: string) => {
      // allow searching by "col1 col2"
      const joinedString = (row: Row<D>) => {
        return columnIds.map(x => row.values[x]).join(' ');
      };
      return matchSorter(rows, filterValue, {
        keys: [...columnIds, joinedString],
        threshold: matchSorter.rankings.ACRONYM,
      }) as typeof rows;
    },
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    headerGroups,
    page,
    pageCount,
    gotoPage,
    preGlobalFilteredRows,
    setGlobalFilter,
    setPageSize: setPageSize_,
    wrapStickyTable,
    state: { pageIndex, pageSize, globalFilter: filterValue, sticky = {} },
  } = useTable<D>(
    {
      columns,
      data,
      initialState,
      getTableSize: defaultGetTableSize,
      globalFilter: defaultGlobalFilter,
      ...moreUseTableOptions,
    },
    ...tableHooks,
  );
  // make setPageSize accept 0
  const setPageSize = (size: number) => {
    // keep the original size if data is empty
    if (size || data.length !== 0) {
      setPageSize_(size === 0 ? data.length : size);
    }
  };

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
  let i: Array<string> = [];
  const [images, setImages] = React.useState(i);
  const [remarks, setRemarks] = React.useState(i);
  let [imageIndex, setImageIndex] = React.useState(0);

  const onImageClick = (imageString: string, index: number, cellData) => {
    setImageIndex(index);
    setImages(imageString.split(','));
    setRemarks(cellData);
  };

  const onImageChange = (action: string) => {
    if (images.length <= 1) {
      return;
    }
    if (action === 'PREVIOUS') {
      if (imageIndex === 0) {
        imageIndex = images.length - 1;
      } else {
        imageIndex++;
      }
    } else {
      if (imageIndex === images.length - 1) {
        imageIndex = 0;
      } else {
        imageIndex++;
      }
    }
    setImageIndex(imageIndex);
  };

  const goToImage = (index: number) => {
    setImageIndex(index);
  };

  const renderImageThumbnail = (imageString: string, imageParams: object, cellData: object) => {
    if (!imageString) {
      return '';
    }
    return imageString.split(',').map((image: string, index: number) => {
      return (
        <img
          key={index.toString()}
          height={imageParams.height}
          width={imageParams.width}
          src={image}
          data-toggle="modal"
          data-target="#exampleModal"
          onClick={() => onImageClick(imageString, index, cellData)}
          className="ct-img-thumbnail"
        />
      );
    });
  };

  const renderTable = () => {
    // @ts-ignore
    const parsedGroups: any[] = [];

    if (groups) {
      groups.forEach((group: any) => {
        if (group.children) {
          const g = { ...group, span: 0, initialValue: 0, column: group.column };
          group.children.forEach((child: any) => {
            if (child.childKey) {
              g.span++;
            }
          });
          parsedGroups.push(g);
        }
      });
    }
    HH = null;
    HH = lazy(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(import('./header-top.js')), 300);
      });
    });
    let x = HeaderTop({ parsedGroups });
    // let x = showMainHeader ? HeaderTop({ parsedGroups }) : HeaderTop({ parsedGroups: [] });
    // setTimeout(()=>{
    //   x = <tr>
    //     <th style={{ textAlign: 'center' }} colSpan="2">Hello</th>
    //     <th style={{ textAlign: 'center' }}>Hello2</th>
    //   </tr>
    // }, 100);
    return (
      <table {...getTableProps({ className: tableClassName })}>
        <thead className={'header-conditional-table'}>
          {x}
          {headerGroups.map(headerGroup => {
            const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              // @ts-ignore
              <tr key={headerGroupKey || headerGroup.id} {...headerGroupProps}>
                {headerGroup.headers.map(column => {
                  return column.render('Header', {
                    key: column.id,
                    ...column.getSortByToggleProps(),
                  });
                })}
              </tr>
            );
          })}
        </thead>
        {
          // @ts-ignore
          <tbody {...getTableBodyProps()}>
            {page && page.length > 0 ? (
              page.map(row => {
                prepareRow(row);
                const { key: rowKey, ...rowProps } = row.getRowProps();
                return (
                  // @ts-ignore
                  <tr key={rowKey || row.id} {...rowProps}>
                    {row.cells.map((cell: any, index: number) => {
                      const cellData = getCellData(
                        Object.keys(cell.row.original)[cell.column.id],
                        cell.value,
                        conditions,
                      );
                      return (
                        <td
                          key={index.toString()}
                          {...cell.getCellProps()}
                          style={{ ...cellData.style }}
                          className={cellData.class}
                        >
                          {cellData.isImage
                            ? renderImageThumbnail(
                                cellData.value,
                                cellData.imageParams,
                                cell.row.original,
                              )
                            : cellData.value}
                        </td>
                      );
                      // return (cell.render('Cell', { key: cell.column.id }));
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="dt-no-results" colSpan={columns.length}>
                  {typeof noResults === 'function' ? noResults(filterValue as string) : noResults}
                </td>
              </tr>
            )}
            {showTotal ? (
              <tr>
                {Object.keys(total).map((cellKey: string, index) => {
                  // @ts-ignore
                  const cellData = getCellData(cellKey, total[cellKey], conditions, true);

                  return (
                    <td
                      key={index.toString()}
                      style={{
                        borderTop: '2px solid black',
                        fontWeight: 'bolder',
                      }}
                      className={cellData.class}
                    >
                      {cellData.value}
                    </td>
                  );
                })}
              </tr>
            ) : null}
          </tbody>
        }
      </table>
    );
  };

  // force upate the pageSize when it's been update from the initial state
  if (
    pageSizeRef.current[0] !== initialPageSize ||
    // when initialPageSize stays as zero, but total number of records changed,
    // we'd also need to update page size
    (initialPageSize === 0 && pageSizeRef.current[1] !== data.length)
  ) {
    pageSizeRef.current = [initialPageSize, data.length];
    setPageSize(initialPageSize);
  }

  return (
    <div ref={wrapperRef} style={{ width: initialWidth, height: initialHeight }}>
      {hasGlobalControl ? (
        <div ref={globalControlRef} className="form-inline dt-controls">
          <div className="row" style={{ margin: 0 }}>
            <div className="col-sm-6">
              {hasPagination ? (
                <SelectPageSize
                  total={data.length}
                  current={pageSize}
                  options={pageSizeOptions}
                  selectRenderer={typeof selectPageSize === 'boolean' ? undefined : selectPageSize}
                  onChange={setPageSize}
                />
              ) : null}
            </div>
            {searchInput ? (
              <div className="col-sm-6 text-right">
                <GlobalFilter<D>
                  searchInput={typeof searchInput === 'boolean' ? undefined : searchInput}
                  preGlobalFilteredRows={preGlobalFilteredRows}
                  setGlobalFilter={setGlobalFilter}
                  filterValue={filterValue}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {wrapStickyTable ? wrapStickyTable(renderTable) : renderTable()}
      {hasPagination ? (
        <SimplePagination
          ref={paginationRef}
          style={sticky.height ? undefined : { visibility: 'hidden' }}
          maxPageItemCount={maxPageItemCount}
          pageCount={pageCount}
          currentPage={pageIndex}
          onPageChange={gotoPage}
        />
      ) : null}
      <div
        className="modal fade"
        id="exampleModal"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel"></h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div id="carouselExampleIndicators" className="carousel slide" data-ride="carousel">
                <ol className="carousel-indicators">
                  {images.map((image: string, i: number) => {
                    let className = '';
                    if (i === imageIndex) {
                      className = 'active';
                    }
                    return (
                      <li
                        data-target="#carouselExampleIndicators"
                        key={i.toString()}
                        data-slide-to={i}
                        className={className}
                        onClick={() => goToImage(i)}
                      ></li>
                    );
                  })}
                </ol>
                <div className="carousel-inner">
                  {images.map((image: string, i: number) => {
                    let className = 'carousel-item';
                    if (i === imageIndex) {
                      className += ' active';
                    }
                    return (
                      <div className={className} key={i.toString()}>
                        <img
                          className="d-block w-100 ct-img"
                          src={image}
                          alt={image.substring(image.lastIndexOf('/'))}
                        />
                      </div>
                    );
                  })}
                </div>
                <a
                  className="carousel-control-prev"
                  href="#carouselExampleIndicators"
                  role="button"
                  data-slide="prev"
                  onClick={() => onImageChange('NEXT')}
                >
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="sr-only">Previous</span>
                </a>
                <a
                  className="carousel-control-next"
                  href="#carouselExampleIndicators"
                  role="button"
                  data-slide="next"
                  onClick={() => onImageChange('PREVIOUS')}
                >
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="sr-only">Next</span>
                </a>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
