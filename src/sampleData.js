// Made-up sample data for the Delta Ridge Plastics demo.
// No real people, real part numbers, or real plant records.

export const shift = {
  plant: 'Delta Ridge Plastics',
  area: 'Injection Molding, Press Floor 2',
  outgoing: 'Day shift (6:00 AM to 2:00 PM)',
  incoming: 'Afternoon shift (2:00 PM to 10:00 PM)',
  supervisorOutgoing: 'Sample Supervisor A',
}

// Priority: 'safety' items are always shown first and word-for-word.
export const briefingItems = [
  {
    id: 'safety-1',
    priority: 'safety',
    title: 'Safety guard interlock loose on Press 3',
    detail:
      'Interlock sensor bracket on the Press 3 guard is loose. Do not run Press 3 until maintenance confirms the bracket is tight.',
    owner: 'Maintenance',
    due: 'Before first cycle',
  },
  {
    id: 'issue-1',
    priority: 'high',
    title: 'Short shots on Press 7, housing part',
    detail:
      'Short shots on the housing part again. Adjusted hold pressure to 82% at 11:30 AM. Watch the first hour and log any more.',
    owner: 'Afternoon supervisor',
    due: 'First hour',
  },
  {
    id: 'issue-2',
    priority: 'high',
    title: 'Hopper B low on black resin',
    detail:
      'Hopper B is at about 20%. Next resin delivery is expected at 4:00 PM. Refill from the drum cart if the level drops below 10%.',
    owner: 'Material handler',
    due: 'Before 4:00 PM',
  },
  {
    id: 'follow-1',
    priority: 'normal',
    title: 'Hydraulic hose inspection on Press 5',
    detail:
      'Maintenance was asked to inspect the hose near the clamp. Not yet done. Check whether it was completed before the end of the shift.',
    owner: 'Maintenance',
    due: '2:00 PM',
  },
]
