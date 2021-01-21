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
    return <tr>{childData}</tr>;
  }
  return <></>;
}
