import { useState } from 'react'
import { BarChart3, Clock3, Hospital, Layers, Play, RefreshCw, ShieldAlert, Truck } from 'lucide-react'
import { HOSPITALS } from '@/store/appStore'

type SimulationScenario = 'MASS_CASUALTY' | 'HOSPITAL_SURGE' | 'ROAD_DISRUPTION' | 'RESOURCE_SHORTAGE'

export function AdminSimulation() {
  const [scenario, setScenario] = useState<SimulationScenario>('MASS_CASUALTY')
  const [emergencyLoad, setEmergencyLoad] = useState(25) // incoming cases
  const [capacityReduction, setCapacityReduction] = useState(30) // % capacity drop
  const [trafficDelay, setTrafficDelay] = useState(15) // mins delay
  const [isSimulating, setIsSimulating] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const runSimulation = () => {
    setIsSimulating(true)
    setTimeout(() => {
      setIsSimulating(false)
      setLastRun(new Date().toLocaleTimeString())
    }, 600)
  }

  // Simulated metrics projections
  const projectedSurge = Math.round(emergencyLoad * 1.4)
  const overloadedHospitals = HOSPITALS.filter((_, idx) => idx % 2 === 0).length
  const avgRouteDelay = trafficDelay + 8

  return (
    <div className="space-y-6">
      {/* Permanent Safety Banner */}
      <div className="bg-amber-500/15 border-2 border-amber-500/40 text-amber-300 p-4 rounded-xl flex items-center gap-3 shadow-lg shadow-amber-500/5">
        <ShieldAlert size={28} className="text-amber-400 flex-shrink-0" />
        <div>
          <strong className="text-base font-bold text-amber-300 block tracking-wide">
            SIMULATION DATA — NOT LIVE EMERGENCY DATA
          </strong>
          <small className="text-amber-200/80 text-xs block mt-0.5">
            Operational scenarios executed here are isolated models for decision support and capacity planning. Live emergency routing and hospital telemetry remain untouched.
          </small>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Controls */}
        <div className="card p-6 space-y-5 lg:col-span-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={20} className="text-cyan-400" /> Scenario Parameters
          </h2>

          <div className="space-y-4">
            <label className="block text-xs font-semibold uppercase text-gray-400">
              Select Preset Scenario
              <select
                className="w-full mt-1.5"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as SimulationScenario)}
              >
                <option value="MASS_CASUALTY">Mass Casualty Incident (MCI)</option>
                <option value="HOSPITAL_SURGE">Regional Epidemic Hospital Surge</option>
                <option value="ROAD_DISRUPTION">Arterial Highway Blockage</option>
                <option value="RESOURCE_SHORTAGE">Oxygen & ICU Bed Shortage</option>
              </select>
            </label>

            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1 font-medium">
                <span>Simulated Incoming Patient Load</span>
                <strong className="text-cyan-400">{emergencyLoad} Cases</strong>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={emergencyLoad}
                onChange={(e) => setEmergencyLoad(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1 font-medium">
                <span>Regional ICU Capacity Reduction</span>
                <strong className="text-rose-400">-{capacityReduction}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={capacityReduction}
                onChange={(e) => setCapacityReduction(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1 font-medium">
                <span>Traffic Transit Delay</span>
                <strong className="text-amber-400">+{trafficDelay} min</strong>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={trafficDelay}
                onChange={(e) => setTrafficDelay(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <button className="btn-primary wide py-3 mt-4" onClick={runSimulation} disabled={isSimulating}>
              {isSimulating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Calculating Telemetry Projections...
                </>
              ) : (
                <>
                  <Play size={18} /> Execute Scenario Simulation
                </>
              )}
            </button>

            {lastRun && (
              <p className="text-[11px] text-gray-400 text-center">
                Last calculated at {lastRun} · Model version 2.4-sim
              </p>
            )}
          </div>
        </div>

        {/* Projection Results */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 border-t-4 border-t-cyan-400">
              <div className="flex justify-between items-center text-gray-400 text-xs">
                <span>Projected Load Peak</span>
                <BarChart3 size={16} className="text-cyan-400" />
              </div>
              <strong className="text-2xl font-bold text-white block mt-2">{projectedSurge}</strong>
              <small className="text-cyan-300 text-[11px]">Cases / hour peak intake</small>
            </div>

            <div className="card p-4 border-t-4 border-t-rose-500">
              <div className="flex justify-between items-center text-gray-400 text-xs">
                <span>At-Capacity Facilities</span>
                <Hospital size={16} className="text-rose-400" />
              </div>
              <strong className="text-2xl font-bold text-white block mt-2">{overloadedHospitals} / {HOSPITALS.length}</strong>
              <small className="text-rose-300 text-[11px]">Require inter-hospital transfer</small>
            </div>

            <div className="card p-4 border-t-4 border-t-amber-400">
              <div className="flex justify-between items-center text-gray-400 text-xs">
                <span>Avg Transit Impact</span>
                <Truck size={16} className="text-amber-400" />
              </div>
              <strong className="text-2xl font-bold text-white block mt-2">+{avgRouteDelay} min</strong>
              <small className="text-amber-300 text-[11px]">Revised ALS ambulance ETA</small>
            </div>
          </div>

          {/* Hospital Load Projections Table */}
          <div className="card p-5">
            <h3 className="text-base font-bold mb-3 flex items-center justify-between">
              <span>Simulated Facility Capacity Impact</span>
              <span className="text-xs text-gray-400 font-normal">Decision Support Projections</span>
            </h3>

            <div className="space-y-3">
              {HOSPITALS.map((h, i) => {
                const simulatedLoad = Math.min(100, Math.round(50 + i * 18 + emergencyLoad * 0.8))
                const isOver = simulatedLoad > 85

                return (
                  <div key={h.id} className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-white text-sm block font-semibold">{h.name}</strong>
                      <span className="text-gray-400 text-xs">{h.address.city} · {h.type}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${isOver ? 'bg-rose-500' : 'bg-cyan-400'}`}
                          style={{ width: `${simulatedLoad}%` }}
                        />
                      </div>
                      <span className={`font-mono font-bold w-12 text-right ${isOver ? 'text-rose-400' : 'text-cyan-300'}`}>
                        {simulatedLoad}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommended Operational Strategy */}
          <div className="card p-5 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/20">
            <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <Clock3 size={16} /> Recommended Decision Support Strategy
            </h3>
            <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
              <li>Initiate pre-routing protocols to secondary cardiac cath facilities in Indiranagar sector.</li>
              <li>Activate inter-hospital transport standby for cases exceeding 30 min waiting threshold.</li>
              <li>Notify regional EMS command to reroute Tier-1 trauma cases away from central corridor.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
