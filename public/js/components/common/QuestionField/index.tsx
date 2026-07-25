// @ts-nocheck
/**
 * QuestionsField — Memoized
 */
import React, { memo } from "react";
import InputField from "../InputField";

const QuestionsField = memo(({ section, questions = [], setQuestions }) => {
  const addQuestion = () => {
    const sectionCount = questions.filter((q) => q.section === section).length;
    const nextField = `${section}-${sectionCount + 1}`;

    const defaultFieldType = section === "officeUse" ? "radio" : "text";

    setQuestions([
      ...questions,
      { question: "", fieldType: defaultFieldType, section, field: nextField },
    ]);
  };

  const updateQuestion = (index, key, value) => {
    const updated = [...questions];
    updated[index][key] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4 mt-3">
      {questions
        .filter((q) => q.section === section)
        .map((q, _idx) => {
          const realIndex = questions.indexOf(q);
          return (
            <div key={realIndex} className="p-3 border rounded bg-gray-50">
              <InputField
                label="Question"
                value={q.question}
                onChange={(e) =>
                  updateQuestion(realIndex, "question", e.target.value)
                }
              />
              <div className="mt-2">
                <label className="text-sm font-medium text-primary">Type</label>
                <select
                  value={q.fieldType}
                  onChange={(e) =>
                    updateQuestion(realIndex, "fieldType", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="text">Text</option>
                  <option value="radio">Yes / No (Radio)</option>
                </select>
              </div>
              <button
                type="button"
                className="mt-2 text-red-600 text-sm"
                onClick={() => removeQuestion(realIndex)}
              >
                Remove
              </button>
            </div>
          );
        })}
      <button
        type="button"
        className="px-4 py-2 bg-primary text-white rounded"
        onClick={addQuestion}
      >
        + Add Question
      </button>
    </div>
  );
});

export default QuestionsField;
