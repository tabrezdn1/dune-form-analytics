// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('dune_forms');

// Create collections with proper indexes
db.createCollection('forms');
db.createCollection('responses');
db.createCollection('analytics');

// Create indexes for better performance
db.forms.createIndex({ "shareSlug": 1 }, { unique: true });
db.forms.createIndex({ "ownerId": 1 });
db.forms.createIndex({ "status": 1 });
db.forms.createIndex({ "createdAt": 1 });

db.responses.createIndex({ "formId": 1 });
db.responses.createIndex({ "submittedAt": 1 });
db.responses.createIndex({ "formId": 1, "submittedAt": -1 });

db.analytics.createIndex({ "_id": 1 }, { unique: true }); // _id == formId

print('Database initialized successfully with indexes');

// Insert a sample form for testing (optional)
const sampleFormId = new ObjectId();
const sampleSlug = 'sample-feedback-form';

db.forms.insertOne({
  _id: sampleFormId,
  title: "Sample Feedback Form",
  description: "A sample form to test the application",
  status: "published",
  shareSlug: sampleSlug,
  fields: [
    {
      id: "f1",
      type: "text",
      label: "What's your name?",
      required: true,
      validation: {
        minLen: 2,
        maxLen: 100
      }
    },
    {
      id: "f2",
      type: "rating",
      label: "How would you rate our service?",
      required: true,
      validation: {
        min: 1,
        max: 5
      }
    },
    {
      id: "f3",
      type: "mcq",
      label: "How did you hear about us?",
      required: false,
      options: [
        { id: "o1", label: "Social Media" },
        { id: "o2", label: "Google Search" },
        { id: "o3", label: "Friend Referral" },
        { id: "o4", label: "Advertisement" }
      ]
    },
    {
      id: "f4",
      type: "checkbox",
      label: "Which features do you like most?",
      required: false,
      options: [
        { id: "c1", label: "Easy to use" },
        { id: "c2", label: "Fast performance" },
        { id: "c3", label: "Good design" },
        { id: "c4", label: "Reliable" }
      ]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Initialize analytics for the sample form
db.analytics.insertOne({
  _id: sampleFormId,
  byField: {
    "f1": { count: 0 },
    "f2": { count: 0, average: 0 },
    "f3": { count: 0, distribution: {} },
    "f4": { count: 0, distribution: {} }
  },
  updatedAt: new Date()
});

print('Sample form created with slug: ' + sampleSlug);
