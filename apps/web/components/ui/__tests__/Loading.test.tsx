/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Loading, Skeleton, LoadingOverlay } from '../Loading';

describe('Loading Component', () => {
  describe('Loading spinner component', () => {
    it('renders with default props (medium spinner)', () => {
      render(<Loading />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-8', 'h-8', 'animate-spin');
    });

    it('renders different sizes correctly', () => {
      const { rerender } = render(<Loading size='sm' />);
      let svg = document.querySelector('svg')!;
      expect(svg).toHaveClass('w-4', 'h-4');

      rerender(<Loading size='md' />);
      svg = document.querySelector('svg')!;
      expect(svg).toHaveClass('w-8', 'h-8');

      rerender(<Loading size='lg' />);
      svg = document.querySelector('svg')!;
      expect(svg).toHaveClass('w-12', 'h-12');
    });

    it('renders spinner variant (default)', () => {
      render(<Loading variant='spinner' />);

      const svg = document.querySelector('svg')!;
      expect(svg).toBeInTheDocument();

      // Check for spinner-specific elements
      const circle = svg.querySelector('circle');
      const path = svg.querySelector('path');
      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
    });

    it('renders dots variant correctly', () => {
      render(<Loading variant='dots' />);

      // Should have 3 dots
      const dotsContainer = document.querySelector('.flex.space-x-1');
      expect(dotsContainer).toBeInTheDocument();

      const dots = dotsContainer!.querySelectorAll('.rounded-full');
      expect(dots).toHaveLength(3);

      // Check sizes for different props
      const { rerender } = render(<Loading variant='dots' size='sm' />);
      let dotElements = document.querySelectorAll('.w-1.h-1');
      expect(dotElements.length).toBe(3);

      rerender(<Loading variant='dots' size='lg' />);
      dotElements = document.querySelectorAll('.w-3.h-3');
      expect(dotElements.length).toBe(3);
    });

    it('renders pulse variant correctly', () => {
      render(<Loading variant='pulse' size='lg' />);

      const pulseElement = document.querySelector(
        '.bg-primary-600.rounded-full.animate-pulse'
      )!;
      expect(pulseElement).toHaveClass(
        'w-12',
        'h-12',
        'bg-primary-600',
        'rounded-full',
        'animate-pulse'
      );
    });

    it('displays text when provided', () => {
      const testText = 'Loading data...';
      render(<Loading text={testText} />);

      expect(screen.getByText(testText)).toBeInTheDocument();
      expect(screen.getByText(testText)).toHaveClass('animate-pulse');
    });

    it('does not display text when not provided', () => {
      render(<Loading />);

      const textElements = screen.queryAllByText(/loading/i);
      expect(textElements).toHaveLength(0);
    });

    it('applies fullScreen styling when enabled', () => {
      render(<Loading fullScreen />);

      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('min-h-screen');
    });

    it('does not apply fullScreen styling by default', () => {
      render(<Loading />);

      const container = document.querySelector(
        '.flex.flex-col.items-center.justify-center'
      );
      expect(container).toBeInTheDocument();
      expect(container).not.toHaveClass('min-h-screen');
    });

    it('applies custom className', () => {
      render(<Loading className='custom-loading-class' />);

      const container = document.querySelector('.custom-loading-class');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('custom-loading-class');
    });

    it('combines fullScreen and custom className', () => {
      render(<Loading fullScreen className='custom-class' />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('min-h-screen', 'custom-class');
    });
  });

  describe('Skeleton component', () => {
    it('renders single row by default', () => {
      render(<Skeleton />);

      const skeletonRows = document.querySelectorAll(
        '.bg-gray-200.dark\\:bg-gray-700'
      );
      expect(skeletonRows).toHaveLength(1);
    });

    it('renders multiple rows when specified', () => {
      render(<Skeleton rows={3} />);

      const skeletonRows = document.querySelectorAll(
        '.bg-gray-200.dark\\:bg-gray-700'
      );
      expect(skeletonRows).toHaveLength(3);
    });

    it('applies custom className', () => {
      render(<Skeleton className='custom-skeleton' />);

      const container = document.querySelector('.custom-skeleton');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('custom-skeleton', 'animate-pulse');
    });

    it('forwards additional props', () => {
      render(
        <Skeleton data-testid='skeleton-element' title='Loading skeleton' />
      );

      const skeleton = screen.getByTestId('skeleton-element');
      expect(skeleton).toHaveAttribute('title', 'Loading skeleton');
    });

    it('applies spacing between multiple rows', () => {
      render(<Skeleton rows={3} />);

      const skeletonRows = document.querySelectorAll(
        '.bg-gray-200.dark\\:bg-gray-700'
      );

      // Check that rows after the first have margin-top
      expect(skeletonRows[1]).toHaveClass('mt-2');
      expect(skeletonRows[2]).toHaveClass('mt-2');
      expect(skeletonRows[0]).not.toHaveClass('mt-2');
    });
  });

  describe('LoadingOverlay component', () => {
    it('renders children when not loading', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div>Content to show</div>
        </LoadingOverlay>
      );

      expect(screen.getByText('Content to show')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('renders loading overlay when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content to show</div>
        </LoadingOverlay>
      );

      expect(screen.getByText('Content to show')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders custom loading text', () => {
      const customText = 'Saving your data...';
      render(
        <LoadingOverlay isLoading={true} text={customText}>
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByText(customText)).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('applies overlay styling when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );

      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('absolute', 'inset-0', 'z-50');
    });

    it('has relative positioning container', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div>Content</div>
        </LoadingOverlay>
      );

      const container = document.querySelector('.relative');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('relative');
    });

    it('toggles loading state correctly', () => {
      const { rerender } = render(
        <LoadingOverlay isLoading={false}>
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      rerender(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      rerender(
        <LoadingOverlay isLoading={false}>
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Animation and styling integration', () => {
    it('applies correct animation classes for all variants', () => {
      const { rerender } = render(<Loading variant='spinner' />);
      let element = document.querySelector('svg')!;
      expect(element).toHaveClass('animate-spin');

      rerender(<Loading variant='dots' />);
      const dots = document.querySelectorAll('.animate-pulse');
      expect(dots.length).toBeGreaterThan(0);

      rerender(<Loading variant='pulse' />);
      element = document.querySelector('.animate-pulse')!;
      expect(element).toHaveClass('animate-pulse');
    });

    it('maintains consistent container classes across variants', () => {
      const variants: Array<'spinner' | 'dots' | 'pulse'> = [
        'spinner',
        'dots',
        'pulse',
      ];

      variants.forEach(variant => {
        const { unmount } = render(<Loading variant={variant} />);

        const container = document.querySelector(
          '.flex.flex-col.items-center.justify-center'
        );
        expect(container).toHaveClass(
          'flex',
          'flex-col',
          'items-center',
          'justify-center'
        );

        // Clean up for next variant
        unmount();
      });
    });

    it('applies different dot animation delays', () => {
      render(<Loading variant='dots' />);

      const dots = document.querySelectorAll('.rounded-full.animate-pulse');

      // Check that dots have different animation delays
      const delays = Array.from(dots).map(
        dot => (dot as HTMLElement).style.animationDelay
      );
      expect(delays).toEqual(['0s', '0.1s', '0.2s']);
    });
  });
});
