import { describe, it, expect } from 'vitest';
import processBlock from '../../src/lib/valueStream/processBlock.js';

describe('processBlock', () => {
  describe('create', () => {
    it('creates a process block with required properties', () => {
      const process = processBlock.create({
        id: 'process1',
        name: 'Process 1'
      });
      
      expect(process).toEqual({
        id: 'process1',
        name: 'Process 1',
        description: '',
        position: { x: 0, y: 0 },
        metrics: {
          processTime: 0, 
          waitTime: 0,
          cycleTime: 0
        }
      });
    });
    
    it('creates a process block with custom properties', () => {
      const process = processBlock.create({
        id: 'process1',
        name: 'Process 1',
        description: 'Test process',
        position: { x: 100, y: 200 },
        metrics: {
          processTime: 30,
          waitTime: 15
        }
      });
      
      expect(process).toEqual({
        id: 'process1',
        name: 'Process 1',
        description: 'Test process',
        position: { x: 100, y: 200 },
        metrics: {
          processTime: 30,
          waitTime: 15,
          cycleTime: 45 // should calculate cycleTime as processTime + waitTime
        }
      });
    });
    
    it('creates a new position object to avoid mutation', () => {
      const position = { x: 100, y: 200 };
      const process = processBlock.create({
        id: 'process1',
        name: 'Process 1',
        position
      });
      
      expect(process.position).not.toBe(position);
      expect(process.position).toEqual(position);
    });
  });
  
  describe('update', () => {
    it('updates process properties immutably', () => {
      const original = processBlock.create({
        id: 'process1',
        name: 'Process 1',
        description: 'Original description',
        position: { x: 10, y: 20 },
        metrics: { processTime: 5, waitTime: 10 }
      });
      
      const updated = processBlock.update(original, {
        name: 'Updated Process',
        description: 'Updated description'
      });
      
      expect(updated).not.toBe(original);
      expect(updated).toEqual({
        id: 'process1',
        name: 'Updated Process',
        description: 'Updated description',
        position: { x: 10, y: 20 },
        metrics: { processTime: 5, waitTime: 10, cycleTime: 15 }
      });
    });
    
    it('updates position immutably', () => {
      const original = processBlock.create({
        id: 'process1',
        name: 'Process 1',
        position: { x: 10, y: 20 }
      });
      
      const updated = processBlock.update(original, {
        position: { x: 30, y: 40 }
      });
      
      expect(updated.position).not.toBe(original.position);
      expect(updated.position).toEqual({ x: 30, y: 40 });
    });
    
    it('updates metrics and recalculates cycleTime', () => {
      const original = processBlock.create({
        id: 'process1',
        name: 'Process 1',
        metrics: { processTime: 5, waitTime: 10 }
      });
      
      const updated = processBlock.update(original, {
        metrics: { processTime: 15 }
      });
      
      expect(updated.metrics).not.toBe(original.metrics);
      expect(updated.metrics).toEqual({
        processTime: 15,
        waitTime: 10,
        cycleTime: 25
      });
    });
  });
});