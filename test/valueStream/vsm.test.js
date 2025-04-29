import { describe, it, expect } from 'vitest';
import createVSM from '../../src/lib/valueStream/createVSM.js';
import processBlock from '../../src/lib/valueStream/processBlock.js';
import connection from '../../src/lib/valueStream/connection.js';

describe('ValueStreamMap', () => {
  const sampleProcess1 = processBlock.create({
    id: 'process1',
    name: 'Process 1',
    metrics: { processTime: 10, waitTime: 5 }
  });
  
  const sampleProcess2 = processBlock.create({
    id: 'process2',
    name: 'Process 2',
    metrics: { processTime: 20, waitTime: 10 }
  });
  
  const sampleConnection = connection.create({
    id: 'conn1',
    sourceId: 'process1',
    targetId: 'process2',
    metrics: { transferTime: 5, batchSize: 1 }
  });
  
  describe('create', () => {
    it('creates a VSM with basic properties', () => {
      const vsm = createVSM.create({
        id: 'vsm1',
        title: 'Test VSM'
      });
      
      expect(vsm).toEqual({
        id: 'vsm1',
        title: 'Test VSM',
        processes: [],
        connections: [],
        metrics: {
          totalLeadTime: 0,
          totalValueAddedTime: 0,
          valueAddedRatio: 0,
          totalReworkTime: 0,
          worstCaseLeadTime: 0
        }
      });
    });
    
    it('creates a VSM with processes and connections', () => {
      const vsm = createVSM.create({
        id: 'vsm1',
        title: 'Test VSM',
        processes: [sampleProcess1, sampleProcess2],
        connections: [sampleConnection]
      });
      
      expect(vsm.id).toBe('vsm1');
      expect(vsm.title).toBe('Test VSM');
      expect(vsm.processes).toHaveLength(2);
      expect(vsm.connections).toHaveLength(1);
      
      // Ensure deep copies were made
      expect(vsm.processes).not.toBe([sampleProcess1, sampleProcess2]);
      expect(vsm.connections).not.toBe([sampleConnection]);
      
      // Verify metrics calculation
      expect(vsm.metrics.totalLeadTime).toBe(30); // 10 + 20 (only process times are part of cycleTime in the new implementation)
      expect(vsm.metrics.totalValueAddedTime).toBe(30); // 10 + 20 (only process times)
      expect(vsm.metrics.valueAddedRatio).toBe(1.0); // 30/30
    });
  });
  
  describe('update', () => {
    it('updates VSM properties immutably', () => {
      const original = createVSM.create({
        id: 'vsm1',
        title: 'Original Title',
        processes: [sampleProcess1],
        connections: []
      });
      
      const updated = createVSM.update(original, {
        title: 'Updated Title'
      });
      
      expect(updated).not.toBe(original);
      expect(updated.title).toBe('Updated Title');
      expect(updated.id).toBe('vsm1'); // Unchanged
      expect(updated.processes).toEqual(original.processes); // Unchanged
    });
    
    it('updates processes immutably and recalculates metrics', () => {
      const original = createVSM.create({
        id: 'vsm1',
        title: 'Test VSM',
        processes: [sampleProcess1]
      });
      
      const updated = createVSM.update(original, {
        processes: [sampleProcess1, sampleProcess2]
      });
      
      expect(updated.processes).not.toBe(original.processes);
      expect(updated.processes).toHaveLength(2);
      expect(updated.metrics.totalLeadTime).toBe(30); // 10 + 20 (only process times in cycle time now)
      expect(updated.metrics.totalValueAddedTime).toBe(30); // 10 + 20
    });
  });
  
  describe('addProcess', () => {
    it('adds a process to VSM and updates metrics', () => {
      const original = createVSM.create({
        id: 'vsm1',
        title: 'Test VSM',
        processes: [sampleProcess1]
      });
      
      const updated = createVSM.addProcess(original, sampleProcess2);
      
      expect(updated.processes).toHaveLength(2);
      expect(updated.processes[1]).toEqual(sampleProcess2);
      expect(updated.metrics.totalLeadTime).toBe(30); // 10 + 20 (only process times)
    });
  });
  
  describe('addConnection', () => {
    it('adds a connection to VSM and updates metrics', () => {
      const original = createVSM.create({
        id: 'vsm1',
        title: 'Test VSM',
        processes: [sampleProcess1, sampleProcess2]
      });
      
      const updated = createVSM.addConnection(original, sampleConnection);
      
      expect(updated.connections).toHaveLength(1);
      expect(updated.connections[0]).toEqual(sampleConnection);
      expect(updated.metrics.totalLeadTime).toBe(30); // 10 + 20 (only process times)
    });
  });
});