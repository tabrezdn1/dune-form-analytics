import { Form, FormField } from './types';

// Constants
const CHANGE_MESSAGES = {
  TITLE: 'Form title changed',
  DESCRIPTION: 'Form description changed',
  FIELD_ADDED: (label: string) => `New field added: "${label}"`,
  FIELD_DELETED: (label: string) => `Field "${label}" deleted`,
  FIELD_TYPE_CHANGED: (label: string, from: string, to: string) =>
    `Field "${label}" type changed from ${from} to ${to}`,
  FIELD_LABEL_CHANGED: (from: string, to: string) =>
    `Field label changed from "${from}" to "${to}"`,
  FIELD_REQUIRED_CHANGED: (label: string) =>
    `Field "${label}" required status changed`,
  FIELD_PLACEHOLDER_CHANGED: (label: string) =>
    `Field "${label}" placeholder changed`,
  FIELD_OPTIONS_CHANGED: (label: string) => `Field "${label}" options changed`,
} as const;

export interface FormChangeAnalysis {
  hasChanges: boolean;
  willResetAnalytics: boolean;
  incompatibleChanges: string[];
  compatibleChanges: string[];
  deletedFields: string[];
  typeChangedFields: { fieldId: string; from: string; to: string }[];
  newFields: string[];
}

// Helper function to deep compare field options
function areOptionsEqual(options1?: any[], options2?: any[]): boolean {
  if (!options1 && !options2) return true;
  if (!options1 || !options2) return false;
  if (options1.length !== options2.length) return false;

  return options1.every((opt1, index) => {
    const opt2 = options2[index];
    return opt1.id === opt2.id && opt1.label === opt2.label;
  });
}

// Helper function to check field compatibility
function checkFieldCompatibility(
  originalField: FormField,
  currentField: FormField,
  analysis: FormChangeAnalysis
): void {
  // Check for type changes (incompatible)
  if (originalField.type !== currentField.type) {
    analysis.hasChanges = true;
    analysis.willResetAnalytics = true;
    analysis.typeChangedFields.push({
      fieldId: currentField.id,
      from: originalField.type,
      to: currentField.type,
    });
    analysis.incompatibleChanges.push(
      CHANGE_MESSAGES.FIELD_TYPE_CHANGED(
        originalField.label,
        originalField.type,
        currentField.type
      )
    );
    return; // Early return as type change is the most significant
  }

  // Check for label changes (compatible)
  if (originalField.label !== currentField.label) {
    analysis.hasChanges = true;
    analysis.compatibleChanges.push(
      CHANGE_MESSAGES.FIELD_LABEL_CHANGED(
        originalField.label,
        currentField.label
      )
    );
  }

  // Check for required status changes (compatible)
  if (originalField.required !== currentField.required) {
    analysis.hasChanges = true;
    analysis.compatibleChanges.push(
      CHANGE_MESSAGES.FIELD_REQUIRED_CHANGED(currentField.label)
    );
  }

  // Note: Placeholder changes would be handled here if FormField had placeholder property
  // Currently FormField doesn't include placeholder, so this check is commented out
  // if (originalField.placeholder !== currentField.placeholder) {
  //   analysis.hasChanges = true
  //   analysis.compatibleChanges.push(
  //     CHANGE_MESSAGES.FIELD_PLACEHOLDER_CHANGED(currentField.label)
  //   )
  // }

  // Check for options changes (compatible)
  if (!areOptionsEqual(originalField.options, currentField.options)) {
    analysis.hasChanges = true;
    analysis.compatibleChanges.push(
      CHANGE_MESSAGES.FIELD_OPTIONS_CHANGED(currentField.label)
    );
  }
}

export function analyzeFormChanges(
  originalForm: Form | null,
  currentTitle: string,
  currentDescription: string,
  currentFields: FormField[]
): FormChangeAnalysis {
  const analysis: FormChangeAnalysis = {
    hasChanges: false,
    willResetAnalytics: false,
    incompatibleChanges: [],
    compatibleChanges: [],
    deletedFields: [],
    typeChangedFields: [],
    newFields: [],
  };

  if (!originalForm) {
    // New form, no analytics to worry about
    return analysis;
  }

  // Check metadata changes (always compatible)
  if (originalForm.title !== currentTitle) {
    analysis.hasChanges = true;
    analysis.compatibleChanges.push(CHANGE_MESSAGES.TITLE);
  }

  if (originalForm.description !== currentDescription) {
    analysis.hasChanges = true;
    analysis.compatibleChanges.push(CHANGE_MESSAGES.DESCRIPTION);
  }

  // Create maps for O(1) field lookups
  const originalFieldMap = new Map<string, FormField>(
    originalForm.fields?.map(field => [field.id, field]) || []
  );

  const currentFieldMap = new Map<string, FormField>(
    currentFields.map(field => [field.id, field])
  );

  // Check current fields against original
  currentFields.forEach(currentField => {
    const originalField = originalFieldMap.get(currentField.id);

    if (!originalField) {
      // New field added (compatible)
      analysis.hasChanges = true;
      analysis.newFields.push(currentField.label);
      analysis.compatibleChanges.push(
        CHANGE_MESSAGES.FIELD_ADDED(currentField.label)
      );
    } else {
      // Check field compatibility
      checkFieldCompatibility(originalField, currentField, analysis);
    }
  });

  // Check for deleted fields (incompatible)
  originalForm.fields?.forEach(originalField => {
    if (!currentFieldMap.has(originalField.id)) {
      analysis.hasChanges = true;
      analysis.willResetAnalytics = true;
      analysis.deletedFields.push(originalField.label);
      analysis.incompatibleChanges.push(
        CHANGE_MESSAGES.FIELD_DELETED(originalField.label)
      );
    }
  });

  return analysis;
}

export function getChangeWarningMessage(analysis: FormChangeAnalysis): {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
} | null {
  if (!analysis.hasChanges) {
    return null;
  }

  if (analysis.willResetAnalytics) {
    return {
      title: '⚠️ Analytics Will Be Reset',
      message: `The following changes will reset your form analytics to zero:\n\n${analysis.incompatibleChanges.join('\n')}`,
      severity: 'warning',
    };
  }

  if (analysis.compatibleChanges.length > 0) {
    return {
      title: '✅ Analytics Will Be Preserved',
      message: 'Your changes will not affect existing analytics data.',
      severity: 'info',
    };
  }

  return null;
}
