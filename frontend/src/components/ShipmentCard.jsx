import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function ShipmentCard({ shipment }) {
  if (!shipment) return null

  return (
    <Link
      to={`/shipments/${shipment.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-sm font-medium text-gray-800">
          {shipment.trackingNumber}
        </span>
        <StatusBadge status={shipment.status} type="shipment" />
      </div>
      <p className="text-sm text-gray-600">
        <span className="text-gray-800">{shipment.origin}</span>
        <span className="mx-2">→</span>
        <span className="text-gray-800">{shipment.destination}</span>
      </p>
    </Link>
  )
}
