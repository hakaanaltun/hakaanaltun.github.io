const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const shots = [];
  for (const [n,t] of [['evening','2026-10-28T18:00:00+03:00'],['night','2026-10-28T20:45:00+03:00'],['day','2026-10-28T12:00:00+03:00']]) for (const room of ['study','balcony']) for (const vp of [[1440,1000],[390,844]]) {
    const p = await b.newPage({ viewport: { width: vp[0], height: vp[1] } });
    await p.clock.install({ time: new Date(t) });
    await p.route(/open-meteo/, r => r.abort());
    await p.goto('http://localhost:4100/house/#' + room, { waitUntil: 'load' });
    await p.clock.runFor(2000); await p.waitForTimeout(1500);
    await p.screenshot({ path: '/tmp/claude-0/-home-user-hakaanaltun-github-io/14af2acc-0ddd-55ee-963f-6aa1ad960980/scratchpad/shots/v5-' + n + '-' + room + '-' + vp[0] + '.png' });
    if (vp[0] === 1440 && n !== 'day') {
      await p.click(room === 'study' ? '.house-hotspot--lamp' : '.house-hotspot--balcony-switch', { force: true });
      await p.mouse.move(5, 500); await p.waitForTimeout(1500);
      await p.screenshot({ path: '/tmp/claude-0/-home-user-hakaanaltun-github-io/14af2acc-0ddd-55ee-963f-6aa1ad960980/scratchpad/shots/v5-' + n + '-' + room + '-off.png' });
      console.log(n, room, 'off theme', await p.evaluate(() => document.documentElement.dataset.houseTheme));
    }
    await p.close();
  }
  await b.close();
})();
