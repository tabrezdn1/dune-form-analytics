import {
  analyzeFormChanges,
  getChangeWarningMessage,
} from '../form-change-analyzer';
import { Form, FormField } from '../types';

// Helper to create test forms
function createTestForm(overrides: Partial<Form> = {}): Form {
  return {
    id: 'test-form-id',
    ownerId: 'test-user',
    title: 'Test Form',
    description: 'Test Description',
    status: 'published',
    shareSlug: 'test-slug',
    fields: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Helper to create test fields
function createTestField(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'field-1',
    type: 'text',
    label: 'Test Field',
    required: false,
    ...overrides,
  };
}

describe('Form Change Analyzer', () => {
  describe('analyzeFormChanges', () => {
    it('should return no changes for new form (no original)', () => {
      const currentFields = [createTestField()];

      const analysis = analyzeFormChanges(
        null, // No original form
        'New Form',
        'New Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(false);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.incompatibleChanges).toHaveLength(0);
      expect(analysis.compatibleChanges).toHaveLength(0);
      expect(analysis.deletedFields).toHaveLength(0);
      expect(analysis.newFields).toHaveLength(0);
    });

    it('should detect title changes as compatible', () => {
      const originalForm = createTestForm({
        title: 'Old Title',
        fields: [createTestField()],
      });

      const analysis = analyzeFormChanges(
        originalForm,
        'New Title', // Changed title
        'Test Description',
        [createTestField()]
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.compatibleChanges).toContain('Form title changed');
      expect(analysis.incompatibleChanges).toHaveLength(0);
    });

    it('should detect description changes as compatible', () => {
      const originalForm = createTestForm({
        description: 'Old Description',
        fields: [createTestField()],
      });

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'New Description', // Changed description
        [createTestField()]
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.compatibleChanges).toContain('Form description changed');
      expect(analysis.incompatibleChanges).toHaveLength(0);
    });

    it('should detect new fields as compatible', () => {
      const originalForm = createTestForm({
        fields: [createTestField({ id: 'field-1', label: 'Original Field' })],
      });

      const currentFields = [
        createTestField({ id: 'field-1', label: 'Original Field' }),
        createTestField({ id: 'field-2', label: 'New Field' }),
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.newFields).toContain('New Field');
      expect(analysis.compatibleChanges).toContain(
        'New field added: "New Field"'
      );
    });

    it('should detect deleted fields as incompatible (resets analytics)', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({ id: 'field-1', label: 'Keep Field' }),
          createTestField({ id: 'field-2', label: 'Delete Field' }),
        ],
      });

      const currentFields = [
        createTestField({ id: 'field-1', label: 'Keep Field' }),
        // field-2 is deleted
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(true);
      expect(analysis.deletedFields).toContain('Delete Field');
      expect(analysis.incompatibleChanges).toContain(
        'Field "Delete Field" deleted'
      );
    });

    it('should detect field type changes as incompatible (resets analytics)', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({ id: 'field-1', type: 'text', label: 'Test Field' }),
        ],
      });

      const currentFields = [
        createTestField({ id: 'field-1', type: 'mcq', label: 'Test Field' }), // Type changed
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(true);
      expect(analysis.typeChangedFields).toEqual([
        { fieldId: 'field-1', from: 'text', to: 'mcq' },
      ]);
      expect(analysis.incompatibleChanges).toContain(
        'Field "Test Field" type changed from text to mcq'
      );
    });

    it('should detect field label changes as compatible', () => {
      const originalForm = createTestForm({
        fields: [createTestField({ id: 'field-1', label: 'Old Label' })],
      });

      const currentFields = [
        createTestField({ id: 'field-1', label: 'New Label' }),
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.compatibleChanges).toContain(
        'Field label changed from "Old Label" to "New Label"'
      );
    });

    it('should detect required status changes as compatible', () => {
      const originalForm = createTestForm({
        fields: [createTestField({ id: 'field-1', required: false })],
      });

      const currentFields = [
        createTestField({ id: 'field-1', required: true }), // Required changed
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.compatibleChanges).toContain(
        'Field "Test Field" required status changed'
      );
    });

    it('should detect options changes as compatible', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({
            id: 'field-1',
            type: 'mcq',
            options: [
              { id: 'opt-1', label: 'Option 1' },
              { id: 'opt-2', label: 'Option 2' },
            ],
          }),
        ],
      });

      const currentFields = [
        createTestField({
          id: 'field-1',
          type: 'mcq',
          options: [
            { id: 'opt-1', label: 'Option 1' },
            { id: 'opt-2', label: 'Updated Option 2' }, // Changed label
          ],
        }),
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.compatibleChanges).toContain(
        'Field "Test Field" options changed'
      );
    });

    it('should handle multiple change types correctly', () => {
      const originalForm = createTestForm({
        title: 'Old Title',
        description: 'Old Description',
        fields: [
          createTestField({ id: 'field-1', label: 'Keep Field' }),
          createTestField({ id: 'field-2', label: 'Delete Field' }),
          createTestField({
            id: 'field-3',
            type: 'text',
            label: 'Change Type Field',
          }),
        ],
      });

      const currentFields = [
        createTestField({ id: 'field-1', label: 'Updated Keep Field' }), // Label change
        // field-2 deleted
        createTestField({
          id: 'field-3',
          type: 'mcq',
          label: 'Change Type Field',
        }), // Type change
        createTestField({ id: 'field-4', label: 'New Field' }), // New field
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'New Title',
        'New Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(true); // Because of deletion and type change

      // Should have both compatible and incompatible changes
      expect(analysis.compatibleChanges.length).toBeGreaterThan(0);
      expect(analysis.incompatibleChanges.length).toBeGreaterThan(0);

      // Check specific changes
      expect(analysis.deletedFields).toContain('Delete Field');
      expect(analysis.newFields).toContain('New Field');
      expect(analysis.typeChangedFields).toEqual([
        { fieldId: 'field-3', from: 'text', to: 'mcq' },
      ]);
    });

    it('should return no changes for identical forms', () => {
      const field = createTestField();
      const originalForm = createTestForm({ fields: [field] });

      const analysis = analyzeFormChanges(
        originalForm,
        originalForm.title,
        originalForm.description || '',
        [field]
      );

      expect(analysis.hasChanges).toBe(false);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.compatibleChanges).toHaveLength(0);
      expect(analysis.incompatibleChanges).toHaveLength(0);
    });

    it('should handle forms with no fields', () => {
      const originalForm = createTestForm({ fields: [] });

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        []
      );

      expect(analysis.hasChanges).toBe(false);
      expect(analysis.willResetAnalytics).toBe(false);
    });

    it('should handle complex option comparisons', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({
            type: 'mcq',
            options: [
              { id: 'opt-1', label: 'Option A' },
              { id: 'opt-2', label: 'Option B' },
              { id: 'opt-3', label: 'Option C' },
            ],
          }),
        ],
      });

      // Different scenarios for options
      const scenarios = [
        {
          name: 'options reordered',
          options: [
            { id: 'opt-2', label: 'Option B' },
            { id: 'opt-1', label: 'Option A' },
            { id: 'opt-3', label: 'Option C' },
          ],
          shouldHaveChanges: true,
        },
        {
          name: 'option added',
          options: [
            { id: 'opt-1', label: 'Option A' },
            { id: 'opt-2', label: 'Option B' },
            { id: 'opt-3', label: 'Option C' },
            { id: 'opt-4', label: 'Option D' },
          ],
          shouldHaveChanges: true,
        },
        {
          name: 'option removed',
          options: [
            { id: 'opt-1', label: 'Option A' },
            { id: 'opt-2', label: 'Option B' },
          ],
          shouldHaveChanges: true,
        },
      ];

      scenarios.forEach(scenario => {
        const currentFields = [
          createTestField({
            type: 'mcq',
            options: scenario.options,
          }),
        ];

        const analysis = analyzeFormChanges(
          originalForm,
          'Test Form',
          'Test Description',
          currentFields
        );

        expect(analysis.hasChanges).toBe(scenario.shouldHaveChanges);
        if (scenario.shouldHaveChanges) {
          expect(analysis.compatibleChanges).toContain(
            'Field "Test Field" options changed'
          );
        }
      });
    });
  });

  describe('getChangeWarningMessage', () => {
    it('should return null for no changes', () => {
      const analysis = {
        hasChanges: false,
        willResetAnalytics: false,
        incompatibleChanges: [],
        compatibleChanges: [],
        deletedFields: [],
        typeChangedFields: [],
        newFields: [],
      };

      const result = getChangeWarningMessage(analysis);
      expect(result).toBeNull();
    });

    it('should return warning for incompatible changes', () => {
      const analysis = {
        hasChanges: true,
        willResetAnalytics: true,
        incompatibleChanges: [
          'Field "Test Field" deleted',
          'Field "Another Field" type changed from text to mcq',
        ],
        compatibleChanges: [],
        deletedFields: ['Test Field'],
        typeChangedFields: [{ fieldId: 'field-2', from: 'text', to: 'mcq' }],
        newFields: [],
      };

      const result = getChangeWarningMessage(analysis);

      expect(result).not.toBeNull();
      expect(result!.title).toBe('⚠️ Analytics Will Be Reset');
      expect(result!.severity).toBe('warning');
      expect(result!.message).toContain('Field "Test Field" deleted');
      expect(result!.message).toContain(
        'Field "Another Field" type changed from text to mcq'
      );
    });

    it('should return info for compatible changes only', () => {
      const analysis = {
        hasChanges: true,
        willResetAnalytics: false,
        incompatibleChanges: [],
        compatibleChanges: [
          'Form title changed',
          'Field label changed from "Old" to "New"',
        ],
        deletedFields: [],
        typeChangedFields: [],
        newFields: [],
      };

      const result = getChangeWarningMessage(analysis);

      expect(result).not.toBeNull();
      expect(result!.title).toBe('✅ Analytics Will Be Preserved');
      expect(result!.severity).toBe('info');
      expect(result!.message).toBe(
        'Your changes will not affect existing analytics data.'
      );
    });

    it('should prioritize incompatible changes over compatible ones', () => {
      const analysis = {
        hasChanges: true,
        willResetAnalytics: true,
        incompatibleChanges: ['Field deleted'],
        compatibleChanges: ['Form title changed'],
        deletedFields: ['Test Field'],
        typeChangedFields: [],
        newFields: [],
      };

      const result = getChangeWarningMessage(analysis);

      expect(result!.severity).toBe('warning');
      expect(result!.title).toBe('⚠️ Analytics Will Be Reset');
    });
  });

  describe('Edge cases and complex scenarios', () => {
    it('should handle fields with validation changes (compatible)', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({
            id: 'field-1',
            type: 'text',
            validation: { maxLen: 100 },
          }),
        ],
      });

      const currentFields = [
        createTestField({
          id: 'field-1',
          type: 'text',
          validation: { maxLen: 200 }, // Validation changed
        }),
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      // Validation changes are not explicitly tracked as incompatible
      expect(analysis.willResetAnalytics).toBe(false);
    });

    it('should handle empty options arrays correctly', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({
            type: 'mcq',
            options: [],
          }),
        ],
      });

      const currentFields = [
        createTestField({
          type: 'mcq',
          options: [{ id: 'opt-1', label: 'New Option' }],
        }),
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(false);
      expect(analysis.compatibleChanges).toContain(
        'Field "Test Field" options changed'
      );
    });

    it('should handle fields without options correctly', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({
            type: 'text', // Text fields don't have options
          }),
        ],
      });

      const currentFields = [
        createTestField({
          type: 'text',
        }),
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(false);
    });

    it('should handle mixed field operations in one change', () => {
      const originalForm = createTestForm({
        title: 'Old Title',
        fields: [
          createTestField({
            id: 'field-1',
            label: 'Keep Field',
            required: false,
          }),
          createTestField({ id: 'field-2', label: 'Delete Field' }),
          createTestField({
            id: 'field-3',
            type: 'text',
            label: 'Change Type',
          }),
        ],
      });

      const currentFields = [
        createTestField({ id: 'field-1', label: 'Keep Field', required: true }), // Required change
        // field-2 deleted
        createTestField({
          id: 'field-3',
          type: 'rating',
          label: 'Change Type',
        }), // Type change
        createTestField({ id: 'field-4', label: 'New Field' }), // New field
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'New Title', // Title change
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(true); // Due to deletion and type change

      // Should track all changes
      expect(analysis.compatibleChanges).toEqual(
        expect.arrayContaining([
          'Form title changed',
          'Field "Keep Field" required status changed',
          'New field added: "New Field"',
        ])
      );

      expect(analysis.incompatibleChanges).toEqual(
        expect.arrayContaining([
          'Field "Delete Field" deleted',
          'Field "Change Type" type changed from text to rating',
        ])
      );
    });

    it('should handle identical option arrays correctly', () => {
      const options = [
        { id: 'opt-1', label: 'Option 1' },
        { id: 'opt-2', label: 'Option 2' },
      ];

      const originalForm = createTestForm({
        fields: [createTestField({ type: 'mcq', options })],
      });

      const currentFields = [
        createTestField({ type: 'mcq', options: [...options] }), // Same options
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(false);
      expect(analysis.compatibleChanges).not.toContain(
        expect.stringMatching(/options changed/)
      );
    });

    it('should prioritize type changes over other field changes', () => {
      const originalForm = createTestForm({
        fields: [
          createTestField({
            id: 'field-1',
            type: 'text',
            label: 'Old Label',
            required: false,
          }),
        ],
      });

      const currentFields = [
        createTestField({
          id: 'field-1',
          type: 'mcq', // Type changed (should cause early return)
          label: 'New Label', // This change should not be tracked due to early return
          required: true,
        }),
      ];

      const analysis = analyzeFormChanges(
        originalForm,
        'Test Form',
        'Test Description',
        currentFields
      );

      expect(analysis.hasChanges).toBe(true);
      expect(analysis.willResetAnalytics).toBe(true);
      expect(analysis.typeChangedFields).toHaveLength(1);

      // Due to early return on type change, other changes should not be tracked
      expect(analysis.compatibleChanges).not.toContain(
        expect.stringMatching(/label changed/)
      );
      expect(analysis.compatibleChanges).not.toContain(
        expect.stringMatching(/required status/)
      );
    });
  });
});
