/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TextInput } from '../TextInput';
import { FormField } from '@/lib/types';

// Helper to create test field
function createTextField(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'text-field-1',
    type: 'text',
    label: 'Test Text Field',
    required: false,
    ...overrides,
  };
}

describe('TextInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('id', 'text-field-1');
  });

  it('displays field label correctly', () => {
    const field = createTextField({ label: 'Email Address' });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('shows required indicator when field is required', () => {
    const field = createTextField({ required: true });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when field is optional', () => {
    const field = createTextField({ required: false });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('displays current value', () => {
    const field = createTextField();
    const testValue = 'Current input value';

    render(
      <TextInput
        field={field}
        value={testValue}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field') as HTMLInputElement;
    expect(input.value).toBe(testValue);
  });

  it('calls onChange when input value changes', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('calls onBlur when input loses focus', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value='test value'
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field');
    fireEvent.blur(input);

    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    const field = createTextField();
    const errorMessage = 'This field is required';

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not display error message when not provided', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    // Should not find any error text elements
    const errorElements = screen.queryAllByText(/error|required|invalid/i);
    expect(errorElements).toHaveLength(0);
  });

  it('applies error styling when error is present', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        error='Error message'
      />
    );

    const input = screen.getByLabelText('Test Text Field');
    expect(input.className).toContain('border-red-500');
  });

  it('applies normal styling when no error', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field');
    expect(input.className).toContain('form-input');
    expect(input.className).not.toContain('border-red-500');
  });

  it('handles empty value correctly', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('handles undefined value correctly', () => {
    const field = createTextField();

    render(
      <TextInput
        field={field}
        value={undefined as any}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('renders as textarea for long text fields', () => {
    const field = createTextField({
      validation: { maxLen: 500 }, // > 100, should render as textarea
    });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const textarea = screen.getByLabelText('Test Text Field');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '4');
  });

  it('shows character count when maxLen is set', () => {
    const field = createTextField({
      validation: { maxLen: 50 },
    });

    render(
      <TextInput
        field={field}
        value='Hello'
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    expect(screen.getByText('5 / 50')).toBeInTheDocument();
  });

  it('supports different field types', () => {
    // Test that component works with text field type
    const field = createTextField({ type: 'text' });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('handles validation maxLen property in field', () => {
    const field = createTextField({
      validation: { maxLen: 100 },
    });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    // Component should render without error even with validation property
    const input = screen.getByLabelText('Test Text Field');
    expect(input).toBeInTheDocument();
  });

  it('shows minimum length help text when minLen is set and no error', () => {
    const field = createTextField({
      validation: { minLen: 10 },
    });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    expect(screen.getByText('Minimum 10 characters')).toBeInTheDocument();
  });

  it('hides minimum length help text when error is present', () => {
    const field = createTextField({
      validation: { minLen: 10 },
    });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        error='Field is required'
      />
    );

    expect(screen.queryByText('Minimum 10 characters')).not.toBeInTheDocument();
    expect(screen.getByText('Field is required')).toBeInTheDocument();
  });

  it('sets correct placeholder from field label', () => {
    const field = createTextField({ label: 'Enter your email' });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Enter your email');
    expect(input).toHaveAttribute('placeholder', 'Enter your email');
  });

  it('sets validation attributes correctly', () => {
    const field = createTextField({
      validation: {
        minLen: 5,
        maxLen: 50,
        pattern: '[a-zA-Z]+',
      },
    });

    render(
      <TextInput
        field={field}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    const input = screen.getByLabelText('Test Text Field');
    expect(input).toHaveAttribute('minLength', '5');
    expect(input).toHaveAttribute('maxLength', '50');
    expect(input).toHaveAttribute('pattern', '[a-zA-Z]+');
  });

  it('toggles between input and textarea based on maxLen', () => {
    const field = createTextField();

    // Test short field (input)
    const { rerender } = render(
      <TextInput
        field={{ ...field, validation: { maxLen: 50 } }}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    let element = screen.getByLabelText('Test Text Field');
    expect(element.tagName).toBe('INPUT');

    // Test long field (textarea)
    rerender(
      <TextInput
        field={{ ...field, validation: { maxLen: 500 } }}
        value=''
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    element = screen.getByLabelText('Test Text Field');
    expect(element.tagName).toBe('TEXTAREA');
    expect(element).toHaveAttribute('rows', '4');
  });
});
