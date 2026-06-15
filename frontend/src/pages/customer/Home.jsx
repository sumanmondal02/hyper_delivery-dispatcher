import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiSearchLine, RiMapPinLine, RiTimeLine, RiStoreLine, RiRefreshLine } from 'react-icons/ri';
import { GoogleMap, Marker } from '@react-google-maps/api';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner, SkeletonCard } from '../../components/Spinner';
import * as S from '../../styles/common';

const CATEGORIES = ['All', 'restaurant', 'grocery', 'pharmacy', 'bakery', 'other'];

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
];

export default function CustomerHome() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [locError, setLocError] = useState(false);

  const fetchVendors = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const res = await api.get(`/vendors/nearby?lat=${lat}&lng=${lng}&radius=5`);
      setVendors(res.data.vendors || []);
      setFiltered(res.data.vendors || []);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(loc);
        fetchVendors(coords.latitude, coords.longitude);
      },
      () => {
        setLocError(true);
        setLoading(false);
        // fallback: Hyderabad
        fetchVendors(17.385, 78.486);
      }
    );
  }, [fetchVendors]);

  useEffect(() => {
    let result = vendors;
    if (category !== 'All') result = result.filter((v) => v.category === category);
    if (search.trim()) result = result.filter((v) =>
      v.businessName.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [category, search, vendors]);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#888888]">Delivering to</p>
            <button className="flex items-center gap-1 text-[#f0f0f0] font-semibold text-[14px] truncate">
              <RiMapPinLine className="text-[#ff6b00] flex-shrink-0" />
              {locError ? 'Location unavailable' : userLocation ? 'Current location' : 'Detecting...'}
            </button>
          </div>
          <button onClick={() => setShowMap(!showMap)}
            className={`${S.btnIcon} ${showMap ? 'text-[#ff6b00] bg-[#ff6b00]/15' : ''}`}
            title="Toggle map">
            <RiMapPinLine />
          </button>
          <button onClick={() => userLocation && fetchVendors(userLocation.lat, userLocation.lng)}
            className={S.btnIcon} title="Refresh">
            <RiRefreshLine />
          </button>
        </div>

        <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
          {/* Map toggle */}
          {showMap && userLocation && (
            <div className={`${S.mapContainer} mb-5 h-[240px]`}>
              <GoogleMap
                zoom={13}
                center={userLocation}
                mapContainerClassName="w-full h-full"
                options={{ disableDefaultUI: true, zoomControl: true, styles: DARK_MAP_STYLE }}
              >
                <Marker position={userLocation}
                  icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} />
                {filtered.map((v) => v.location?.coordinates && (
                  <Marker key={v._id}
                    position={{ lat: v.location.coordinates[1], lng: v.location.coordinates[0] }}
                    title={v.businessName}
                    onClick={() => navigate(`/vendor/${v._id}`)}
                  />
                ))}
              </GoogleMap>
            </div>
          )}

          {/* Search */}
          <div className={`${S.searchBar} mb-4`}>
            <RiSearchLine className={S.searchIcon} />
            <input
              type="text"
              placeholder="Search restaurants, groceries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={S.searchInput}
            />
          </div>

          {/* Categories */}
          <div className={`${S.chipRow} mb-5`}>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={category === c ? S.chipActive : S.chip}>
                {c === 'All' ? '🍽️' : c === 'restaurant' ? '🍔' : c === 'grocery' ? '🛒' : c === 'pharmacy' ? '💊' : c === 'bakery' ? '🥐' : '📦'}
                {' '}{c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {/* Vendor grid */}
          <div className={`${S.sectionHead} mb-3`}>
            <div>
              <h2 className={S.sectionTitle}>Nearby Stores</h2>
              <p className={S.sectionSub}>{filtered.length} open near you</p>
            </div>
          </div>

          {loading ? (
            <div className={S.grid3}>
              {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={S.emptyState}>
              <RiStoreLine className={S.emptyIcon} />
              <p className={S.emptyTitle}>No stores found</p>
              <p className={S.emptySubtitle}>
                {search ? 'Try a different search term' : 'No stores open nearby right now'}
              </p>
            </div>
          ) : (
            <div className={S.grid3}>
              {filtered.map((vendor) => (
                <VendorCard key={vendor._id} vendor={vendor} onClick={() => navigate(`/vendor/${vendor._id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function VendorCard({ vendor, onClick }) {
  return (
    <div className={S.vendorCard} onClick={onClick}>
      {vendor.image ? (
        <img src={vendor.image} alt={vendor.businessName} className={S.vendorCardImg} />
      ) : (
        <div className={`${S.vendorCardImg} flex items-center justify-center text-[#555555] text-[40px]`}>🏪</div>
      )}
      <div className={S.vendorCardBody}>
        <div className={S.flexBetween}>
          <h3 className={S.vendorCardName}>{vendor.businessName}</h3>
          <span className={vendor.isOpen ? S.vendorCardOpen : S.vendorCardClosed}>
            {vendor.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className={S.vendorCardMeta}>
          <span className="capitalize">{vendor.category}</span>
          <span className={S.dot} />
          {vendor.openingTime && (
            <span className={S.vendorCardEta}>
              <RiTimeLine /> {vendor.openingTime} – {vendor.closingTime}
            </span>
          )}
        </div>
        {vendor.description && (
          <p className="text-[12px] text-[#555555] mt-1.5 line-clamp-1">{vendor.description}</p>
        )}
      </div>
    </div>
  );
}