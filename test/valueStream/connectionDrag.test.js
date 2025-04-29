import { describe, it, expect } from 'vitest';
import { isPointNearProcess, findNearestProcess } from '../../src/lib/valueStream/connectionDrag.js';

describe('connectionDrag', () => {
  describe('isPointNearProcess', () => {
    it('detects when a point is near a process block', () => {
      const process = {
        id: 'process1',
        position: { x: 100, y: 100 }
      };
      
      const blockWidth = 120;
      const blockHeight = 80;
      
      // Point inside the process block
      expect(isPointNearProcess(process, 150, 140, blockWidth, blockHeight)).toBe(true);
      
      // Point near the left edge
      expect(isPointNearProcess(process, 80, 140, blockWidth, blockHeight, 30)).toBe(true);
      
      // Point far from the process
      expect(isPointNearProcess(process, 300, 300, blockWidth, blockHeight)).toBe(false);
    });
  });
  
  describe('findNearestProcess', () => {
    it('finds the nearest process to a point', () => {
      const processes = [
        { id: 'process1', position: { x: 100, y: 100 } },
        { id: 'process2', position: { x: 300, y: 100 } },
        { id: 'process3', position: { x: 500, y: 100 } }
      ];
      
      const blockWidth = 120;
      const blockHeight = 80;
      
      // Point closest to process2
      const result = findNearestProcess(processes, 350, 120, blockWidth, blockHeight);
      expect(result).toBe(processes[1]);
      
      // Point closest to process3 
      const result2 = findNearestProcess(processes, 480, 120, blockWidth, blockHeight, 100);
      expect(result2).toBe(processes[2]);
      
      // Point too far from any process
      const result3 = findNearestProcess(processes, 700, 500, blockWidth, blockHeight, 30);
      expect(result3).toBeNull();
    });
  });
});