(() => {
  const from = new URLSearchParams(location.search).get('from');
  const back = document.getElementById('journeyReturn');
  if (back && (from === 'balcony' || from === 'house')) {
    const room = from === 'balcony' ? 'balcony' : 'study';
    back.href = '/house/#' + room;
    back.textContent = '← the ' + room;
  }
})();
