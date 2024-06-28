import React from 'react';

const ContactForm = ({
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    errors,
  }) => (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleChange}
        onBlur={handleBlur}
        value={values.name}
        name="named"
      />
      {errors.name && <div>{errors.name}</div>}
      <button type="submit">Submit</button>
    </form>
  );

export default ContactForm;
