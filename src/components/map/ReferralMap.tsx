import { MapContainer, Marker, Popup, Polyline, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import type { Hospital, Referral } from '@/types/domain'
import 'leaflet/dist/leaflet.css'

const marker = (color: string) => L.divIcon({ className: 'astra-map-marker', html: `<span style="background:${color}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] })

export function ReferralMap({ referral, hospitals }: { referral: Referral; hospitals: Hospital[] }) {
  const facilities = hospitals.filter((hospital) => referral.matchedFacilities.includes(hospital.id))
  const selected = facilities.find((hospital) => hospital.id === referral.sentToFacilityId) || facilities[0]
  const center: [number, number] = selected ? [selected.location.lat, selected.location.lng] : [13.0827, 80.2707]
  const origin: [number, number] = [center[0] - 0.025, center[1] - 0.02]
  return <div className="referral-map"><MapContainer center={center} zoom={11} scrollWheelZoom={false}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={origin} icon={marker('#35D6E8')}><Popup>Referral location · SIMULATION / DEMO DATA</Popup></Marker>{facilities.map((hospital) => { const color = hospital.id === referral.confirmedFacilityId ? '#19C7A5' : hospital.id === referral.sentToFacilityId ? '#FFD166' : '#38B6FF'; return <Marker key={hospital.id} position={[hospital.location.lat, hospital.location.lng]} icon={marker(color)}><Popup><strong>{hospital.name}</strong><br />Capability Match · {hospital.verificationStatus}<br />SIMULATION / DEMO DATA</Popup></Marker> })}<Polyline positions={[origin, center]} pathOptions={{ color: '#35D6E8', dashArray: '6 8' }} /></MapContainer><span className="map-label">SIMULATION / DEMO DATA · No live traffic or ETA</span></div>
}
