/* TheCareers approved interactive amCharts globe.
   Loaded defensively from the official amCharts CDN because GitHub Pages
   cannot resolve bare npm package imports at runtime. */

const stage = document.getElementById('globeStage');
const el = document.getElementById('chartdiv');

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(s => s.src === src);
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve(); }, { once: true });
    s.addEventListener('error', reject, { once: true });
    document.head.appendChild(s);
  });
}

async function ensureAmCharts() {
  if (window.am5 && window.am5map && window.am5geodata_worldLow && window.am5themes_Animated) return;
  await loadScript('https://cdn.amcharts.com/lib/5/index.js');
  await loadScript('https://cdn.amcharts.com/lib/5/map.js');
  await loadScript('https://cdn.amcharts.com/lib/5/geodata/worldLow.js');
  await loadScript('https://cdn.amcharts.com/lib/5/themes/Animated.js');
}

function showFallback(message) {
  if (!el) return;
  el.innerHTML = `
    <div style="position:absolute;inset:7%;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 32% 24%,#eef6ff 0%,#b9cadc 31%,#34506d 62%,#162b43 100%);box-shadow:inset 0 0 34px rgba(255,255,255,.18),0 18px 44px rgba(35,62,92,.18)">
      <div style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font:600 11px Inter,Arial,sans-serif;letter-spacing:.08em;text-align:center;padding:30%">${message}</div>
    </div>`;
}

async function initGlobe() {
  if (!el || el.dataset.globeReady === '1') return;
  try {
    await ensureAmCharts();
    const { am5, am5map, am5geodata_worldLow, am5themes_Animated } = window;
    el.dataset.globeReady = '1';
    el.innerHTML = '';

    const root = am5.Root.new('chartdiv');
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: 'rotateX',
      panY: 'rotateY',
      projection: am5map.geoOrthographic(),
      paddingTop: 22,
      paddingBottom: 22,
      paddingLeft: 22,
      paddingRight: 22,
      wheelY: 'zoom',
      wheelX: 'none',
      pinchZoom: true,
      minZoomLevel: 0.78,
      maxZoomLevel: 3.2,
      animationDuration: 700
    }));

    chart.setAll({ rotationX: -48, rotationY: -18, zoomLevel: 1.04 });

    // Ocean sphere — approved silver/blue look.
    const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    backgroundSeries.mapPolygons.template.setAll({
      fill: am5.color(0x162b43),
      fillOpacity: 1,
      stroke: am5.color(0x8fb0cf),
      strokeOpacity: 0.12,
      strokeWidth: 1
    });
    backgroundSeries.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow
    }));
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: '{name}',
      fill: am5.color(0xb9cadc),
      fillOpacity: 0.90,
      stroke: am5.color(0xeaf2fa),
      strokeOpacity: 0.58,
      strokeWidth: 0.55,
      interactive: true
    });
    polygonSeries.mapPolygons.template.states.create('hover', {
      fill: am5.color(0xd9e7f5),
      fillOpacity: 1
    });

    const graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      stroke: am5.color(0xb7c9dc),
      strokeOpacity: 0.13,
      strokeWidth: 0.7
    });

    const citySeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    citySeries.bullets.push((rootArg, series, dataItem) => {
      const container = am5.Container.new(root, {});
      const isKuwait = dataItem?.dataContext?.name === 'Kuwait — Search Core';
      const pulse = container.children.push(am5.Circle.new(root, {
        radius: 5,
        fillOpacity: 0,
        stroke: am5.color(isKuwait ? 0x42dd92 : 0x75b7ff),
        strokeWidth: isKuwait ? 1.7 : 1.2,
        strokeOpacity: isKuwait ? 0.62 : 0.46
      }));
      pulse.animate({ key: 'radius', from: 4, to: isKuwait ? 19 : 13, duration: isKuwait ? 1700 : 1500, loops: Infinity, easing: am5.ease.out(am5.ease.cubic) });
      pulse.animate({ key: 'strokeOpacity', from: isKuwait ? 0.62 : 0.48, to: 0, duration: isKuwait ? 1700 : 1500, loops: Infinity });
      container.children.push(am5.Circle.new(root, {
        radius: isKuwait ? 4.6 : 3.2,
        fill: am5.color(isKuwait ? 0x42dd92 : 0xffffff),
        stroke: am5.color(isKuwait ? 0xffffff : 0x65adff),
        strokeWidth: 1.3,
        tooltipText: '{name}'
      }));
      return am5.Bullet.new(root, { sprite: container });
    });

    const addCity = (name, lat, lon) => citySeries.pushDataItem({ name, latitude: lat, longitude: lon });
    const cities = {
      kuwait: addCity('Kuwait — Search Core', 29.3759, 47.9774),
      dubai: addCity('Dubai', 25.2048, 55.2708),
      riyadh: addCity('Riyadh', 24.7136, 46.6753),
      london: addCity('London', 51.5072, -0.1276),
      frankfurt: addCity('Frankfurt', 50.1109, 8.6821),
      mumbai: addCity('Mumbai', 19.0760, 72.8777),
      singapore: addCity('Singapore', 1.3521, 103.8198),
      newyork: addCity('New York', 40.7128, -74.0060),
      sydney: addCity('Sydney', -33.8688, 151.2093)
    };

    const glowLines = chart.series.push(am5map.MapLineSeries.new(root, { lineType: 'curved' }));
    glowLines.mapLines.template.setAll({ stroke: am5.color(0x5f9fe8), strokeWidth: 7, strokeOpacity: 0.055 });

    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, { lineType: 'curved' }));
    lineSeries.mapLines.template.setAll({ stroke: am5.color(0x82b9f3), strokeWidth: 1.45, strokeOpacity: 0.50 });

    const coreLines = chart.series.push(am5map.MapLineSeries.new(root, { lineType: 'curved' }));
    coreLines.mapLines.template.setAll({ stroke: am5.color(0xcbe4ff), strokeWidth: 0.55, strokeOpacity: 0.68 });

    const travelerSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    travelerSeries.bullets.push(() => {
      const container = am5.Container.new(root, {});
      container.children.push(am5.Circle.new(root, { radius: 7, fill: am5.color(0x75b7ff), fillOpacity: 0.10, strokeOpacity: 0 }));
      container.children.push(am5.Circle.new(root, {
        radius: 2.4,
        fill: am5.color(0xffffff),
        stroke: am5.color(0x65adff),
        strokeWidth: 1.5,
        shadowColor: am5.color(0x4d9cf2),
        shadowBlur: 8,
        shadowOpacity: 0.65
      }));
      return am5.Bullet.new(root, { sprite: container });
    });

    const routeTargets = [cities.dubai, cities.riyadh, cities.london, cities.frankfurt, cities.mumbai, cities.singapore, cities.newyork, cities.sydney];
    routeTargets.forEach((target, index) => {
      glowLines.pushDataItem({ pointsToConnect: [cities.kuwait, target] });
      const route = lineSeries.pushDataItem({ pointsToConnect: [cities.kuwait, target] });
      coreLines.pushDataItem({ pointsToConnect: [cities.kuwait, target] });
      const traveler1 = travelerSeries.pushDataItem({ lineDataItem: route, positionOnLine: Math.min(0.85, index * 0.08) });
      traveler1.animate({ key: 'positionOnLine', to: 1, duration: 4200 + index * 470, loops: Infinity, easing: am5.ease.linear });
      const traveler2 = travelerSeries.pushDataItem({ lineDataItem: route, positionOnLine: 0.42 });
      traveler2.animate({ key: 'positionOnLine', to: 1, duration: 6100 + index * 390, loops: Infinity, easing: am5.ease.linear });
    });

    let spin = null;
    let resumeTimer = null;
    const stopSpin = () => { if (spin) { spin.stop(); spin = null; } };
    const startSpin = () => {
      stopSpin();
      const current = chart.get('rotationX') || 0;
      spin = chart.animate({ key: 'rotationX', from: current, to: current + 360, duration: 52000, loops: Infinity, easing: am5.ease.linear });
    };

    startSpin();
    stage?.addEventListener('pointerdown', () => { stopSpin(); clearTimeout(resumeTimer); });
    stage?.addEventListener('pointerup', () => { clearTimeout(resumeTimer); resumeTimer = setTimeout(startSpin, 1200); });
    stage?.addEventListener('pointercancel', () => { clearTimeout(resumeTimer); resumeTimer = setTimeout(startSpin, 1200); });
    stage?.addEventListener('dblclick', () => {
      stopSpin();
      chart.animate({ key: 'rotationX', to: -48, duration: 450 });
      chart.animate({ key: 'rotationY', to: -18, duration: 450 });
      chart.animate({ key: 'zoomLevel', to: 1.04, duration: 450 });
      resumeTimer = setTimeout(startSpin, 850);
    });

    chart.appear(700, 80);
    window.TheCareersGlobe = { root, chart, startSpin, stopSpin };
  } catch (err) {
    console.error('[TheCareers] globe init failed:', err);
    showFallback('GLOBE CONNECTION RETRY');
    setTimeout(() => { if (el) { el.dataset.globeReady = ''; initGlobe(); } }, 5000);
  }
}

initGlobe();
