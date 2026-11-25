'use strict';

/**
 * Joi validation middleware factory.
 * Usage: router.post('/path', validate(schema), controller)
 *
 * @param {import('joi').Schema} schema  - Joi schema to validate req.body against
 * @param {'body'|'query'|'params'} [target='body'] - which part of req to validate
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return res.status(422).json({ error: 'Validation failed', details });
    }

    // Replace the target with the validated (and stripped) value
    req[target] = value;
    next();
  };
}

module.exports = validate;
