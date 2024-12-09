const Joi = require('joi');
const createError = require('http-errors');

// Joi-schema för anteckningar
const noteSchema = Joi.object({
  title: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.base': 'Title must be a string.',
      'string.max': 'Title cannot be longer than 50 characters.',
      'any.required': 'Title is required.',
    }),
  text: Joi.string()
    .max(300)
    .required()
    .messages({
      'string.base': 'Text must be a string.',
      'string.max': 'Text cannot be longer than 300 characters.',
      'any.required': 'Text is required.',
    }),
});

// Joi-schema för login (användarnamn och lösenord)
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.base': 'Password must be a string.',
    'string.min': 'Password must be at least 8 characters long.',
    'any.required': 'Password is required.',
  }),
});

// Joi-schema för signUp (användarnamn, email, och lösenord)
const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.base': 'Password must be a string.',
    'string.min': 'Password must be at least 8 characters long.',
    'any.required': 'Password is required.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'string.base': 'Confirm Password must be a string.',
    'any.required': 'Confirm Password is required.',
    'any.only': 'Confirm Password must match the Password.',
  }),
});

// Middleware för att validera anteckningar
const validateNote = async (event) => {
  const { error } = noteSchema.validate(JSON.parse(event.body));

  if (error) {
    throw createError(400, error.details[0].message); // 400 om felaktig data
  }

  return event; // Fortsätt om valideringen är korrekt
};

// Middleware för att validera login
const validateLogin = async (event) => {
  const { email, password } = JSON.parse(event.body);
  const { error } = loginSchema.validate({ email, password });

  if (error) {
    throw createError(400, error.details[0].message); // 400 om felaktig inloggningsdata
  }

  return event; // Fortsätt om valideringen är korrekt
};

// Middleware för att validera signUp
const validateSignUp = async (event) => {
  const { email, password, confirmPassword } = JSON.parse(event.body);
  const { error } = signUpSchema.validate({ email, password, confirmPassword });

  if (error) {
    throw createError(400, error.details[0].message); // 400 om felaktig registreringsdata
  }

  return event; // Fortsätt om valideringen är korrekt
};

// Exportera middleware för användning i olika endpoints
module.exports = {
  validateNote,
  validateLogin,
  validateSignUp,
};
