export const noteResponseSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$',  // UUID-format
        },
        title: {
          type: 'string',
          maxLength: 50,
        },
        text: {
          type: 'string',
          maxLength: 300,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',  // ISO8601-format (t.ex. "2024-01-01T12:00:00Z")
        },
        modifiedAt: {
          type: 'string',
          format: 'date-time',
        },
        user: {
          type: 'string',
        },
      },
      required: ['id', 'title', 'text', 'createdAt', 'modifiedAt', 'user'],
      additionalProperties: false,  // Ingen extra data tillåts
    },
  };
  