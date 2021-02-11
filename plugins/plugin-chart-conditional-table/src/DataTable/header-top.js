export default function HeaderTop() {
  if (window.localStorage.getItem('parsedGroups')) {
    const parsedGroups = JSON.parse(window.localStorage.getItem('parsedGroups'));

    const childData = [];
    parsedGroups.forEach(pG => {
      childData.push(
        <th colSpan={pG.span} style={{ textAlign: 'center' }}>
          {pG.column}
        </th>,
      );
    });
    return (
      <tr
        id="groupHeader"
        style={{
          height: childData.length ? 'auto' : '0px',
          overflow: childData.length ? 'auto' : 'hidden',
        }}
      >
        {childData}
      </tr>
    );
  }
  return <></>;
}
