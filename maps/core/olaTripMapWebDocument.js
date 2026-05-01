import { OLA_DEFAULT_MAP_STYLE } from "@/config/olaMaps";
/**
 * Self-contained MapLibre + Ola vector tiles for WebView.
 * RN pushes updates via `injectJavaScript` calling `window.__olaDispatch(payload)`.
 */
export function buildOlaTripMapHtml() {
    const styleDefault = OLA_DEFAULT_MAP_STYLE;
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<link href="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
<style>
html,body,#map{margin:0;padding:0;width:100%;height:100%;overflow:hidden;}
.map-controls{position:absolute;right:14px;bottom:18px;display:flex;flex-direction:column;gap:10px;z-index:9}
.map-btn{width:38px;height:38px;border-radius:10px;border:none;background:#fff;box-shadow:0 2px 7px rgba(0,0,0,.22);font-size:23px;font-weight:700;color:#0f172a}
</style>
</head><body>
<div id="map"></div>
<div class="map-controls">
  <button class="map-btn" id="zoom-in">+</button>
  <button class="map-btn" id="zoom-out">−</button>
  <button class="map-btn" id="focus-driver">◎</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.min.js"></script>
<script>
(function(){
  var state = {
    map: null,
    ready: false,
    latest: null,
    driverMarker: null,
    pickupMarker: null,
    dropMarker: null,
    styleName: '${styleDefault}'
  };

  function postToRn(obj) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(obj));
      }
    } catch (e) {}
  }

  function truckEl() {
    var d = document.createElement('div');
    d.style.width = '36px';
    d.style.height = '36px';
    d.style.display = 'flex';
    d.style.alignItems = 'center';
    d.style.justifyContent = 'center';
    d.style.fontSize = '26px';
    d.style.textShadow = '0 1px 2px rgba(0,0,0,0.35)';
    d.textContent = '🚚';
    return d;
  }

  function pinEl(label, color) {
    var w = document.createElement('div');
    w.style.width = '28px';
    w.style.height = '28px';
    w.style.borderRadius = '14px';
    w.style.background = color;
    w.style.border = '2px solid #fff';
    w.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
    w.style.display = 'flex';
    w.style.alignItems = 'center';
    w.style.justifyContent = 'center';
    w.style.fontSize = '11px';
    w.style.fontWeight = '800';
    w.style.color = '#fff';
    w.textContent = label;
    return w;
  }

  var driverAnim = { from: null, to: null, start: 0, raf: null };

  function setDriverLngLat(map, lngLat) {
    if (!state.driverMarker) return;
    var marker = state.driverMarker;
    var now = performance.now();
    var cur = marker.getLngLat();
    var from = [cur.lng, cur.lat];
    if (driverAnim.raf) cancelAnimationFrame(driverAnim.raf);
    driverAnim.from = from;
    driverAnim.to = lngLat;
    driverAnim.start = now;
    function easeOut(t) { return t * (2 - t); }
    function frame(t) {
      var el = (t - driverAnim.start) / 420;
      if (el >= 1) {
        marker.setLngLat(driverAnim.to);
        driverAnim.raf = null;
        return;
      }
      var e = easeOut(el);
      var lng = driverAnim.from[0] + (driverAnim.to[0] - driverAnim.from[0]) * e;
      var lat = driverAnim.from[1] + (driverAnim.to[1] - driverAnim.from[1]) * e;
      marker.setLngLat([lng, lat]);
      driverAnim.raf = requestAnimationFrame(frame);
    }
    driverAnim.raf = requestAnimationFrame(frame);
  }

  function ensureRouteLayer(map) {
    if (map.getSource('trip-route')) return;
    map.addSource('trip-route', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
    });
    map.addLayer({
      id: 'trip-route-line',
      type: 'line',
      source: 'trip-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.92 }
    });
  }

  function renderMap(p) {
      var map = state.map;
      ensureRouteLayer(map);
      var src = map.getSource('trip-route');
      var coords = (p.route || []).map(function(c){ return [c[0], c[1]]; });
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords.length > 1 ? coords : [] }
      });

      if (p.pickup) {
        if (!state.pickupMarker) {
          state.pickupMarker = new maplibregl.Marker({ element: pinEl('P', '#16a34a') }).setLngLat(p.pickup).addTo(map);
        } else state.pickupMarker.setLngLat(p.pickup);
      } else if (state.pickupMarker) { state.pickupMarker.remove(); state.pickupMarker = null; }

      if (p.showDrop && p.drop) {
        if (!state.dropMarker) {
          state.dropMarker = new maplibregl.Marker({ element: pinEl('D', '#dc2626') }).setLngLat(p.drop).addTo(map);
        } else state.dropMarker.setLngLat(p.drop);
      } else if (state.dropMarker) { state.dropMarker.remove(); state.dropMarker = null; }

      if (p.driver) {
        if (!state.driverMarker) {
          state.driverMarker = new maplibregl.Marker({ element: truckEl(), pitchAlignment: 'map', rotationAlignment: 'map' })
            .setLngLat(p.driver).addTo(map);
        } else setDriverLngLat(map, p.driver);
      } else if (state.driverMarker) { state.driverMarker.remove(); state.driverMarker = null; }

      var pad = p.padding || { top: 48, right: 32, bottom: 48, left: 32 };
      var bounds = new maplibregl.LngLatBounds();
      var extended = false;
      if (coords.length > 1) {
        coords.forEach(function(c){ bounds.extend(c); extended = true; });
      }
      if (p.pickup) { bounds.extend(p.pickup); extended = true; }
      if (p.showDrop && p.drop) { bounds.extend(p.drop); extended = true; }
      if (p.driver) { bounds.extend(p.driver); extended = true; }
      if (p.fitCamera !== false) {
        if (extended) {
          map.fitBounds(bounds, { padding: pad, maxZoom: 16, duration: 520 });
        } else if (p.driver) {
          map.easeTo({ center: p.driver, zoom: Math.max(map.getZoom(), 14), duration: 400 });
        } else if (p.pickup) {
          map.easeTo({ center: p.pickup, zoom: Math.max(map.getZoom(), 14), duration: 400 });
        }
      } else if (p.followDriver && p.driver) {
        map.easeTo({ center: p.driver, zoom: Math.max(map.getZoom(), 15), duration: 300 });
      }
  }

  function wireMapControls(map) {
    var plus = document.getElementById('zoom-in');
    var minus = document.getElementById('zoom-out');
    var focus = document.getElementById('focus-driver');
    if (plus) plus.onclick = function() { map.easeTo({ zoom: Math.min(20, map.getZoom() + 1), duration: 220 }); };
    if (minus) minus.onclick = function() { map.easeTo({ zoom: Math.max(3, map.getZoom() - 1), duration: 220 }); };
    if (focus) focus.onclick = function() {
      if (state.latest && state.latest.driver) {
        map.easeTo({ center: state.latest.driver, zoom: Math.max(map.getZoom(), 15), duration: 280 });
      }
    };
  }

  function applyPayload(p) {
    var apiKey = p.apiKey;
    var styleName = p.styleName || state.styleName;
    if (!apiKey) return;
    state.latest = p;

    if (!state.map) {
      var styleUrl = 'https://api.olamaps.io/tiles/vector/v1/styles/' + styleName + '/style.json';
      state.map = new maplibregl.Map({
        container: 'map',
        style: styleUrl,
        center: [77.61, 12.93],
        zoom: 12,
        interactive: true,
        dragPan: true,
        scrollZoom: true,
        boxZoom: false,
        dragRotate: false,
        keyboard: false,
        doubleClickZoom: true,
        touchZoomRotate: true,
        attributionControl: false,
        transformRequest: function(url, resourceType) {
          var u = String(url).replace('app.olamaps.io', 'api.olamaps.io');
          var sep = u.indexOf('?') >= 0 ? '&' : '?';
          return { url: u + sep + 'api_key=' + encodeURIComponent(apiKey), resourceType: resourceType };
        }
      });
      state.map.on('load', function() {
        state.ready = true;
        wireMapControls(state.map);
        postToRn({ type: 'OLA_MAP_READY' });
        if (state.latest) renderMap(state.latest);
      });
      state.map.on('error', function(ev) {
        var msg = 'map error';
        try {
          if (ev && ev.error) msg = typeof ev.error === 'string' ? ev.error : JSON.stringify(ev.error);
        } catch (e2) {}
        postToRn({ type: 'OLA_MAP_ERROR', message: msg });
      });
      return;
    }

    if (!state.ready) return;
    renderMap(state.latest);
  }

  window.__olaDispatch = function(payload) {
    try {
      if (!payload || payload.type !== 'MAP_SYNC') return;
      applyPayload(payload);
    } catch (err) {
      postToRn({ type: 'OLA_MAP_ERROR', message: String(err && err.message ? err.message : err) });
    }
  };
})();
` +
        "</scr" +
        "ipt></body></html>";
}
