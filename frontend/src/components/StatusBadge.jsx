const shipmentColors = {
  ORDER_PLACED: 'bg-gray-100 text-gray-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  PACKED_UP: 'bg-amber-100 text-amber-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  EXCEPTION: 'bg-red-100 text-red-800',
}

const driverColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  BUSY: 'bg-amber-100 text-amber-800',
  OFFLINE: 'bg-gray-100 text-gray-800',
}

const roleColors = {
  ADMIN: 'bg-purple-100 text-purple-800',
  CUSTOMER: 'bg-blue-100 text-blue-800',
  DRIVER: 'bg-green-100 text-green-800',
}

export default function StatusBadge({ status, type = 'shipment' }) {
  if (!status) return null

  const colorMap =
    type === 'driver' ? driverColors : type === 'role' ? roleColors : shipmentColors
  const className = colorMap[status] || 'bg-gray-100 text-gray-800'

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${className}`}
    >
      {status}
    </span>
  )
}
