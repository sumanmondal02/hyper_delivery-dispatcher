import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiPhoneLine, RiMotorbikeLine, RiMapPinLine, RiTimeLine, RiCloseLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { TrackingMap } from '../../components/MapWrapper';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { Spinner } from '../../components/Spinner';
import useOrderStore from '../../store/useOrderStore';
import { getSocket, joinOrderRoom } from '../../socket/socket';
import * as S from '../../styles/common';

const STATUS_STEPS = [
  { key: 'placed',     label: 'Order placed' },
  { key: 'accepted',   label: 'Vendor accepted' },
  { key: 'preparing',  label: 'Being prepared' },
  { key: 'ready',      label: 'Ready for pickup' },
  { key: 'in_transit', label: 'On the way' },
  { key: 'delivered',  label: 'Delivered' },
];

const STATUS_ORDER = ['placed','accepted','preparing','ready','picked_up','in_transit','delivered'];

function getStepState(stepKey, currentStatus) {
  if (currentStatus === 'cancelled') return 'cancelled';
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx    = STATUS_ORDER.indexOf(stepKey === 'in_transit' ? 'in_transit' : stepKey);
  if (currentIdx >= stepIdx) return 'done';
  if (currentIdx + 1 === stepIdx) return 'active';
  return 'pending';
}

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { activeOrder, partnerLocation, trackOrder, updateOrderStatus, setPartnerLocation } = useOrderStore();

  const [delivery, setDelivery]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const pollingRef                    = useRef(null);

  // Fetch order + delivery data
  const fetchOrder = async () => {
    const res = await trackOrder(orderId);
    if (res.success && res.data?.delivery) {
      setDelivery(res.data.delivery);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await fetchOrder();
      if (mounted) setLoading(false);
    };
    init();

    // Join socket room for live updates
    joinOrderRoom(orderId);

    const socket = getSocket();
    if (socket) {
      socket.on('order_status_update', ({ status }) => {
        updateOrderStatus(status);
      });
      socket.on('partner_location_update', ({ location }) => {
        if (location?.coordinates) {
          setPartnerLocation({
            lat: location.coordinates[1],
            lng: location.coordinates[0],
          });
        }
      });
      socket.on('delivery_assigned', (data) => {
        setDelivery((prev) => ({ ...prev, ...data }));
        toast.success(`${data.partnerName} is picking up your order!`);
      });
    }

    // Poll every 30s as fallback
    pollingRef.current = setInterval(fetchOrder, 30000);

    return () => {
      mounted = false;
      clearInterval(pollingRef.current);
      if (socket) {
        socket.off('order_status_update');
        socket.off('partner_location_update');
        socket.off('delivery_assigned');
      }
    };
  }, [orderId]);

  const handleCancel = async () => {
    try {
      const res = await import('../../api/api').then(m => m.default.put(`/orders/${activeOrder?._id}/cancel`));
      if (res.data.success) {
        updateOrderStatus('cancelled');
        setCancelModal(false);
        toast.success('Order cancelled');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel at this stage');
      setCancelModal(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center"><Spinner large /></main>
    </div>
  );

  if (!activeOrder) return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className={S.h3}>Order not found</p>
        <button onClick={() => navigate('/orders')} className={S.btnPrimary}>My Orders</button>
      </main>
    </div>
  );

  const order       = activeOrder;
  const status      = order.orderStatus;
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';
  const canCancel   = ['placed','accepted','preparing','ready'].includes(status);

  // Map coords
  const pickupCoords = order.pickupAddress?.location?.coordinates
    ? { lat: order.pickupAddress.location.coordinates[1], lng: order.pickupAddress.location.coordinates[0] }
    : null;
  const dropoffCoords = order.deliveryAddress?.location?.coordinates
    ? { lat: order.deliveryAddress.location.coordinates[1], lng: order.deliveryAddress.location.coordinates[0] }
    : null;

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <div className={S.topBar}>
          <button onClick={() => navigate('/orders')} className={S.backBtn}><RiArrowLeftLine /></button>
          <div className="flex-1">
            <h1 className="font-bold text-[15px] text-[#f0f0f0]">Track Order</h1>
            <p className="font-mono text-[12px] text-[#ff6b00]">{order.orderId}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Map */}
        <div className={S.mapTrack + ' relative'}>
          <TrackingMap
            partnerLocation={partnerLocation}
            pickupCoords={pickupCoords}
            dropoffCoords={dropoffCoords}
          />
        </div>

        {/* Tracking card */}
        <div className={S.trackingCard}>
          {isCancelled ? (
            <div className={S.errorAlert + ' mb-4'}>Order was cancelled</div>
          ) : isDelivered ? (
            <div className={S.successAlert + ' mb-4'}>🎉 Delivered successfully!</div>
          ) : (
            <div className="mb-4">
              <p className={S.trackingStatus}>{getStatusMessage(status)}</p>
              {order.estimatedDeliveryTime && (
                <p className={S.trackingEta}>
                  <RiTimeLine className="inline mr-1" />
                  Est. {order.estimatedDeliveryTime} min from order placed
                </p>
              )}
            </div>
          )}

          {/* Partner info if assigned */}
          {delivery?.partnerId && (
            <div className={S.trackingPartner}>
              <div className={S.avatarFallback()}>
                <RiMotorbikeLine />
              </div>
              <div className="flex-1 min-w-0">
                <p className={S.trackingPName}>{delivery.partnerId.name || 'Delivery partner'}</p>
                <p className={S.trackingPSub}>
                  {delivery.partnerId.partnerDetails?.vehicleType || 'Rider'} · On the way
                </p>
              </div>
              {delivery.partnerId.phone && (
                <a href={`tel:${delivery.partnerId.phone}`}
                  className="w-10 h-10 rounded-full bg-[#00c853]/15 flex items-center justify-center text-[#00c853] text-[18px]">
                  <RiPhoneLine />
                </a>
              )}
            </div>
          )}

          {/* Progress stepper */}
          {!isCancelled && (
            <div className={S.stepperWrap + ' mt-4'}>
              {STATUS_STEPS.map((step, i) => {
                const state = getStepState(step.key, status);
                const isLast = i === STATUS_STEPS.length - 1;
                return (
                  <div key={step.key} className={S.stepRow}>
                    <div className="relative flex flex-col items-center">
                      <span className={`${S.stepDot} ${
                        state === 'done'   ? S.stepDotDone :
                        state === 'active' ? S.stepDotActive : S.stepDotPending
                      }`} />
                      {!isLast && (
                        <span className={state === 'done' ? S.stepLineDone : S.stepLine} />
                      )}
                    </div>
                    <span className={
                      state === 'done'   ? S.stepLabelDone :
                      state === 'active' ? S.stepLabelActive : S.stepLabel
                    }>{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Order details */}
          <div className="mt-4 pt-4 border-t border-[#2e2e2e]">
            <div className={S.flexBetween + ' mb-2'}>
              <p className="text-[13px] text-[#888888]">From</p>
              <p className="text-[13px] font-semibold text-[#f0f0f0]">{order.vendorId?.businessName || '—'}</p>
            </div>
            <div className={S.flexBetween + ' mb-2'}>
              <p className="text-[13px] text-[#888888]">Items</p>
              <p className="text-[13px] text-[#f0f0f0]">{order.items?.length} item(s)</p>
            </div>
            <div className={S.flexBetween}>
              <p className="text-[13px] text-[#888888]">Amount to be Paid</p>
              <p className="text-[14px] font-bold text-[#ff6b00]">₹{order.totalAmount}</p>
            </div>
          </div>

          {/* Cancel button */}
          {canCancel && (
            <button onClick={() => setCancelModal(true)}
              className={`${S.btnDangerOutline} w-full mt-4 text-[14px]`}>
              Cancel order
            </button>
          )}
        </div>
      </main>

      {/* Cancel confirm modal */}
      {cancelModal && (
        <div className={S.modalOverlay} onClick={() => setCancelModal(false)}>
          <div className={S.confirmModal} onClick={(e) => e.stopPropagation()}>
            <p className={S.confirmTitle}>Cancel order?</p>
            <p className={S.confirmBody}>This cannot be undone. The vendor will be notified.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setCancelModal(false)} className={S.btnSecondary}>Keep order</button>
              <button onClick={handleCancel} className={S.btnDanger}>Yes, cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusMessage(status) {
  const msgs = {
    placed:     'Waiting for vendor to accept',
    accepted:   'Vendor accepted your order',
    preparing:  'Your order is being prepared',
    ready:      'Order ready — finding a rider',
    picked_up:  'Rider picked up your order',
    in_transit: 'On the way to you!',
    delivered:  'Delivered!',
    cancelled:  'Order cancelled',
  };
  return msgs[status] || status;
}