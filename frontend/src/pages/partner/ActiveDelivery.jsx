import { useEffect, useState } from 'react';
import { RiMapPinLine, RiCheckLine, RiPhoneLine, RiNavigationLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../../api/api';
import Navbar from '../../components/Navbar';
import { Spinner } from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { RouteMap } from '../../components/MapWrapper';
import { getSocket, startLocationBroadcast, stopLocationBroadcast } from '../../socket/socket';
import * as S from '../../styles/common';

const DELIVERY_STATUS_FLOW = {
  assigned:   { next: 'picked_up',  label: 'Mark Picked Up',   color: 'btnPrimary' },
  picked_up:  { next: 'in_transit', label: 'Start Delivery',   color: 'btnPrimary' },
  in_transit: { next: 'delivered',  label: 'Mark Delivered',   color: 'btnGreen'   },
};

export default function ActiveDelivery() {
  const [delivery, setDelivery] = useState(null);
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);
  const [directions, setDirections] = useState(null);

  // Fetch active delivery (most recent assigned/picked_up/in_transit)
  useEffect(() => {
    const fetchActive = async () => {
      setLoading(true);
      try {
        // Get history and find the active one
        const res = await api.get('/partner/history?limit=5');
        const deliveries = res.data.deliveries || [];
        const active = deliveries.find((d) =>
          ['assigned', 'picked_up', 'in_transit'].includes(d.status)
        );
        if (active) {
          setDelivery(active);
          setOrder(active.orderId); // populated in backend
        }
      } catch {
        toast.error('Failed to load active delivery');
      } finally {
        setLoading(false);
      }
    };
    fetchActive();
  }, []);

  // Start broadcasting location when in_transit
  useEffect(() => {
    if (!delivery || !order) return;
    if (delivery.status === 'in_transit') {
      startLocationBroadcast(
        delivery.partnerId,
        order?.orderId,
        () => new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(
            (p) => res([p.coords.longitude, p.coords.latitude]),
            rej
          )
        )
      );
    }
    return () => stopLocationBroadcast();
  }, [delivery?.status]);

  // Fetch directions when order is loaded
  useEffect(() => {
    if (!order || !window.google?.maps) return;
    const pickup  = order.pickupAddress?.location?.coordinates;
    const dropoff = order.deliveryAddress?.location?.coordinates;
    if (!pickup || !dropoff) return;

    const service = new window.google.maps.DirectionsService();
    service.route({
      origin:      { lat: pickup[1],  lng: pickup[0]  },
      destination: { lat: dropoff[1], lng: dropoff[0] },
      travelMode:  window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') setDirections(result);
    });
  }, [order]);

  const handleStatusUpdate = async () => {
    if (!delivery) return;
    const flow = DELIVERY_STATUS_FLOW[delivery.status];
    if (!flow) return;

    setUpdating(true);
    try {
      const res = await api.put(`/partner/orders/${delivery.orderId._id || delivery.orderId}/status`, {
        status: flow.next,
      });
      const updated = res.data.delivery;
      setDelivery(updated);
      toast.success(`Status updated: ${flow.next.replace('_', ' ')}`);

      if (flow.next === 'delivered') {
        stopLocationBroadcast();
        toast.success('Delivery complete! Great job 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center"><Spinner large /></main>
    </div>
  );

  if (!delivery || !order) return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className={S.topBar}><h1 className={S.topBarTitle}>Active Delivery</h1></div>
        <div className={S.emptyState} style={{ marginTop: '80px' }}>
          <RiNavigationLine className="text-[48px] text-[#2a2a2a] mb-4" />
          <p className={S.emptyTitle}>No active delivery</p>
          <p className={S.emptySubtitle}>Accept an order from Available Orders to start delivering</p>
        </div>
      </main>
    </div>
  );

  const flow        = DELIVERY_STATUS_FLOW[delivery.status];
  const pickupCoords  = order.pickupAddress?.location?.coordinates;
  const dropCoords    = order.deliveryAddress?.location?.coordinates;
  const pickupLatLng  = pickupCoords  ? { lat: pickupCoords[1],  lng: pickupCoords[0]  } : null;
  const dropLatLng    = dropCoords    ? { lat: dropCoords[1],    lng: dropCoords[0]    } : null;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-32 md:pb-0">
        <div className={S.topBar}>
          <h1 className={S.topBarTitle}>Active Delivery</h1>
          <StatusBadge status={delivery.status} />
        </div>

        {/* Map */}
        <div className={`${S.mapTrack}`}>
          <RouteMap pickup={pickupLatLng} dropoff={dropLatLng} directions={directions} />
        </div>

        <div className="p-4 md:p-6 max-w-[700px] mx-auto">
          {/* Order info */}
          <div className={`${S.cardPadded} mb-4`}>
            <div className={S.flexBetween + ' mb-3'}>
              <span className={S.orderCardId}>{order.orderId}</span>
              <span className="font-bold text-[16px] text-[#ff6b00]">₹{delivery.partnerEarnings}</span>
            </div>

            {/* Addresses */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff6b00]/15 flex items-center justify-center text-[#ff6b00] flex-shrink-0"><RiMapPinLine /></div>
                <div>
                  <p className="text-[11px] text-[#888888] uppercase mb-0.5">Pickup from</p>
                  <p className="text-[14px] font-semibold text-[#f0f0f0]">{order.pickupAddress?.businessName}</p>
                  <p className="text-[13px] text-[#888888]">{order.pickupAddress?.address}</p>
                </div>
              </div>
              <div className="ml-4 w-[2px] h-5 bg-[#2e2e2e]" />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2979ff]/15 flex items-center justify-center text-[#2979ff] flex-shrink-0"><RiMapPinLine /></div>
                <div>
                  <p className="text-[11px] text-[#888888] uppercase mb-0.5">Deliver to</p>
                  <p className="text-[14px] font-semibold text-[#f0f0f0]">{order.deliveryAddress?.fullAddress}</p>
                  {order.deliveryAddress?.landmark && (
                    <p className="text-[13px] text-[#888888]">Near: {order.deliveryAddress.landmark}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items summary */}
            <div className="p-3 rounded-xl bg-[#2a2a2a] mb-4">
              <p className="text-[12px] text-[#888888] mb-1 uppercase tracking-wide">Order items</p>
              {order.items?.map((item, i) => (
                <p key={i} className="text-[13px] text-[#f0f0f0]">{item.name} ×{item.quantity}</p>
              ))}
            </div>

            {/* Customer phone */}
            {order.customerId?.phone && (
              <a href={`tel:${order.customerId.phone}`}
                className={`${S.btnSecondary} w-full justify-center`}>
                <RiPhoneLine /> Call Customer
              </a>
            )}
          </div>

          {/* Action button */}
          {flow && (
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className={`${S[flow.color] || S.btnPrimary} w-full text-[16px] py-4`}>
              {updating
                ? <span className={S.spinner} />
                : <><RiCheckLine /> {flow.label}</>}
            </button>
          )}

          {delivery.status === 'delivered' && (
            <div className={`${S.successAlert} text-center mt-4`}>
              ✅ Delivery complete! ₹{delivery.partnerEarnings} credited.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}