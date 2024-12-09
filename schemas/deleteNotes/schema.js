// deleteNotes/schema.js
export const deleteNoteSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },  // Förväntar oss ett id i path parameters
    },
    required: ['id'],
    additionalProperties: false,
  };
  