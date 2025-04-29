// Internal imports
import { connection, createVSM, processBlock } from '$lib/valueStream';

/**
 * Creates a sample value stream map with predefined processes and connections
 * @returns {Object} A sample VSM object
 */
export const createSampleVSM = () => {
	// Define spacing variables (25% increase from original 200 spacing)
	const blockSpacing = 250; // Increased from 200
	const startX = 50;
	const baseY = 100;

	// Create process blocks
	const process1 = processBlock.create({
		id: 'process1',
		name: 'Customer Request',
		position: { x: startX, y: baseY },
		metrics: { processTime: 10, completeAccurate: 100 }
	});

	const process2 = processBlock.create({
		id: 'process2',
		name: 'Analysis',
		position: { x: startX + blockSpacing, y: baseY },
		metrics: { processTime: 30, completeAccurate: 90 }
	});

	const process3 = processBlock.create({
		id: 'process3',
		name: 'Development',
		position: { x: startX + blockSpacing * 2, y: baseY },
		metrics: { processTime: 60, completeAccurate: 85 }
	});

	const process4 = processBlock.create({
		id: 'process4',
		name: 'Testing',
		position: { x: startX + blockSpacing * 3, y: baseY },
		metrics: { processTime: 40, completeAccurate: 95 }
	});

	const process5 = processBlock.create({
		id: 'process5',
		name: 'Deployment',
		position: { x: startX + blockSpacing * 4, y: baseY },
		metrics: { processTime: 20, completeAccurate: 98 }
	});

	// Create connections between processes with wait times
	const conn1 = connection.create({
		id: 'conn1',
		sourceId: 'process1',
		targetId: 'process2',
		metrics: { waitTime: 5 }
	});

	const conn2 = connection.create({
		id: 'conn2',
		sourceId: 'process2',
		targetId: 'process3',
		metrics: { waitTime: 15 }
	});

	const conn3 = connection.create({
		id: 'conn3',
		sourceId: 'process3',
		targetId: 'process4',
		metrics: { waitTime: 20 }
	});

	const conn4 = connection.create({
		id: 'conn4',
		sourceId: 'process4',
		targetId: 'process5',
		metrics: { waitTime: 10 }
	});

	// Create a rework connection from Testing back to Development
	const reworkConn = connection.create({
		id: 'rework1',
		sourceId: 'process4', // From Testing
		targetId: 'process3', // Back to Development
		metrics: { waitTime: 5 },
		isRework: true // Explicitly mark as rework connection
	});

	// Create the VSM with processes and connections
	return createVSM.create({
		id: 'vsm1',
		title: 'Software Development Value Stream',
		processes: [process1, process2, process3, process4, process5],
		connections: [conn1, conn2, conn3, conn4, reworkConn]
	});
};
