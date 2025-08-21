/**
 * @jest-environment jsdom
 */

import { copyToClipboard, isClipboardSupported } from '../clipboard';

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
};

// Mock document.execCommand
const mockExecCommand = jest.fn();

describe('Clipboard Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = '';

    // Reset clipboard mock
    Object.assign(navigator, {
      clipboard: mockClipboard,
    });

    // Mock document.execCommand
    document.execCommand = mockExecCommand;
  });

  describe('copyToClipboard', () => {
    it('should use modern clipboard API when available', async () => {
      // Setup: modern clipboard API available
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true,
      });

      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyToClipboard('test text');

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(mockExecCommand).not.toHaveBeenCalled();
    });

    it('should fallback to execCommand when clipboard API fails', async () => {
      // Setup: clipboard API not available
      Object.assign(navigator, { clipboard: undefined });
      mockExecCommand.mockReturnValue(true);

      const result = await copyToClipboard('test text');

      expect(result).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith('copy');

      // Should create and remove textarea element
      expect(document.body.children.length).toBe(0);
    });

    it('should return false when both methods fail', async () => {
      // Setup: both methods fail
      Object.assign(navigator, { clipboard: undefined });
      mockExecCommand.mockReturnValue(false);

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Setup: clipboard API throws error
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to copy to clipboard:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isClipboardSupported', () => {
    it('should return true when clipboard API is available', () => {
      Object.assign(navigator, { clipboard: mockClipboard });

      const result = isClipboardSupported();

      expect(result).toBe(true);
    });

    it('should return true when execCommand is available', () => {
      Object.assign(navigator, { clipboard: undefined });
      document.execCommand = mockExecCommand;

      const result = isClipboardSupported();

      expect(result).toBe(true);
    });

    it('should return false when neither method is available', () => {
      Object.assign(navigator, { clipboard: undefined });
      // @ts-ignore
      document.execCommand = undefined;

      const result = isClipboardSupported();

      expect(result).toBe(false);
    });
  });
});
