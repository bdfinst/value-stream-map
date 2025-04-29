import { describe, it, expect } from 'vitest';
import { validateConnection } from '../../src/lib/valueStream/connectionEditor.js';

describe('connectionEditor', () => {
  describe('validateConnection', () => {
    it('validates that source and target are different processes', () => {
      // Valid connection (different processes)
      const validConnection = {
        sourceId: 'process1',
        targetId: 'process2',
        metrics: { transferTime: 5, batchSize: 1 }
      };
      
      const validResult = validateConnection(validConnection);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual({});
      
      // Invalid connection (same process)
      const invalidConnection = {
        sourceId: 'process1',
        targetId: 'process1',
        metrics: { transferTime: 5, batchSize: 1 }
      };
      
      const invalidResult = validateConnection(invalidConnection);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.targetId).toBeTruthy();
    });
    
    it('validates that both source and target are specified', () => {
      // Missing source
      const missingSrc = {
        sourceId: '',
        targetId: 'process2',
        metrics: { transferTime: 5, batchSize: 1 }
      };
      
      const resultMissingSrc = validateConnection(missingSrc);
      expect(resultMissingSrc.isValid).toBe(false);
      expect(resultMissingSrc.errors.sourceId).toBeTruthy();
      
      // Missing target
      const missingTgt = {
        sourceId: 'process1',
        targetId: '',
        metrics: { transferTime: 5, batchSize: 1 }
      };
      
      const resultMissingTgt = validateConnection(missingTgt);
      expect(resultMissingTgt.isValid).toBe(false);
      expect(resultMissingTgt.errors.targetId).toBeTruthy();
    });
    
    it('validates metrics are positive numbers', () => {
      // Invalid transfer time
      const invalidTime = {
        sourceId: 'process1',
        targetId: 'process2',
        metrics: { transferTime: -5, batchSize: 1 }
      };
      
      const resultInvalidTime = validateConnection(invalidTime);
      expect(resultInvalidTime.isValid).toBe(false);
      expect(resultInvalidTime.errors['metrics.transferTime']).toBeTruthy();
      
      // Invalid batch size
      const invalidBatch = {
        sourceId: 'process1',
        targetId: 'process2',
        metrics: { transferTime: 5, batchSize: 0 }
      };
      
      const resultInvalidBatch = validateConnection(invalidBatch);
      expect(resultInvalidBatch.isValid).toBe(false);
      expect(resultInvalidBatch.errors['metrics.batchSize']).toBeTruthy();
    });
  });
});