import { styled } from '@superset-ui/core';
import { ConditionalTableStylesProps } from './types';

export default styled.div<ConditionalTableStylesProps>`
  table {
    width: 99%;
    min-width: auto;
    max-width: none;
    margin: 0;
  }

  .main-container {
    height: 300;
  }

  .tableWrap {
    display: block;
    max-width: 100%;
    // overflow-x: auto;
    // overflow-y: hidden;
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
