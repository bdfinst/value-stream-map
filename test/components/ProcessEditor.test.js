import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import ProcessEditor from '../../src/lib/components/ProcessEditor.svelte';
import '../setup';

describe('ProcessEditor', () => {
  it('updates process properties when form is submitted', async () => {
    // Mock process data and onSave handler
    const process = {
      id: 'process1',
      name: 'Original Name',
      description: 'Original description',
      metrics: {
        processTime: 10,
        waitTime: 5
      }
    };
    
    const onSave = vi.fn();
    const onCancel = vi.fn();
    
    // Render the component
    render(ProcessEditor, {
      process,
      onSave,
      onCancel
    });
    
    // Get form elements
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const processTimeInput = screen.getByLabelText(/process time/i);
    const waitTimeInput = screen.getByLabelText(/wait time/i);
    
    // Change input values
    await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });
    await fireEvent.input(descriptionInput, { target: { value: 'Updated description' } });
    await fireEvent.input(processTimeInput, { target: { value: '20' } });
    await fireEvent.input(waitTimeInput, { target: { value: '10' } });
    
    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save/i });
    await fireEvent.click(saveButton);
    
    // Check that onSave was called with updated process
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      id: 'process1',
      name: 'Updated Name',
      description: 'Updated description',
      metrics: {
        processTime: 20,
        waitTime: 10
      }
    });
  });
});