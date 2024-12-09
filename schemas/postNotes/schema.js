export const noteSchema = {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        maxLength: 50,  // Titeln får inte vara längre än 50 tecken
        minLength: 1,   // Titeln kan inte vara tom
      },
      text: {
        type: 'string',
        maxLength: 300,  // Texten får inte vara längre än 300 tecken
        minLength: 1,    // Texten kan inte vara tom
      },
    },
    required: ['title', 'text'],  // Title och text är obligatoriska
    additionalProperties: false,  // Ingen extra data är tillåten
  };
  