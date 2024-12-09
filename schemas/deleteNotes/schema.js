export const deleteNoteSchema = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$',  // UUID-format
      },
    },
    required: ['id'],  // `id` är obligatoriskt
    additionalProperties: false,  // Ingen extra data tillåts
  };