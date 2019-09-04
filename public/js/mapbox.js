export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoia2llbnZvMTIwMiIsImEiOiJjanpyeXlqZGgwMGlyM2h0NHRlaTVrODMxIn0.5YohfpmNhOcMzrtrm4x6RQ';

  var map = new mapboxgl.Map({
    container: 'map', // put to container with id map
    style: 'mapbox://styles/kienvo1202/cjzrzbgoi4vif1dpfeut3iv68',
    scrollZoom: false
    // center: [-118.310182, 34.038906],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';
    //add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100
    }
  });
};
