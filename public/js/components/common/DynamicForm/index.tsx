// @ts-nocheck
/**
 * DynamicForm — Memoized
 *
 * Renders a dynamic form from a config array.
 * Wrapped in React.memo for performance when used in modals/lists.
 */
import React, { memo, useEffect, useState } from "react";
import FormField from "../../../features/clients/common/FormField";
import CustomTimePicker from "../CustomTimePicker";
import CustomDatePicker from "../CutomDatePicker";
import InputField from "../InputField";

const DynamicForm = memo(({
  error_message,
  formConfig,
  className = "",
  footer,
  onSubmit,
  initialData = {},
}) => {
  const [formState, setFormState] = useState(
    formConfig.reduce((acc, field) => {
      acc[field.name] = initialData[field.name] || "";
      return acc;
    }, {})
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormState((prev) => ({
        ...prev,
        ...formConfig.reduce((acc, field) => {
          if (
            initialData[field.name] !== undefined ||
            initialData[field.name] !== null
          )
            acc[field.name] = initialData[field.name];
          return acc;
        }, {}),
      }));
    }
  }, [initialData, formConfig]);

  const handleChange = (name, value, field) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (field.onChange) {
      field.onChange?.(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    formConfig.forEach((field) => {
      if (field.required && !formState[field.name]) {
        newErrors[field.name] = `${field.label} is required.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error_message && (
        <div className="text-red py-4 px-1 text-lg text-center font-medium bg-[#F6F6F6] rounded-lg shadow-sm">
          {error_message}
        </div>
      )}
      <div className={`grid ${className} gap-4`}>
        {formConfig.map((field) => {
          const gridClass = field.colSpan || "col-span-1";
          // FIX for [object Object]: Ensure we pass a string, never an object
          const fieldValue = formState[field.name] || "";

          return (
            <div key={field.name} className={gridClass}>
              {(() => {
                switch (field.fieldType) {
                  case "input":
                    return (
                      <InputField
                        id={field.name}
                        label={field.label}
                        value={fieldValue}
                        type={field.type}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value, field)
                        }
                        error={errors[field.name]}
                        disabled={field.disabled}
                      />
                    );

                  case "textarea":
                    return (
                      <FormField
                        type="textarea"
                        label={field.label}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={formState[field.name]}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value, field)
                        }
                        error={errors[field.name]}
                      />
                    );

                  // ADDED: Case for file upload
                  case "file":
                    return (
                      <FormField
                        type="select"
                        label={field.label}
                        name={field.name}
                        options={field.options}
                        placeholder={field.placeholder}
                        value={formState[field.name]}
                        onChange={(value) =>
                          handleChange(field.name, value, field)
                        }
                        error={errors[field.name]}
                      />
                    );

                  case "select":
                  case "search-select":
                    return (
                      <FormField
                        type={field.fieldType}
                        label={field.label}
                        name={field.name}
                        options={field.options}
                        placeholder={field.placeholder}
                        value={formState[field.name]}
                        onChange={(value) =>
                          handleChange(field.name, value, field)
                        }
                        error={errors[field.name]}
                      />
                    );
                  case "checkbox":
                    return (
                      <FormField
                        type="checkbox"
                        label={field.label}
                        name={field.name}
                        value={formState[field.name]}
                        onChange={(value) =>
                          handleChange(field.name, value, field)
                        }
                        error={errors[field.name]}
                      />
                    );
                  case "radio":
                    return (
                      <FormField
                        type="radio"
                        label={field.label}
                        name={field.name}
                        options={field.options}
                        value={formState[field.name]}
                        onChange={(value) =>
                          handleChange(field.name, value, field)
                        }
                        error={errors[field.name]}
                        className={field.className}
                      />
                    );
                  case "datePicker":
                    return (
                      <CustomDatePicker
                        label={field.label}
                        name={field.name}
                        value={formState[field.name]}
                        onChange={(date) =>
                          handleChange(field.name, date, field)
                        }
                        error={errors[field.name]}
                      />
                    );
                  case "timePicker":
                    return (
                      <CustomTimePicker
                        label={field.label}
                        name={field.name}
                        value={formState[field.name]}
                        onChange={(value) =>
                          handleChange(field.name, value, field)
                        }
                        error={errors[field.name]}
                      />
                    );
                  default:
                    return <>{field.children}</>;
                }
              })()}
            </div>
          );
        })}
      </div>
      {footer && <div style={{ marginTop: "1rem" }}>{footer}</div>}
    </form>
  );
});

export default DynamicForm;
