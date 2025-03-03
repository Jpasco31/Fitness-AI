import { forwardRef, ReactNode, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Exercise } from "@/shared/types/exerciseTypes";
import { Input } from "@/shared/components/ui/input";

interface ExerciseSetProps {
  exercise: Exercise;
  isActive: boolean;
  onExpand: () => void;
  onToggle: () => void;
  onDeleteExercise: () => void;
  onAddChildExercise: () => void;
  onUpdateExercise: (updatedExercise: Exercise) => void;
  children?: ReactNode;
}

export const ExerciseSet = forwardRef<HTMLDivElement, ExerciseSetProps>(
  (
    {
      exercise,
      isActive,
      onExpand,
      onToggle,
      onDeleteExercise,
      onAddChildExercise,
      onUpdateExercise,
      children,
    },
    ref,
  ) => {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState(exercise.notes);

    // States for editing the exercise itself
    const [editingExercise, setEditingExercise] = useState(false);
    const [tempExerciseName, setTempExerciseName] = useState(exercise.name);
    const [tempExerciseDescription, setTempExerciseDescription] = useState(
      exercise.description,
    );

    // State for adding a new metric
    const [isAddingMetric, setIsAddingMetric] = useState(false);
    const [newMetricKey, setNewMetricKey] = useState("");
    const [newMetricValue, setNewMetricValue] = useState("");

    // State for editing an existing metric by key
    const [editingMetricKey, setEditingMetricKey] = useState<string | null>(
      null,
    );
    const [tempMetricKey, setTempMetricKey] = useState("");
    const [tempMetricValue, setTempMetricValue] = useState("");

    useEffect(() => {
      setTempNotes(exercise.notes);
    }, [exercise.notes]);

    useEffect(() => {
      if (!isActive) {
        setIsEditingNotes(false);
        setEditingMetricKey(null);
        setIsAddingMetric(false);
      }
    }, [isActive]);

    const handleNotesSave = () => {
      const updatedExercise: Exercise = {
        ...exercise,
        notes: tempNotes,
      };
      onUpdateExercise(updatedExercise);
      setIsEditingNotes(false);
    };

    const handleNotesCancel = () => {
      setTempNotes(exercise.notes);
      setIsEditingNotes(false);
    };

    const handleMetricClick = (key: string, value: string) => {
      // If we're already editing this metric, clicking again cancels editing
      if (editingMetricKey === key) {
        setEditingMetricKey(null);
      } else {
        // Start editing this metric
        setEditingMetricKey(key);
        setTempMetricKey(key);
        setTempMetricValue(value);
      }
    };

    const handleSaveMetric = () => {
      if (editingMetricKey === null) return;

      let key = tempMetricKey.trim();
      let value = tempMetricValue; // Keep empty string if empty
      // If key is empty, set key to null
      const metricKey = key === "" ? null : key;

      const updatedMetrics = { ...(exercise.metrics || {}) };

      // Remove old key if changed
      if (metricKey !== editingMetricKey) {
        delete updatedMetrics[editingMetricKey];
      }

      if (metricKey === null) {
        // If key is null, we don't add it back
        // effectively deleting this metric
      } else {
        // If the value is empty string, just keep it as empty string
        // (no conversion to null needed)
        updatedMetrics[metricKey] = value;
      }

      const updatedExercise: Exercise = {
        ...exercise,
        metrics: updatedMetrics,
      };

      onUpdateExercise(updatedExercise);
      setEditingMetricKey(null);
    };

    const handleCancelMetricEdit = () => {
      setEditingMetricKey(null);
    };

    const handleAddMetricSubmit = () => {
      let key = newMetricKey.trim();
      let value = newMetricValue; // keep empty string if empty
      const metricKey = key === "" ? null : key;

      const updatedMetrics = { ...(exercise.metrics || {}) };

      if (metricKey === null) {
        // If no valid key, don't add anything
      } else {
        // Add or update the metric with given key and value
        updatedMetrics[metricKey] = value;
      }

      const updatedExercise: Exercise = {
        ...exercise,
        metrics: updatedMetrics,
      };

      onUpdateExercise(updatedExercise);

      // Reset the form and close it
      setIsAddingMetric(false);
      setNewMetricKey("");
      setNewMetricValue("");
    };

    const handleDeleteMetric = (key: string) => {
      const updatedMetrics = { ...(exercise.metrics || {}) };
      delete updatedMetrics[key];
      const updatedExercise: Exercise = {
        ...exercise,
        metrics: updatedMetrics,
      };
      onUpdateExercise(updatedExercise);
    };

    const handleSaveExercise = () => {
      const updatedExercise: Exercise = {
        ...exercise,
        name: tempExerciseName,
        description: tempExerciseDescription,
      };
      onUpdateExercise(updatedExercise);
      setEditingExercise(false);
    };

    const detailsVariants = {
      hidden: { opacity: 0, height: 0 },
      visible: { opacity: 1, height: "auto" },
      exit: { opacity: 0, height: 0 },
    };

    return (
      <div ref={ref} className="border-b-2 border-b-primary p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          {!editingExercise && (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  size="icon"
                  className={`h-8 w-8 rounded-full border-2 border-secondary text-primary hover:bg-green-700 ${exercise.completed ? "border-green-700 bg-green-700" : ""
                    }`}
                  aria-label={
                    exercise.completed
                      ? "Mark exercise as incomplete"
                      : "Mark exercise as complete"
                  }
                >
                  <motion.span
                    key={exercise.completed ? "completed" : "incomplete"}
                    initial={{
                      rotate: exercise.completed ? 0 : 180,
                      scale: exercise.completed ? 1 : 0.8,
                      opacity: exercise.completed ? 1 : 0,
                    }}
                    animate={{
                      rotate: exercise.completed ? 0 : 180,
                      scale: exercise.completed ? 1 : 0.8,
                      opacity: exercise.completed ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-block"
                  >
                    <Check
                      size={20}
                      strokeWidth={3}
                      className="text-background"
                    />
                  </motion.span>
                </Button>
                <div>
                  <h3 className="text-xl font-semibold" onClick={onExpand}>
                    {exercise.name}
                  </h3>
                  <p className="text-sm text-primary">{exercise.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                {!isActive && (
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-orange-400"
                    onClick={() => setEditingExercise(true)}
                  >
                    <Edit />
                  </Button>
                )}
                <div
                  className="text-primary transition-colors hover:text-orange-400"
                  aria-label={
                    isActive
                      ? "Collapse exercise details"
                      : "Expand exercise details"
                  }
                  onClick={onExpand}
                >
                  {isActive ? (
                    <ChevronUp className="h-6 w-6" />
                  ) : (
                    <ChevronDown className="h-6 w-6" />
                  )}
                </div>
              </div>
            </>
          )}
          {editingExercise && (
            <>
              <div className="flex w-10/12 flex-col gap-2">
                <div className="flex items-center gap-4">
                  <label className="w-3/12 text-sm font-semibold text-primary md:w-2/12">
                    Activity
                  </label>
                  <Input
                    type="text"
                    value={tempExerciseName || ""}
                    onChange={(e) => setTempExerciseName(e.target.value)}
                    className="w-9/12 rounded px-2 py-1 text-sm font-semibold md:w-10/12"
                    placeholder="Exercise Name"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-3/12 text-sm font-semibold text-primary md:w-2/12">
                    Description
                  </label>
                  <Input
                    type="text"
                    value={tempExerciseDescription || ""}
                    onChange={(e) => setTempExerciseDescription(e.target.value)}
                    className="w-9/12 rounded px-2 py-1 text-sm text-primary md:w-10/12"
                    placeholder="Description"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  className="text-primary hover:text-orange-400"
                  onClick={handleSaveExercise}
                >
                  <Save />
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => setEditingExercise(false)}
                >
                  <X />
                </Button>
              </div>
            </>
          )}
        </div>
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="mt-2 space-y-4"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={detailsVariants}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="mt-2 space-y-4">
                {/* Notes Section */}
                <div className="flex items-center justify-between">
                  {isEditingNotes ? (
                    <div className="mr-2 flex-grow">
                      <textarea
                        value={tempNotes || ""}
                        onChange={(e) => setTempNotes(e.target.value)}
                        className="w-full rounded bg-zinc-700 px-2 py-1 text-sm"
                        placeholder="Add notes..."
                        rows={3}
                      />
                    </div>
                  ) : (
                    <p className="text-sm">{exercise.notes}</p>
                  )}
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      isEditingNotes
                        ? handleNotesSave()
                        : setIsEditingNotes(true);
                    }}
                    className="text-primary transition-colors hover:text-orange-400"
                    aria-label={isEditingNotes ? "Save notes" : "Edit notes"}
                    size="icon"
                  >
                    {isEditingNotes ? <Save /> : <Edit />}
                  </Button>
                  {isEditingNotes && (
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotesCancel();
                      }}
                      className="ml-2 text-red-500 transition-colors hover:text-red-700"
                      aria-label="Cancel editing notes"
                      size="icon"
                    >
                      <X />
                    </Button>
                  )}
                </div>

                {/* Metrics Section */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Metrics:</h4>
                  {Object.entries(exercise.metrics || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex cursor-pointer items-center justify-between rounded p-2 text-sm hover:bg-muted"
                        onClick={() => handleMetricClick(key, value)}
                      >
                        {editingMetricKey === key ? (
                          <div
                            className="w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <label
                                  htmlFor={`metric-key-${key}`}
                                  className="text-xs text-gray-300"
                                >
                                  Key
                                </label>
                                <Input
                                  id={`metric-key-${key}`}
                                  type="text"
                                  value={tempMetricKey}
                                  onChange={(e) =>
                                    setTempMetricKey(e.target.value)
                                  }
                                  className="w-full rounded px-2 py-1 text-sm"
                                  placeholder="Metric Key"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label
                                  htmlFor={`metric-value-${key}`}
                                  className="text-xs text-gray-300"
                                >
                                  Value
                                </label>
                                <Input
                                  id={`metric-value-${key}`}
                                  type="text"
                                  value={tempMetricValue}
                                  onChange={(e) =>
                                    setTempMetricValue(e.target.value)
                                  }
                                  className="w-full rounded px-2 py-1 text-sm"
                                  placeholder="Value"
                                />
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveMetric();
                                }}
                                className="text-primary transition-colors hover:text-orange-400"
                                aria-label="Save metric"
                                size="icon"
                              >
                                <Save />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelMetricEdit();
                                }}
                                className="text-red-500 transition-colors hover:text-red-700"
                                aria-label="Cancel editing metric"
                                size="icon"
                              >
                                <X />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMetric(key);
                                }}
                                className="text-red-500 transition-colors hover:text-red-700"
                                aria-label="Delete metric"
                                size="icon"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-grow">
                              <p>
                                <strong>{key}</strong>: {value}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMetric(key);
                              }}
                              className="text-red-500 transition-colors hover:text-red-700"
                              aria-label="Delete metric"
                              size="icon"
                            >
                              <Trash2 />
                            </Button>
                          </>
                        )}
                      </div>
                    ),
                  )}

                  {/* Add new metric form */}
                  {isAddingMetric && (
                    <div className="space-y-2 rounded bg-muted p-4">
                      <h4 className="font-semibold">New Metric</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-300">Key</label>
                          <Input
                            type="text"
                            value={newMetricKey}
                            onChange={(e) => setNewMetricKey(e.target.value)}
                            placeholder="Metric Key"
                            className="rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-300">Value</label>
                          <Input
                            type="text"
                            value={newMetricValue}
                            onChange={(e) => setNewMetricValue(e.target.value)}
                            placeholder="Value"
                            className="rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMetricSubmit();
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingMetric(false);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex w-full justify-between">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteExercise();
                      }}
                      className="mt-2 flex items-center rounded p-2 text-red-500 hover:text-red-400"
                      aria-label="Delete exercise"
                    >
                      <Trash2 strokeWidth={2.75} />
                      Exercise
                    </Button>
                    {!isAddingMetric && (
                      <Button
                        variant="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingMetric(true);
                        }}
                        className="mt-2 flex items-center rounded p-2 text-primary transition-colors hover:bg-muted hover:text-orange-400"
                        aria-label="Add new metric"
                      >
                        <Plus strokeWidth={2.75} />
                        Add Metric
                      </Button>
                    )}
                  </div>
                  <div className="flex w-full justify-end">
                    <Button
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddChildExercise();
                      }}
                      className="mt-2 flex items-center self-end rounded p-2 hover:bg-muted hover:text-orange-400"
                      aria-label="Add child exercise"
                    >
                      <Plus strokeWidth={2.75} />
                      Add Exercise
                    </Button>
                  </div>
                </div>
              </div>

              {/* Render children (if any) under the metrics section */}
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

ExerciseSet.displayName = "ExerciseSet";
