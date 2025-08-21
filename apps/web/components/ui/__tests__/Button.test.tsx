/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Primary Button</Button>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('hover:bg-blue-700');
  });

  it('applies secondary variant styles when specified', () => {
    render(<Button variant='secondary'>Secondary Button</Button>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-gray-200');
    expect(button).toHaveClass('text-gray-900');
    expect(button).toHaveClass('hover:bg-gray-300');
  });

  it('applies danger variant styles when specified', () => {
    render(<Button variant='danger'>Danger Button</Button>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-red-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('hover:bg-red-700');
  });

  it('applies different size classes', () => {
    render(
      <div>
        <Button size='sm'>Small</Button>
        <Button size='md'>Medium</Button>
        <Button size='lg'>Large</Button>
      </div>
    );

    expect(screen.getByRole('button', { name: /small/i })).toHaveClass(
      'px-3 py-1.5 text-sm'
    );
    expect(screen.getByRole('button', { name: /medium/i })).toHaveClass(
      'px-4 py-2 text-sm'
    );
    expect(screen.getByRole('button', { name: /large/i })).toHaveClass(
      'px-6 py-3 text-base'
    );
  });

  it('applies custom className', () => {
    render(<Button className='custom-class'>Custom Button</Button>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('custom-class');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:cursor-not-allowed');
  });

  it('forwards additional props', () => {
    render(
      <Button data-testid='custom-button' title='Tooltip'>
        Button
      </Button>
    );

    const button = screen.getByTestId('custom-button');

    expect(button).toHaveAttribute('title', 'Tooltip');
  });

  it('applies base classes to all variants', () => {
    render(<Button>Test Button</Button>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('justify-center');
    expect(button).toHaveClass('font-medium');
    expect(button).toHaveClass('rounded-md');
    expect(button).toHaveClass('focus:outline-none');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('transition-colors');
  });
});
