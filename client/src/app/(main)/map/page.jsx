'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { mapAPI } from '@/lib/api';

// City → approximate coords mapping (Indian cities + global)
const CITY_COORDS = {
  // Major metros
  'mumbai': [19.076, 72.877], 'delhi': [28.6139, 77.209], 'new delhi': [28.6139, 77.209],
  'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.385, 78.4867], 'secunderabad': [17.4399, 78.4983],
  'chennai': [13.0827, 80.2707], 'madras': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639], 'calcutta': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714],
  // Tier 2 India
  'jaipur': [26.9124, 75.7873], 'surat': [21.1702, 72.8311],
  'lucknow': [26.8467, 80.9462], 'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882], 'indore': [22.7196, 75.8577],
  'bhopal': [23.2599, 77.4126], 'visakhapatnam': [17.6868, 83.2185],
  'vizag': [17.6868, 83.2185], 'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812], 'ghaziabad': [28.6692, 77.4538],
  'ludhiana': [30.9010, 75.8573], 'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898], 'faridabad': [28.4089, 77.3178],
  'meerut': [28.9845, 77.7064], 'rajkot': [22.3039, 70.8022],
  'kalyan': [19.2437, 73.1355], 'vasai-virar': [19.4207, 72.8472],
  'varanasi': [25.3176, 82.9739], 'benares': [25.3176, 82.9739],
  'srinagar': [34.0837, 74.7973], 'aurangabad': [19.8762, 75.3433],
  'dhanbad': [23.7957, 86.4304], 'amritsar': [31.634, 74.8723],
  'allahabad': [25.4358, 81.8463], 'prayagraj': [25.4358, 81.8463],
  'ranchi': [23.3441, 85.3096], 'coimbatore': [11.0168, 76.9558],
  'jabalpur': [23.1815, 79.9864], 'gwalior': [26.2183, 78.1828],
  'vijayawada': [16.5062, 80.648], 'jodhpur': [26.2389, 73.0243],
  'madurai': [9.9252, 78.1198], 'raipur': [21.2514, 81.6296],
  'kota': [25.2138, 75.8648], 'chandigarh': [30.7333, 76.7794],
  'guwahati': [26.1445, 91.7362], 'solapur': [17.6805, 75.9064],
  'hubli': [15.3647, 75.124], 'dharwad': [15.3647, 75.124],
  'bareilly': [28.347, 79.4304], 'moradabad': [28.8386, 78.7733],
  'mysore': [12.2958, 76.6394], 'mysuru': [12.2958, 76.6394],
  'gurgaon': [28.4595, 77.0266], 'gurugram': [28.4595, 77.0266],
  'noida': [28.5355, 77.391], 'kochi': [9.9312, 76.2673],
  'cochin': [9.9312, 76.2673], 'thiruvananthapuram': [8.5241, 76.9366],
  'trivandrum': [8.5241, 76.9366], 'kozhikode': [11.2588, 75.7804],
  'calicut': [11.2588, 75.7804], 'thrissur': [10.5276, 76.2144],
  'mangalore': [12.9141, 74.856], 'mangaluru': [12.9141, 74.856],
  'goa': [15.2993, 74.124], 'panaji': [15.4909, 73.8278],
  'bhubaneswar': [20.2961, 85.8245], 'cuttack': [20.4625, 85.8828],
  'dehradun': [30.3165, 78.0322], 'shimla': [31.1048, 77.1734],
  'jammu': [32.7266, 74.857], 'imphal': [24.817, 93.9368],
  'shillong': [25.5788, 91.8933], 'aizawl': [23.7307, 92.7173],
  'agartala': [23.8315, 91.2868], 'itanagar': [27.0844, 93.6053],
  'kohima': [25.6701, 94.1077], 'gangtok': [27.3314, 88.6138],
  'port blair': [11.6234, 92.7265], 'puducherry': [11.9416, 79.8083],
  'pondicherry': [11.9416, 79.8083], 'tirupati': [13.6288, 79.4192],
  'warangal': [17.9784, 79.6], 'hanamkonda': [17.9784, 79.6],
  'tirunelveli': [8.7139, 77.7567],
  'salem': [11.6643, 78.146], 'tiruchirappalli': [10.7905, 78.7047],
  'trichy': [10.7905, 78.7047], 'erode': [11.341, 77.7172],
  'guntur': [16.3008, 80.4428], 'nellore': [14.4426, 79.9865],
  'kurnool': [15.8281, 78.0373], 'belgaum': [15.8497, 74.4977],
  'belagavi': [15.8497, 74.4977], 'gulbarga': [17.3297, 76.8343],
  'kalaburagi': [17.3297, 76.8343], 'bellary': [15.1394, 76.9214],
  'hospet': [15.2689, 76.3909], 'udupi': [13.3409, 74.7421],
  'shimoga': [13.9299, 75.568], 'shivamogga': [13.9299, 75.568],
  'tumkur': [13.3379, 77.1], 'bijapur': [16.8302, 75.7100],
  'vijayapura': [16.8302, 75.7100],
  // Telangana cities
  'nizamabad': [18.6726, 78.0941], 'karimnagar': [18.4386, 79.1288],
  'khammam': [17.2473, 80.1514], 'ramagundam': [18.7575, 79.4757],
  'mahbubnagar': [16.7378, 77.9872], 'mahabubnagar': [16.7378, 77.9872],
  'nalgonda': [17.0575, 79.2667], 'adilabad': [19.6641, 78.532],
  'suryapet': [17.1397, 79.6218], 'miryalaguda': [16.8708, 79.5638],
  'siddipet': [18.1018, 78.8521], 'jagtial': [18.7946, 78.9156],
  'mancherial': [18.8752, 79.4576], 'bhongir': [17.5098, 78.8839],
  'yadadri': [17.2741, 78.9698], 'sangareddy': [17.6247, 78.0872],
  'medak': [18.0476, 78.2636], 'zaheerabad': [17.6834, 77.6049],
  'nagarkurnool': [16.4817, 78.3249], 'wanaparthy': [16.3629, 78.0636],
  'gadwal': [16.2286, 77.7939], 'narayanpet': [16.7445, 77.4952],
  'kothagudem': [17.5539, 80.6216], 'bhadrachalam': [17.6688, 80.8881],
  'yellandu': [17.5924, 80.3264], 'palwancha': [17.6058, 80.6992],
  'jangaon': [17.7246, 79.1523], 'shadnagar': [17.0649, 78.2034],
  'tandur': [17.2503, 77.5764], 'medchal': [17.628, 78.4801],
  'shamshabad': [17.2543, 78.4229], 'bodhan': [18.6644, 77.9009],
  'kamareddy': [18.3219, 78.3414], 'banswada': [18.3833, 77.8667],
  'koratla': [18.8231, 79.0027], 'metpally': [18.8271, 78.9302],
  'nirmal': [19.0971, 78.344], 'bellampalle': [19.0545, 79.4989],
  'mandamarri': [18.9667, 79.4833], 'chennur': [18.8584, 79.5388],
  'peddapalle': [18.6152, 79.3786], 'sultanabad': [18.5619, 79.2841],
  'huzurabad': [18.2014, 79.3967], 'jammikunta': [18.2832, 79.5178],
  'bhupalpalle': [18.4406, 79.8654], 'mulugu': [18.1967, 80.0681],
  'achampet': [16.5248, 78.6996], 'kalwakurthy': [16.6939, 78.4872],
  'kollapur': [16.5383, 78.3182], 'alampur': [15.8745, 78.1392],
  'gadwal': [16.2286, 77.7939], 'jogulamba': [16.0002, 77.8004],
  'devarakonda': [16.6878, 79.5491], 'nakrekal': [17.0856, 79.4897],
  'huzurnagar': [16.9039, 79.8847], 'kodad': [16.9978, 79.9712],
  'suryapeta': [17.1397, 79.6218], 'mothkur': [17.1578, 79.3986],
  'vikarabad': [17.3363, 77.9039], 'chevella': [17.2621, 77.8042],
  'pargi': [17.1772, 77.8847], 'ibrahimpatnam': [17.1021, 78.6825],
  'bibinagar': [17.4847, 78.8988], 'alair': [17.4178, 79.0178],
  'turkapally': [17.3683, 78.9497], 'pochampally': [17.3354, 78.9167],
  'narayankhed': [17.8571, 77.9128], 'andole': [17.8303, 77.9536],
  'sadasivpet': [17.6254, 77.9584], 'patancheru': [17.5318, 78.2624],
  'ameerpet': [17.4347, 78.4485], 'kukatpally': [17.4849, 78.4138],
  'uppal': [17.4054, 78.5597], 'lb nagar': [17.3457, 78.5522],
  'dilsukhnagar': [17.3686, 78.5249], 'malakpet': [17.3785, 78.5047],
  'mehdipatnam': [17.3943, 78.4401], 'tolichowki': [17.4092, 78.4226],
  'miyapur': [17.4957, 78.3614], 'bachupally': [17.5406, 78.3691],
  'kompally': [17.5535, 78.4672], 'ghatkesar': [17.4551, 78.6904],
  // Andhra Pradesh cities
  'rajahmundry': [17.0005, 81.804], 'rajamahendravaram': [17.0005, 81.804],
  'kakinada': [16.9891, 82.2475], 'kadapa': [14.4673, 78.8242],
  'cuddapah': [14.4673, 78.8242], 'anantapur': [14.6819, 77.6006],
  'vizianagaram': [18.1067, 83.3956], 'eluru': [16.7107, 81.0952],
  'ongole': [15.5057, 80.0499], 'machilipatnam': [16.1875, 81.1389],
  'srikakulam': [18.2949, 83.8977], 'bhimavaram': [16.5449, 81.5212],
  'narasaraopet': [16.2346, 80.0479], 'chirala': [15.8222, 80.3525],
  'tenali': [16.2431, 80.6414], 'proddatur': [14.75, 78.5508],
  'hindupur': [13.8271, 77.4918], 'madanapalle': [13.55, 78.5],
  'chittoor': [13.2172, 79.1003], 'nandyal': [15.4786, 78.4836],
  'adoni': [15.6269, 77.2781], 'guntakal': [15.1729, 77.3741],
  'amaravati': [16.5731, 80.3564], 'tadepalligudem': [16.8161, 81.5263],
  'palasa': [18.7726, 84.4163], 'bobbili': [18.5733, 83.3582],
  'rajam': [18.4609, 83.6501], 'narasapuram': [16.4347, 81.6985],
  'palakol': [16.5163, 81.7338], 'tanuku': [16.8667, 81.6833],
  'puttaparthi': [14.1632, 77.817], 'markapur': [15.7379, 79.2693],
  'dhone': [15.3938, 77.8736], 'tadipatri': [14.9079, 78.0107],
  'narsapur': [16.4347, 81.6985], 'bapatla': [15.9047, 80.4673],
  'repalle': [16.0229, 80.8275], 'sattenapalle': [16.3904, 80.1536],
  'vinukonda': [16.0481, 79.7381], 'piduguralla': [16.4773, 79.8773],
  'macherla': [16.4739, 79.4357], 'gurazala': [16.5675, 79.6211],
  'ponnur': [16.0669, 80.5533], 'mangalagiri': [16.4307, 80.5527],
  'tadepalle': [16.484, 80.6067], 'krishna': [16.5062, 80.648],
  'vuyyuru': [16.3618, 80.8449], 'jaggayyapeta': [16.8945, 80.0973],
  'nandigama': [16.7752, 80.2872], 'tiruvuru': [16.9736, 80.6178],
  'mylavaram': [16.9428, 80.6561], 'nuzvid': [16.7872, 80.8489],
  'gudivada': [16.4348, 80.9935], 'gannavaram': [16.5441, 80.8029],
  'avanigadda': [16.0221, 80.9178], 'challapalli': [16.1143, 81.0569],
  'mopidevi': [16.0658, 81.1408], 'nagayalanka': [15.9231, 80.8614],
  'narsapuram': [16.4347, 81.6985], 'bhimadole': [16.4931, 81.5462],
  'nidadavole': [16.9076, 81.6702], 'kovvur': [17.0164, 81.7299],
  'rajole': [16.9302, 82.0094], 'ramachandrapuram': [17.0039, 81.8327],
  'mandapeta': [16.8633, 81.9271], 'pithapuram': [17.1129, 82.2535],
  'prathipadu': [17.1043, 82.1785], 'tuni': [17.3575, 82.5444],
  'anakapalle': [17.6912, 83.0049], 'narsipatnam': [17.6652, 82.6093],
  'yelamanchili': [17.5427, 82.8643], 'payakaraopeta': [17.3578, 82.778],
  'chodavaram': [17.6308, 82.9399], 'yellamanchili': [17.5427, 82.8643],
  'bheemunipatnam': [17.8908, 83.4531], 'sabbavaram': [17.7741, 83.2267],
  'pendurthi': [17.7827, 83.1742], 'gajuwaka': [17.6926, 83.2203],
  'mvp colony': [17.7231, 83.3012], 'madhurawada': [17.7667, 83.3623],
  'rushikonda': [17.7565, 83.3768], 'kommadi': [17.7721, 83.4012],
  'bheemili': [17.8908, 83.4531], 'nakkapalle': [17.6, 82.75],
  'srungavarapukota': [18.1221, 83.1097], 'salur': [18.4161, 83.2017],
  'gajapathinagaram': [18.3117, 83.4003], 'parvatipuram': [18.7848, 83.4272],
  'makkuva': [18.6625, 83.5511], 'baruva': [18.9647, 84.2356],
  'narasannapeta': [18.414, 84.0481], 'palakonda': [18.6065, 83.7532],
  'tekkali': [18.6086, 84.2335], 'amadalavalasa': [18.4123, 83.9026],
  'etcherla': [18.3411, 83.8789], 'gara': [18.5152, 84.1002],
  'kanchili': [18.7286, 84.0553], 'ichchapuram': [19.1258, 84.6884],
  'sompeta': [18.9471, 84.5875], 'mandasa': [18.8782, 84.4651],
  // Global
  'new york': [40.7128, -74.006], 'london': [51.5074, -0.1278],
  'los angeles': [34.0522, -118.2437], 'paris': [48.8566, 2.3522],
  'tokyo': [35.6762, 139.6503], 'sydney': [-33.8688, 151.2093],
  'toronto': [43.6532, -79.3832], 'berlin': [52.52, 13.405],
  'dubai': [25.2048, 55.2708], 'singapore': [1.3521, 103.8198],
  'amsterdam': [52.3676, 4.9041], 'barcelona': [41.3851, 2.1734],
  'san francisco': [37.7749, -122.4194], 'chicago': [41.8781, -87.6298],
  'miami': [25.7617, -80.1918], 'seattle': [47.6062, -122.3321],
  'melbourne': [-37.8136, 144.9631], 'cape town': [-33.9249, 18.4241],
  'nairobi': [-1.2921, 36.8219], 'lagos': [6.5244, 3.3792],
  'karachi': [24.8607, 67.0011], 'dhaka': [23.8103, 90.4125],
  'colombo': [6.9271, 79.8612], 'kathmandu': [27.7172, 85.3240],
};

// Nominatim geocoding cache to avoid repeated API calls
const geocodeCache = {};

async function geocodeCity(city) {
  if (geocodeCache[city] !== undefined) return geocodeCache[city];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=0`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'CrewUpFilms/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache[city] = coords;
      return coords;
    }
  } catch (_) {}
  geocodeCache[city] = null;
  return null;
}

function getCoordsFromCache(city) {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return geocodeCache[key] ?? undefined; // undefined = not yet fetched, null = not found
}

const AVAIL_COLOR = { 'available': '#22c55e', 'open-to-offers': '#7C75FF', 'busy': '#ef4444' };

const ROLE_EMOJI = {
  'director': '🎬', 'cinematographer': '📷', 'editor': '✂️', 'musician': '🎵',
  'actor': '🎭', 'photographer': '📸', 'writer': '✍️', 'producer': '🎙',
};

function groupByCity(creators) {
  const groups = {};
  for (const c of creators) {
    const city = c.location?.city?.toLowerCase().trim();
    if (!city) continue;
    const coords = getCoordsFromCache(city);
    if (!coords) continue; // null = not found, undefined = pending geocode
    const key = `${coords[0]},${coords[1]}`;
    if (!groups[key]) groups[key] = { coords, creators: [] };
    groups[key].creators.push(c);
  }
  return Object.values(groups);
}

export default function MapPage() {
  const [creators, setCreators]     = useState([]);
  const [groups, setGroups]         = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const mapRef       = useRef(null);
  const leafletRef   = useRef(null);
  const markersRef   = useRef([]);

  useEffect(() => {
    mapAPI.getCreators()
      .then(({ data }) => {
        setCreators(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter creators by role
  const filtered = filterRole
    ? creators.filter((c) => c.user?.role?.toLowerCase().includes(filterRole.toLowerCase()))
    : creators;

  // Geocode unknown cities via Nominatim, then refresh groups
  useEffect(() => {
    const unknownCities = [...new Set(
      filtered
        .map((c) => c.location?.city?.toLowerCase().trim())
        .filter((city) => city && getCoordsFromCache(city) === undefined)
    )];

    if (unknownCities.length === 0) {
      setGroups(groupByCity(filtered));
      return;
    }

    // Geocode unknown cities with a small delay between requests (Nominatim rate limit)
    let cancelled = false;
    (async () => {
      for (let i = 0; i < unknownCities.length; i++) {
        if (cancelled) break;
        await geocodeCity(unknownCities[i]);
        if (i < unknownCities.length - 1) await new Promise(r => setTimeout(r, 300));
      }
      if (!cancelled) setGroups(groupByCity(filtered));
    })();

    return () => { cancelled = true; };
  }, [filtered]);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Load Leaflet CSS + JS if not already loaded
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }

      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [20, 78],
        zoom: 4,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      leafletRef.current = map;
    }

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [mapRef.current]);

  // Add markers when groups change
  useEffect(() => {
    if (!leafletRef.current || !window.L) return;
    const L = window.L;
    const map = leafletRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    groups.forEach(({ coords, creators: grp }) => {
      const dominant = grp[0];
      const availColor = AVAIL_COLOR[dominant.availability] || '#6b6b66';
      const count = grp.length;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:${count > 1 ? 44 : 36}px;
          height:${count > 1 ? 44 : 36}px;
          border-radius:50%;
          background:${availColor};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${count > 1 ? '13px' : '14px'};
          font-weight:700;
          color:white;
          cursor:pointer;
        ">${count > 1 ? count : (ROLE_EMOJI[dominant.user?.role?.toLowerCase()] || '👤')}</div>`,
        iconSize: [count > 1 ? 44 : 36, count > 1 ? 44 : 36],
        iconAnchor: [count > 1 ? 22 : 18, count > 1 ? 22 : 18],
      });

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .on('click', () => setSelected(grp));

      markersRef.current.push(marker);
    });
  }, [groups]);

  const allRoles = [...new Set(creators.map((c) => c.user?.role).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Dark Hero */}
      <div
        className="relative bg-[#0e0e0d] pt-24 pb-8 overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #252523 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full px-3 py-1 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
                <p className="text-xs uppercase tracking-[0.15em] text-[#6C63FF] font-bold">Explore</p>
              </div>
              <h1 className="text-4xl font-[Playfair_Display] text-white mb-1">Creator Map</h1>
              <p className="text-white/50 text-sm">
                Discover {creators.length} creators by location
              </p>
            </div>
            <div className="flex gap-3 flex-wrap items-center pb-1">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30">
                <option value="" className="text-black">All Roles</option>
                {allRoles.map((r) => (
                  <option key={r} value={r} className="capitalize text-black">{r.replace('-', ' ')}</option>
                ))}
              </select>
              <div className="flex items-center gap-4 text-xs text-white/60">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#6C63FF] inline-block" />Open</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Busy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto">
        {/* spacer */}
        <div className="h-4" />

        {/* Map + Sidebar Layout */}
        <div className="flex gap-4 h-[calc(100vh-220px)]">

          {/* Map */}
          <div className="flex-1 rounded-2xl border border-[#efefed] overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                <p className="text-[#6b6b66] text-sm">Loading creators...</p>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Sidebar: selected city creators */}
          <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl border border-[#efefed] bg-white overflow-y-auto">
            {selected ? (
              <>
                <div className="p-4 border-b border-[#efefed] flex items-center justify-between sticky top-0 bg-white z-10">
                  <div>
                    <p className="font-bold text-[#111110] text-sm">{selected[0].location?.city}</p>
                    <p className="text-xs text-[#a3a39e]">{selected.length} creator{selected.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-[#a3a39e] hover:text-[#111110] text-lg">✕</button>
                </div>
                <div className="flex flex-col divide-y divide-[#f0f0ee]">
                  {selected.map((creator) => {
                    const avail = creator.availability || 'available';
                    const dot = AVAIL_COLOR[avail] || '#6b6b66';
                    return (
                      <Link key={creator.user?._id} href={`/profile/${creator.user?._id}`}
                        className="p-4 hover:bg-[#fafaf9] transition-colors flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[#f0ede8] flex items-center justify-center text-sm font-bold text-[#111110]">
                            {creator.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                            style={{ background: dot }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#111110] truncate">{creator.user?.name}</p>
                          <p className="text-xs text-[#a3a39e] capitalize">{creator.user?.role?.replace('-', ' ')}</p>
                          {creator.skills?.slice(0, 2).map((s) => (
                            <span key={s} className="text-xs bg-[#f7f7f6] text-[#a3a39e] px-1.5 py-0.5 mr-1 mt-1 inline-block">{s}</span>
                          ))}
                        </div>
                        <span className="text-xs text-[#a3a39e] flex-shrink-0">→</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6">
                <div>
                  <p className="text-3xl mb-3">📍</p>
                  <p className="text-sm font-medium text-[#111110] mb-1">Click a pin</p>
                  <p className="text-xs text-[#a3a39e]">to see creators in that city</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* No location message */}
        {!loading && creators.filter((c) => !getCoordsForCreator(c)).length > 0 && (
          <p className="text-xs text-[#a3a39e] text-center mt-3 pb-4">
            {creators.filter((c) => !getCoordsForCreator(c)).length} creators haven't set a city yet and aren't shown on the map.
          </p>
        )}
      </div>
    </div>
  );
}
