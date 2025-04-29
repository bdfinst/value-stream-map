import { describe, it, expect } from 'vitest';
import connection from '../../src/lib/valueStream/connection.js';

describe('connection', () => {
  describe('create', () => {
    it('creates a connection with required properties', () => {
      const conn = connection.create({
        id: 'conn1',
        sourceId: 'process1',
        targetId: 'process2'
      });
      
      expect(conn).toEqual({
        id: 'conn1',
        sourceId: 'process1',
        targetId: 'process2',
        path: [],
        metrics: {
          transferTime: 0,
          batchSize: 1
        }
      });
    });
    
    it('creates a connection with custom properties', () => {
      const path = [[10, 20], [30, 40]];
      const metrics = { transferTime: 5, batchSize: 10 };
      
      const conn = connection.create({
        id: 'conn1',
        sourceId: 'process1',
        targetId: 'process2',
        path,
        metrics
      });
      
      expect(conn).toEqual({
        id: 'conn1',
        sourceId: 'process1',
        targetId: 'process2',
        path: [[10, 20], [30, 40]],
        metrics: {
          transferTime: 5,
          batchSize: 10
        }
      });
      
      // Ensure deep copies were made
      expect(conn.path).not.toBe(path);
      expect(conn.metrics).not.toBe(metrics);
    });
  });
  
  describe('update', () => {
    it('updates connection properties immutably', () => {
      const original = connection.create({
        id: 'conn1',
        sourceId: 'process1',
        targetId: 'process2'
      });
      
      const updated = connection.update(original, {
        targetId: 'process3'
      });
      
      expect(updated).not.toBe(original);
      expect(updated.targetId).toBe('process3');
      expect(updated.sourceId).toBe('process1'); // Unchanged
    });
    
    it('updates path immutably', () => {
      const original = connection.create({
        id: 'conn1',
        sourceId: 'process1',
        targetId: 'process2',
        path: [[10, 20]]
      });
      
      const newPath = [[30, 40], [50, 60]];
      const updated = connection.update(original, {
        path: newPath
      });
      
      expect(updated.path).not.toBe(original.path);
      expect(updated.path).not.toBe(newPath);
      expect(updated.path).toEqual(newPath);
    });
    
    it('updates metrics immutably', () => {
      const original = connection.create({
        id: 'conn1',
        sourceId: 'process1',
        targetId: 'process2',
        metrics: { transferTime: 5, batchSize: 1 }
      });
      
      const updated = connection.update(original, {
        metrics: { transferTime: 10 }
      });
      
      expect(updated.metrics).not.toBe(original.metrics);
      expect(updated.metrics).toEqual({
        transferTime: 10,
        batchSize: 1
      });
    });
  });
});