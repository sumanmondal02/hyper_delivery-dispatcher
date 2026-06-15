import * as S from '../styles/common';

const STATUS_LABELS = {
  placed:     'Placed',
  accepted:   'Accepted',
  preparing:  'Preparing',
  ready:      'Ready',
  picked_up:  'Picked Up',
  in_transit: 'In Transit',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
  assigned:   'Assigned',
  failed:     'Failed',
};

export default function StatusBadge({ status }) {
  return (
    <span className={S.getStatusStyle(status)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}