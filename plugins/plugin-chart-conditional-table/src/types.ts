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
import {
  NumberFormatter,
  TimeFormatter,
  TimeGranularity,
  QueryFormMetric,
  ChartProps,
  DataRecord,
  DataRecordValue,
  DataRecordFilters,
  GenericDataType,
  QueryMode,
  ChartDataResponseResult,
  QueryFormData,
  // @ts-ignore
  SetDataMaskHook,
} from '@superset-ui/core';
// @ts-ignore
import { ColumnConfig } from '@superset-ui/chart-controls';

export type CustomFormatter = (value: DataRecordValue) => string;

export interface DataColumnMeta {
  // `key` is what is called `label` in the input props
  key: string;
  // `label` is verbose column name used for rendering
  label: string;
  dataType: GenericDataType;
  formatter?: TimeFormatter | NumberFormatter | CustomFormatter;
  isMetric?: boolean;
  isPercentMetric?: boolean;
  isNumeric?: boolean;
  config?: ColumnConfig;
}

export type TableChartFormData = QueryFormData & {
  align_pn?: boolean;
  color_pn?: boolean;
  include_time?: boolean;
  include_search?: boolean;
  query_mode?: QueryMode;
  page_length?: string | number | null; // null means auto-paginate
  metrics?: QueryFormMetric[] | null;
  percent_metrics?: QueryFormMetric[] | null;
  timeseries_limit_metric?: QueryFormMetric[] | QueryFormMetric | null;
  groupby?: QueryFormMetric[] | null;
  all_columns?: QueryFormMetric[] | null;
  order_desc?: boolean;
  show_cell_bars?: boolean;
  table_timestamp_format?: string;
  table_filter?: boolean;
  time_grain_sqla?: TimeGranularity;
  column_config?: Record<string, ColumnConfig>;
};

export interface TableChartProps extends ChartProps {
  ownCurrentState: {
    pageSize?: number;
    currentPage?: number;
  };
  rawFormData: TableChartFormData;
  queriesData: ChartDataResponseResult[];
}

export interface TableChartData<D extends DataRecord = DataRecord> {
  records: D[];
  columns: string[];
}

export interface TableChartTransformedProps<D extends DataRecord = DataRecord> {
  height: number;
  width: number;
  rowCount?: number;
  serverPagination: boolean;
  serverPaginationData: { pageSize?: number; currentPage?: number };
  setDataMask: SetDataMaskHook;
  isRawRecords?: boolean;
  data: D[];
  totals?: D;
  columns: DataColumnMeta[];
  metrics?: (keyof D)[];
  percentMetrics?: (keyof D)[];
  pageSize?: number;
  showCellBars?: boolean;
  sortDesc?: boolean;
  includeSearch?: boolean;
  alignPositiveNegative?: boolean;
  colorPositiveNegative?: boolean;
  tableTimestampFormat?: string;
  // These are dashboard filters, don't be confused with in-chart search filter
  // enabled by `includeSearch`
  filters?: DataRecordFilters;
  emitFilter?: boolean;
  onChangeFilter?: ChartProps['hooks']['onAddFilter'];

  // custom
  headerText: string;
  boldText: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groups: any[];
  includeExcel?: boolean;
  freezeFirstColumn?: boolean;
  conditions: Array<ConditionProps>;
  includeSno: boolean;
  matrixOrderBy: string;
  matrixOrderByOrder: string;
}

// Custom

export interface ConditionalTableStylesProps {
  height: number;
  width: number;
  boldText: boolean;
  hasMultipleHeader: boolean;
}

export interface ConditionProps {
  column: string;
  alignment: string;
  format: string;
  showTotal: boolean;
  totalFormula: string;
  disableFilters: boolean;
  dateFormat: string;
  conditionalColumn: string;
  disableSortBy: boolean;
  thumbnailHeight: number;
  thumbnailWidth: number;
  remarkColumn: string;
  conditions: Array<ConditionColumnProps>;
}

export interface ConditionColumnProps {
  initialValue: number;
  initialSymbol: string;
  finalValue: number;
  finalSymbol: string;
  color: ColorProp;
}

interface ColorProp {
  r: string;
  g: string;
  b: string;
  a: string;
}

interface ConditionalTableCustomizeProps {
  headerText: string;
}

export type ConditionalTableQueryFormData = QueryFormData &
  ConditionalTableStylesProps &
  ConditionalTableCustomizeProps;
