import { styled } from '@superset-ui/core';
import { ConditionalTableStylesProps } from './types';
export default styled.div<ConditionalTableStylesProps>`
  table {
    width: 100%;
    min-width: auto;
    max-width: none;
    margin: 0;
  }
  .header-conditional-table {
  }

  .header-conditional-table > tr > th {
    position: relative;
    padding-right: 40px;
  }
  .header-conditional-table > tr > th > svg {
    right: 10px;
    top: 40% !important;
    position: absolute;
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

  .carousel-item {
    position: relative;
    display: none;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    width: 100%;
    transition: -webkit-transform 0.6s ease;
    transition: transform 0.6s ease;
    transition: transform 0.6s ease, -webkit-transform 0.6s ease;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-perspective: 1000px;
    perspective: 1000px;
  }
  .carousel-item-next,
  .carousel-item-prev,
  .carousel-item.active {
    display: block;
  }

  .carousel-indicators {
    position: absolute;
    right: 0;
    bottom: 10px;
    left: 0;
    z-index: 15;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    padding-left: 0;
    margin-right: 15%;
    margin-left: 15%;
    list-style: none;

    li {
      position: relative;
      -webkit-box-flex: 0;
      -ms-flex: 0 1 auto;
      flex: 0 1 auto;
      width: 30px;
      height: 3px;
      margin-right: 3px;
      margin-left: 3px;
      text-indent: -999px;
      background-color: rgba(255, 255, 255, 0.5);

      // Use pseudo classes to increase the hit area by 10px on top and bottom.
      &::before {
        position: absolute;
        top: -10px;
        left: 0;
        display: inline-block;
        width: 100%;
        height: 10px;
        content: '';
      }
      &::after {
        position: absolute;
        bottom: -10px;
        left: 0;
        display: inline-block;
        width: 100%;
        height: 10px;
        content: '';
      }
    }

    .active {
      background-color: #fff;
    }
  }

  .carousel-control-prev-icon {
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23fff' viewBox='0 0 8 8'%3E%3Cpath d='M5.25 0l-4 4 4 4 1.5-1.5-2.5-2.5 2.5-2.5-1.5-1.5z'/%3E%3C/svg%3E");
  }
  .carousel-control-next-icon {
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23fff' viewBox='0 0 8 8'%3E%3Cpath d='M2.75 0l-1.5 1.5 2.5 2.5-2.5 2.5 1.5 1.5 4-4-4-4z'/%3E%3C/svg%3E");
  }

  .carousel-control-prev,
  .carousel-control-next {
    position: absolute;
    top: 0;
    bottom: 0;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    width: 15%;
    color: #fff;
    text-align: center;
    opacity: 0.5;

    // Hover/focus state
    &:hover-focus {
      color: #fff;
      text-decoration: none;
      outline: 0;
      opacity: 0.9;
    }
  }
  .carousel-control-next {
    right: 0;
  }

  .ct-img-thumbnail {
    cursor: pointer;
    padding: 2px;
  }

  .ct-img {
    max-width: 100%;
    max-height: 500px;
  }

  .remark {
    font-size: 20px;
  }
`;
