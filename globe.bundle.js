/* TheCareers AI SEARCH CORE globe
 *
 * This module contains only the visualization.  It deliberately owns a
 * namespaced stage and disposes a previous amCharts root before re-initialising
 * so SPA navigation, hot reloads, and retries cannot create duplicate roots.
 */

const STAGE_ID = 'thecareers-globe-stage';
const GLOBE_ID = 'thecareers-ai-globe';
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2.3;
const START_ZOOM = 1.02;

let activeRoot = null;
let activeChart = null;
let spinAnimation = null;
let resumeTimer = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((script) => script.src === src);
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.addEventListener('load', () => {
      script.dataset.loaded = '1';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error(`Unable to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function ensureAmCharts() {
  if (window.am5 && window.am5map && window.am5geodata_worldLow && window.am5themes_Animated) return;
  await loadScript('https://cdn.amcharts.com/lib/5/index.js');
  await loadScript('https://cdn.amcharts.com/lib/5/map.js');
  await loadScript('https://cdn.amcharts.com/lib/5/geodata/worldLow.js');
  await loadScript('https://cdn.amcharts.com/lib/5/themes/Animated.js');
}

function disposeGlobe() {
  if (spinAnimation) {
    try { spinAnimation.stop(); } catch (_) { /* amCharts already disposed */ }
    spinAnimation = null;
  }
  clearTimeout(resumeTimer);
  resumeTimer = null;
  if (activeRoot) {
    try { activeRoot.dispose(); } catch (_) { /* safe teardown */ }
    activeRoot = null;
    activeChart = null;
  }
  if (window.__theCareersGlobe?.root && window.__theCareersGlobe.root !== activeRoot) {
    try { window.__theCareersGlobe.root.dispose(); } catch (_) { /* safe teardown */ }
  }
  window.__theCareersGlobe = null;
}

function showFallback(el, message) {
  if (!el) return;
  el.innerHTML = `
    <div class="thecareers-globe-fallback" role="status">
      <span>${message}</span>
    </div>`;
}

function createCities(citySeries) {
  const add = (name, latitude, longitude) => citySeries.pushDataItem({ name, latitude, longitude });
  return {
    kuwait: add('Kuwait — AI Search Core', 29.3759, 47.9774),
    dubai: add('Dubai', 25.2048, 55.2708),
    riyadh: add('Riyadh', 24.7136, 46.6753),
    doha: add('Doha', 25.2854, 51.5310),
    manama: add('Manama', 26.2235, 50.5876),
    muscat: add('Muscat', 23.5880, 58.3829),
    cairo: add('Cairo', 30.0444, 31.2357),
    istanbul: add('Istanbul', 41.0082, 28.9784),
    athens: add('Athens', 37.9838, 23.7275),
    frankfurt: add('Frankfurt', 50.1109, 8.6821),
    paris: add('Paris', 48.8566, 2.3522),
    london: add('London', 51.5072, -0.1276),
    mumbai: add('Mumbai', 19.0760, 72.8777),
    delhi: add('Delhi', 28.6139, 77.2090),
    singapore: add('Singapore', 1.3521, 103.8198),
    tokyo: add('Tokyo', 35.6762, 139.6503),
    newyork: add('New York', 40.7128, -74.0060),
    toronto: add('Toronto', 43.6532, -79.3832),
    sydney: add('Sydney', -33.8688, 151.2093),
    amman: add('Amman', 31.9539, 35.9106),
    beirut: add('Beirut', 33.8938, 35.5018),
    baghdad: add('Baghdad', 33.3152, 44.3661),
    karachi: add('Karachi', 24.8607, 67.0011),
    dhaka: add('Dhaka', 23.8103, 90.4125),
    bangkok: add('Bangkok', 13.7563, 100.5018),
    kualalumpur: add('Kuala Lumpur', 3.1390, 101.6869),
    seoul: add('Seoul', 37.5665, 126.9780),
    beijing: add('Beijing', 39.9042, 116.4074),
    shanghai: add('Shanghai', 31.2304, 121.4737),
    hongkong: add('Hong Kong', 22.3193, 114.1694),
    rome: add('Rome', 41.9028, 12.4964),
    madrid: add('Madrid', 40.4168, -3.7038),
    amsterdam: add('Amsterdam', 52.3676, 4.9041),
    brussels: add('Brussels', 50.8503, 4.3517),
    zurich: add('Zurich', 47.3769, 8.5417),
    vienna: add('Vienna', 48.2082, 16.3738),
    warsaw: add('Warsaw', 52.2297, 21.0122),
    stockholm: add('Stockholm', 59.3293, 18.0686),
    oslo: add('Oslo', 59.9139, 10.7522),
    johannesburg: add('Johannesburg', -26.2041, 28.0473),
    nairobi: add('Nairobi', -1.2921, 36.8219),
    casablanca: add('Casablanca', 33.5731, -7.5898),
    lagos: add('Lagos', 6.5244, 3.3792),
    chicago: add('Chicago', 41.8781, -87.6298),
    losangeles: add('Los Angeles', 34.0522, -118.2437),
    sanfrancisco: add('San Francisco', 37.7749, -122.4194),
    miami: add('Miami', 25.7617, -80.1918),
    mexico: add('Mexico City', 19.4326, -99.1332),
    saopaulo: add('São Paulo', -23.5505, -46.6333),
    buenosaires: add('Buenos Aires', -34.6037, -58.3816),
    melbourne: add('Melbourne', -37.8136, 144.9631)
  };
}

function addCityBullets(root, citySeries, am5) {
  citySeries.bullets.push((rootArg, series, dataItem) => {
    const container = am5.Container.new(root, {});
    const isKuwait = dataItem?.dataContext?.name === 'Kuwait — AI Search Core';
    const pulse = container.children.push(am5.Circle.new(root, {
      radius: isKuwait ? 5 : 4,
      fillOpacity: 0,
      stroke: am5.color(isKuwait ? 0x42dd92 : 0x75b7ff),
      strokeWidth: isKuwait ? 1.7 : 1.1,
      strokeOpacity: isKuwait ? 0.62 : 0.42
    }));
    pulse.animate({
      key: 'radius', from: isKuwait ? 4 : 3, to: isKuwait ? 19 : 12,
      duration: isKuwait ? 1700 : 1600, loops: Infinity,
      easing: am5.ease.out(am5.ease.cubic)
    });
    pulse.animate({
      key: 'strokeOpacity', from: isKuwait ? 0.62 : 0.42, to: 0,
      duration: isKuwait ? 1700 : 1600, loops: Infinity
    });
    container.children.push(am5.Circle.new(root, {
      radius: isKuwait ? 4.2 : 2.7,
      fill: am5.color(isKuwait ? 0x42dd92 : 0xffffff),
      stroke: am5.color(isKuwait ? 0xffffff : 0x65adff),
      strokeWidth: 1.25,
      tooltipText: '{name}'
    }));
    return am5.Bullet.new(root, { sprite: container });
  });
}

function addTravelers(root, chart, cities, am5, am5map) {
  const glowLines = chart.series.push(am5map.MapLineSeries.new(root, { lineType: 'curved' }));
  glowLines.mapLines.template.setAll({ stroke: am5.color(0x63a7f0), strokeWidth: 5.6, strokeOpacity: 0.055 });
  const routeLines = chart.series.push(am5map.MapLineSeries.new(root, { lineType: 'curved' }));
  routeLines.mapLines.template.setAll({ stroke: am5.color(0x79b5ef), strokeWidth: 2.8, strokeOpacity: 0.13 });
  const activeLines = chart.series.push(am5map.MapLineSeries.new(root, { lineType: 'curved' }));
  activeLines.mapLines.template.setAll({ stroke: am5.color(0xb7dcff), strokeWidth: 1.05, strokeOpacity: 0.48 });
  const coreLines = chart.series.push(am5map.MapLineSeries.new(root, { lineType: 'curved' }));
  coreLines.mapLines.template.setAll({ stroke: am5.color(0xf4f8ff), strokeWidth: 0.38, strokeOpacity: 0.72 });

  const travelers = chart.series.push(am5map.MapPointSeries.new(root, {}));
  travelers.bullets.push(() => {
    const container = am5.Container.new(root, {});
    container.children.push(am5.Circle.new(root, { radius: 6.4, fill: am5.color(0x64b2ff), fillOpacity: 0.07, strokeOpacity: 0 }));
    container.children.push(am5.Circle.new(root, {
      radius: 2.25, fill: am5.color(0xffffff), stroke: am5.color(0x70b8ff), strokeWidth: 1.15
    }));
    return am5.Bullet.new(root, { sprite: container });
  });

  const targets = [
    cities.dubai, cities.riyadh, cities.doha, cities.manama, cities.muscat,
    cities.amman, cities.beirut, cities.baghdad, cities.cairo, cities.istanbul,
    cities.athens, cities.frankfurt, cities.paris, cities.london, cities.rome,
    cities.madrid, cities.amsterdam, cities.brussels, cities.zurich, cities.vienna,
    cities.warsaw, cities.stockholm, cities.oslo, cities.mumbai, cities.delhi,
    cities.karachi, cities.dhaka, cities.bangkok, cities.kualalumpur, cities.singapore,
    cities.seoul, cities.beijing, cities.shanghai, cities.hongkong, cities.tokyo,
    cities.johannesburg, cities.nairobi, cities.casablanca, cities.lagos, cities.newyork,
    cities.toronto, cities.chicago, cities.losangeles, cities.sanfrancisco, cities.miami,
    cities.mexico, cities.saopaulo, cities.buenosaires, cities.sydney, cities.melbourne
  ];
  targets.forEach((target, index) => {
    glowLines.pushDataItem({ pointsToConnect: [cities.kuwait, target] });
    routeLines.pushDataItem({ pointsToConnect: [cities.kuwait, target] });
    const active = activeLines.pushDataItem({ pointsToConnect: [cities.kuwait, target] });
    coreLines.pushDataItem({ pointsToConnect: [cities.kuwait, target] });
    [0.06 + (index % 5) * 0.055, 0.36, 0.68].forEach((position, lane) => {
      const traveler = travelers.pushDataItem({ lineDataItem: active, positionOnLine: position });
      traveler.animate({
        key: 'positionOnLine', to: 1,
        duration: (lane === 0 ? 4200 : lane === 1 ? 5900 : 7600) + index * 85,
        loops: Infinity, easing: am5.ease.linear
      });
    });
  });
}

function addKuwaitCore(root, chart, am5, am5map) {
  const core = chart.series.push(am5map.MapPointSeries.new(root, {}));
  core.bullets.push(() => {
    const container = am5.Container.new(root, {});
    [8, 14, 21].forEach((radius, index) => {
      const ring = container.children.push(am5.Circle.new(root, {
        radius: 4, fillOpacity: 0,
        stroke: am5.color(index === 2 ? 0x7ee6ad : 0x39a8ff),
        strokeWidth: index === 0 ? 1.45 : 0.9,
        strokeOpacity: index === 0 ? 0.52 : 0.26
      }));
      ring.animate({ key: 'radius', from: 4, to: radius, duration: 1500 + index * 280, loops: Infinity });
      ring.animate({ key: 'strokeOpacity', from: index === 0 ? 0.52 : 0.26, to: 0, duration: 1500 + index * 280, loops: Infinity });
    });
    container.children.push(am5.Circle.new(root, {
      radius: 4.2, fill: am5.color(0x39a8ff), stroke: am5.color(0xffffff), strokeWidth: 1.35,
      tooltipText: 'Kuwait — AI Search Core'
    }));
    return am5.Bullet.new(root, { sprite: container });
  });
  core.pushDataItem({ latitude: 29.3759, longitude: 47.9774 });
}

function bindMotion(stage, chart, am5) {
  const baseRotationX = -48;
  const baseRotationY = -18;
  const baseZoom = START_ZOOM;
  const stopSpin = () => {
    if (spinAnimation) {
      try { spinAnimation.stop(); } catch (_) { /* safe stop */ }
      spinAnimation = null;
    }
  };
  const startSpin = () => {
    stopSpin();
    const current = chart.get('rotationX') || baseRotationX;
    spinAnimation = chart.animate({ key: 'rotationX', from: current, to: current + 360, duration: 62000, loops: Infinity, easing: am5.ease.linear });
  };
  const scheduleResume = (delay = 900) => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startSpin, delay);
  };
  const reset = () => {
    stopSpin();
    chart.animate({ key: 'rotationX', to: baseRotationX, duration: 350 });
    chart.animate({ key: 'rotationY', to: baseRotationY, duration: 350 });
    chart.animate({ key: 'zoomLevel', to: baseZoom, duration: 350 });
    scheduleResume(700);
  };

  startSpin();
  stage.addEventListener('pointerdown', stopSpin, { passive: true });
  stage.addEventListener('pointerup', () => scheduleResume(), { passive: true });
  stage.addEventListener('pointercancel', () => scheduleResume(), { passive: true });
  stage.addEventListener('dblclick', reset, { passive: true });
  return { stopSpin, startSpin, reset };
}

async function initGlobe() {
  const stage = document.getElementById(STAGE_ID);
  const el = document.getElementById(GLOBE_ID);
  if (!stage || !el || el.dataset.globeReady === '1') return;
  try {
    await ensureAmCharts();
    disposeGlobe();
    const { am5, am5map, am5geodata_worldLow, am5themes_Animated } = window;
    el.dataset.globeReady = '1';
    el.replaceChildren();

    const root = am5.Root.new(GLOBE_ID);
    activeRoot = root;
    root.setThemes([am5themes_Animated.new(root)]);
    const chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: 'rotateX', panY: 'rotateY', projection: am5map.geoOrthographic(),
      paddingTop: 22, paddingBottom: 22, paddingLeft: 22, paddingRight: 22,
      wheelY: 'zoom', wheelX: 'none', pinchZoom: true,
      minZoomLevel: MIN_ZOOM, maxZoomLevel: MAX_ZOOM, animationDuration: 500,
      x: am5.percent(50), y: am5.percent(50), centerX: am5.percent(50), centerY: am5.percent(50)
    }));
    activeChart = chart;
    chart.setAll({ rotationX: -48, rotationY: -18, zoomLevel: START_ZOOM, x: am5.percent(50), y: am5.percent(50), centerX: am5.percent(50), centerY: am5.percent(50) });

    const background = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    background.mapPolygons.template.setAll({ fill: am5.color(0x162b43), fillOpacity: 1, stroke: am5.color(0x7d9dbc), strokeOpacity: 0.18, strokeWidth: 0.8 });
    background.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });

    const land = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldLow }));
    land.mapPolygons.template.setAll({ tooltipText: '{name}', fill: am5.color(0xb9cadc), fillOpacity: 0.97, stroke: am5.color(0xf1f6fb), strokeOpacity: 0.68, strokeWidth: 0.72, interactive: true });
    land.mapPolygons.template.states.create('hover', { fill: am5.color(0xe0edf9), strokeOpacity: 0.82 });

    const graticule = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticule.mapLines.template.setAll({ stroke: am5.color(0xc9d5e4), strokeOpacity: 0.13, strokeWidth: 0.65 });

    const citySeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    addCityBullets(root, citySeries, am5);
    const cities = createCities(citySeries);
    addTravelers(root, chart, cities, am5, am5map);
    addKuwaitCore(root, chart, am5, am5map);
    const motion = bindMotion(stage, chart, am5);

    let resizeTimer = null;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        chart.setAll({ x: am5.percent(50), y: am5.percent(50), centerX: am5.percent(50), centerY: am5.percent(50) });
        chart.set('zoomLevel', Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, chart.get('zoomLevel') || START_ZOOM)));
      }, 120);
    });
    observer.observe(stage);
    root.events.on('dispose', () => { observer.disconnect(); clearTimeout(resizeTimer); });
    window.__theCareersGlobe = { root, chart, ...motion, dispose: () => root.dispose() };
    chart.appear(700, 50);
  } catch (error) {
    console.error('[TheCareers] globe init failed:', error);
    el.dataset.globeReady = '';
    showFallback(el, 'GLOBE CONNECTION RETRY');
    window.setTimeout(initGlobe, 5000);
  }
}

initGlobe();

// Keep the independent GLOBAL SEARCH NETWORK effect unchanged.
import('./assets/blackhole-three.js').catch((error) => {
  console.error('[TheCareers] black-hole module load failed:', error);
});
