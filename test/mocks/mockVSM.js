/**
 * Mock VSM data for testing
 */
export const mockVSM = {
	id: 'test-vsm-1',
	title: 'Test Value Stream Map',
	processes: [
		{
			id: 'p1',
			name: 'Process 1',
			position: { x: 100, y: 100 },
			metrics: {
				processTime: 10,
				completeAccurate: 90
			}
		},
		{
			id: 'p2',
			name: 'Process 2',
			position: { x: 300, y: 100 },
			metrics: {
				processTime: 20,
				completeAccurate: 95
			}
		},
		{
			id: 'p3',
			name: 'Process 3',
			position: { x: 500, y: 100 },
			metrics: {
				processTime: 15
			}
		}
	],
	connections: [
		{
			id: 'c1',
			sourceId: 'p1',
			targetId: 'p2',
			metrics: {
				waitTime: 5
			}
		},
		{
			id: 'c2',
			sourceId: 'p2',
			targetId: 'p3',
			metrics: {
				waitTime: 10
			}
		}
	],
	metrics: {
		totalLeadTime: 60,
		totalValueAddedTime: 45,
		valueAddedRatio: 0.75,
		totalReworkTime: 3.5,
		worstCaseLeadTime: 63.5,
		averageLeadTime: 63.5,
		cycleTimeByProcess: {
			p1: 10,
			p2: 25,
			p3: 25
		},
		reworkCycleTimeByProcess: {
			p1: 1,
			p2: 2.5
		}
	}
};
