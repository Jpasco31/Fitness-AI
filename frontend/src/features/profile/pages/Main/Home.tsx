// frontend/src/pages/Home.tsx

import { useEffect, useRef, useState } from "react";
import Calendar from "@/features/dashboard/components/dashboard/Calendar";
import { Exercise } from "@/shared/types/exerciseTypes";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle, BotMessageSquare, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import NewExercise from "@/features/dashboard/components/dashboard/NewExercise";
import ExerciseTree from "@/features/dashboard/components/dashboard/exerciseSet/ExerciseTree";
import useStatus from "@/shared/hooks/useStatus";
import { useUser } from "@/shared/hooks/context/UserContext";
import { RetrieveActivities } from "@/shared/services/exercises/RetrieveActivities";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { AddOrUpdateActivities } from "@/shared/services/exercises/AddOrUpdateActivities";
import { toast } from "@/shared/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/ui/card";
import { updateExerciseInTree } from "@/shared/utils/updateExerciseInTree";
import { convertDates, convertDatesFromObject } from "@/shared/utils/convertDates";
import { DeleteActivities } from "@/shared/services/exercises/DeleteActivities";
import {
  addChildToParent,
  flattenExercises,
  getAncestorChainExercises,
  getExerciseById,
  locateNewExercise,
  recalculateAncestorsCompletion,
  removeExerciseFromTree,
  toggleCompletionRecursive,
} from "@/shared/utils/ExerciseHelperFunction";

const Home = () => {
  const [searchParams] = useSearchParams();
  const initialDateParam = searchParams.get("date");
  const initialDate = initialDateParam
    ? new Date(initialDateParam)
    : new Date();

  const { status, setLoading, setDone, setError } = useStatus();
  const { token, refreshToken } = useUser();

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [expandedNodes, setExpandedNodes] = useState<
    Map<number | null | undefined, number>
  >(new Map());

  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const [newExercise, setNewExercise] = useState<{
    name: string;
    type: string;
    parentId: number | null;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastExerciseRef = useRef<HTMLDivElement>(null);
  const prevNewExerciseRef = useRef<typeof newExercise>(null);
  const [noExercises, setNoExercises] = useState<boolean>(false);
  const [rerenderWeekHeader, setRerenderWeekHeader] = useState<boolean>(false);

  // Separate useStatus for updating activities
  const {
    status: updateStatus,
    setLoading: setUpdateLoading,
    setDone: setUpdateDone,
    setError: setUpdateError,
  } = useStatus();

  useEffect(() => {
    if (!prevNewExerciseRef.current && newExercise && inputRef.current) {
      inputRef.current.focus();
    }
    prevNewExerciseRef.current = newExercise;
  }, [newExercise]);

  useEffect(() => {
    const formattedDate = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
    window.history.replaceState(null, "", `?date=${formattedDate}`);

    fetchExercises().then((r) => r);
    setNoExercises(false);
    setNewExercise(null);
  }, [currentDate]);

  useEffect(() => {
    const topLevelExercises = exercises.filter((ex) => {
      const exerciseDate = ex.date?.toISOString().split("T")[0];
      return ex.parent_id === null && exerciseDate === exDate;
    });

    setNoExercises(topLevelExercises.length === 0);
  }, [exercises]);

  const fetchExercises = async () => {
    setLoading();
    refreshToken();
    try {
      const response = await RetrieveActivities({
        token,
        date: currentDate,
      });

      if (!response?.success) {
        setError();
        setResponseMessage(
          "Error " + response.status.toString() + ": " + response?.message ||
          "Failed to retrieve activities",
        );
        return;
      }
      if (response?.success && response?.data) {
        const rawData = response.data as any[];
        if (rawData.length === 0) {
          setNoExercises(true);
          setDone();
          return;
        }

        const formattedExercises = rawData.map(convertDates);
        setExercises(formattedExercises);
        setDone();
        return;
      }
    } catch (error) {
      console.error("Error retrieving activities:", error);
      setError();
    }
  };

  const toggleExerciseCompletion = async (id: number | null | undefined) => {
    refreshToken();
    if (id === null || id === undefined) return;

    const originalExercises = exercises;
    const exercise = getExerciseById(exercises, id);
    if (!exercise) return;

    const newCompletedState = !exercise.completed;
    // Toggle the exercise and all descendants first
    const updatedExerciseTree = toggleCompletionRecursive(
      exercise,
      newCompletedState,
    );

    // Integrate the updated node back into the tree (optimistically)
    let updatedExercises = updateExerciseInTree(exercises, updatedExerciseTree);

    // Recalculate ancestors completion states
    updatedExercises = recalculateAncestorsCompletion(
      updatedExercises,
      updatedExerciseTree.parent_id,
    );

    // Optimistic update
    setExercises(updatedExercises);

    try {
      setUpdateLoading();

      // Gather the toggled exercise plus its ancestor chain
      const exerciseToSend = getExerciseById(updatedExercises, id);
      if (!exerciseToSend) {
        // If not found, revert
        setExercises(originalExercises);
        setUpdateError();
        setResponseMessage("Failed to toggle activity - exercise not found.");
        toast({
          variant: "destructive",
          title: "Failed to toggle activity",
          description: "Could not find the exercise after update.",
          duration: 500,
        });
        return;
      }

      const ancestorsToUpdate = getAncestorChainExercises(
        updatedExercises,
        exerciseToSend.parent_id,
      );
      // Flatten all exercises that need to be updated
      const activitiesToUpdate = flattenExercises([
        exerciseToSend,
        ...ancestorsToUpdate,
      ]);

      // Send updates to backend one by one
      const response = await AddOrUpdateActivities({
        token,
        activities: activitiesToUpdate,
      });

      if (!response.success) {
        // Revert if backend fails
        setExercises(originalExercises);
        setUpdateError();
        setResponseMessage(response.message || "Failed to toggle activity");
        toast({
          variant: "destructive",
          title: "Failed to toggle activity",
          description: response.message || "Failed to toggle activity",
          duration: 500,
        });
        return;
      }

      setRerenderWeekHeader(true);
      setResponseMessage("Activity toggled successfully.");
      setUpdateDone();
      toast({
        title: "Activity toggled successfully.",
        duration: 500,
      });
    } catch (error) {
      console.error("Error toggling activity:", error);
      // Revert on error
      setExercises(originalExercises);
      setUpdateError();
      setResponseMessage(
        "An unexpected error occurred while updating the activity.",
      );
      toast({
        variant: "destructive",
        title: "Failed to toggle activity",
        description:
          "An error occurred while updating the activity. Please try again.",
        duration: 500,
      });
    }
  };

  const toggleNodeExpansion = (
    id: number,
    parentId: number | null | undefined,
  ) => {
    setExpandedNodes((prev) => {
      const newMap = new Map(prev);
      if (newMap.get(parentId) === id) {
        newMap.delete(parentId);
      } else {
        newMap.set(parentId, id);
      }
      return newMap;
    });
  };

  const initiateAddExercise = (parentId: number | null = null) => {
    // If parentId = 0, top-level exercise; otherwise a child exercise
    setNewExercise({ name: "", type: "", parentId });
  };

  const handleNewExerciseNameChange = (name: string) => {
    setNewExercise((prev) => (prev ? { ...prev, name } : null));
  };

  const handleNewExerciseDescriptionChange = (description: string) => {
    setNewExercise((prev) => (prev ? { ...prev, type: description } : null));
  };

  // Modify handleSaveNewExercise to integrate Add or UpdateActivities
  const handleSaveNewExercise = async () => {
    if (
      newExercise &&
      newExercise.name.trim() !== "" &&
      newExercise.type.trim() !== ""
    ) {
      refreshToken();
      const originalExercises = exercises;
      const tempId = Date.now() * 10 + Math.floor(Math.random() * 10);
      const exDate = currentDate.toISOString().split("T")[0];

      let newPosition: number;
      if (newExercise.parentId === null) {
        // Top-level exercise
        const topLevelExercisesForDate = exercises.filter((ex) => {
          const exerciseDate = ex.date?.toISOString().split("T")[0];
          return ex.parent_id === null && exerciseDate === exDate;
        });
        newPosition = topLevelExercisesForDate.length + 1;
      } else {
        // Child exercise
        const parentExercise = getExerciseById(exercises, newExercise.parentId);
        if (!parentExercise) {
          newPosition = 1;
        } else {
          newPosition = parentExercise.children?.length
            ? parentExercise.children.length + 1
            : 1;
        }
      }

      const exerciseToAdd: Exercise = {
        id: tempId, // Temporary ID
        name: newExercise.name.trim(),
        description: newExercise.type.trim(),
        completed: false,
        notes: "",
        metrics: {},
        parent_id: newExercise.parentId,
        date: currentDate,
        children: [],
        position: newPosition,
      };

      // **Step 1: Compute updatedExercises**
      let updatedExercises: Exercise[];
      if (newExercise.parentId !== null) {
        updatedExercises = addChildToParent(
          exercises,
          newExercise.parentId,
          exerciseToAdd,
        );
      } else {
        updatedExercises = [...exercises, exerciseToAdd];
      }

      // Update ancestors' completion states
      updatedExercises = recalculateAncestorsCompletion(
        updatedExercises,
        newExercise.parentId,
      );

      // **Step 2: Set the updatedExercises to state**
      setExercises(updatedExercises);

      // **Step 3: Create flattenedExercises from updatedExercises**
      const flattenedExercises = flattenExercises(updatedExercises);

      // **Step 4: Clear the new exercise form**
      setNewExercise(null);

      try {
        setUpdateLoading();

        // **Step 5: Send the flattened exercises to the backend**
        // Filter out the new exercise using tempId
        const activitiesToUpdate: Exercise[] = [
          { ...exerciseToAdd, id: null }, // New exercise with id set to null
          ...flattenedExercises.filter((ex) => ex.id !== tempId),
        ];

        const response = await AddOrUpdateActivities({
          token,
          activities: activitiesToUpdate,
        });

        if (!response.success) {
          setUpdateError();
          setResponseMessage(response.message || "Failed to add the activity");
          toast({
            variant: "destructive",
            title: "Failed to add activity",
            description: response.message || "Failed to add activity",
            duration: 500,
          });

          setExercises(originalExercises);
          return;
        }

        // Assuming `response.data` is an array of Exercise objects
        const savedExercises = convertDatesFromObject(
          response.data as Exercise[],
        );

        // Replace the temporary exercise in the frontend with the saved one from the backend.
        const newExerciseFromBackend = locateNewExercise(
          savedExercises, // Pass the array of saved exercises
          exerciseToAdd.parent_id!, // Parent ID
          exerciseToAdd.position!, // Position
        );

        if (newExerciseFromBackend) {
          // Function to replace the temporary exercise with the saved one
          const replaceTempExercise = (exercises: Exercise[]): Exercise[] => {
            return exercises.map((ex) => {
              if (ex.id === exerciseToAdd.id) {
                return newExerciseFromBackend;
              }
              if (ex.children && ex.children.length > 0) {
                return {
                  ...ex,
                  children: replaceTempExercise(ex.children),
                };
              }
              return ex;
            });
          };

          // Use a new variable name to avoid shadowing
          const updatedExercisesFinal = replaceTempExercise(updatedExercises);

          // Update the exercises state by replacing the temp exercise with the one from the backend
          setExercises(updatedExercisesFinal);
        } else {
          // If for some reason the new exercise isn't found, you might want to refetch exercises
          setExercises(originalExercises); // Revert to original exercises
          setUpdateError();
          setResponseMessage("Failed to add activity.");
          toast({
            variant: "destructive",
            title: "Failed to add activity",
            duration: 500,
          });
          return;
        }

        // setExercises(updatedExercises);
        setNoExercises(false);
        setUpdateDone();
        setResponseMessage("Activity added successfully.");
        toast({
          title: "Activity added successfully.",
          duration: 500,
        });
      } catch (error) {
        console.error("Error adding activity:", error);
        setUpdateError();
        setResponseMessage(
          "An unexpected error occurred while adding the activity.",
        );
        toast({
          variant: "destructive",
          title: "Failed to add activity",
          description:
            "An error occurred while adding the activity. Please try again.",
          duration: 500,
        });

        setExercises(originalExercises);
      }
    }
  };

  const handleCancelNewExercise = () => {
    setNewExercise(null);
  };

  const deleteExercise = async (exerciseId: number | null | undefined) => {
    try {
      refreshToken();
      // Optimistically update the frontend state
      setExercises((prev) => {
        const updatedExercises = removeExerciseFromTree(prev, exerciseId);

        // Filter top-level exercises for the current date
        const updatedTopLevelExercises = updatedExercises.filter((ex) => {
          const exerciseDate = ex.date?.toISOString().split("T")[0];
          return ex.parent_id === null && exerciseDate === exDate;
        });

        // If no top-level exercises remain, set noExercises to true
        if (updatedTopLevelExercises.length === 0) {
          setNoExercises(true);
        }

        return updatedExercises;
      });

      // Send the delete request to the server
      const response = await DeleteActivities({
        token,
        id: exerciseId,
      });

      if (!response.success) {
        setResponseMessage(response.message || "Failed to delete activity");
        toast({
          variant: "destructive",
          title: "Failed to delete activity",
          description: response.message || "Failed to delete activity",
          duration: 500,
        });

        // Revert the optimistic update
        fetchExercises().then((r) => r);
        return;
      }

      // Show success message
      setResponseMessage("Activity deleted successfully.");
      toast({
        title: "Activity deleted successfully.",
        duration: 500,
      });
    } catch (error) {
      console.error("Error deleting activity:", error);
      setResponseMessage(
        "An unexpected error occurred while deleting the activity.",
      );
      toast({
        variant: "destructive",
        title: "Failed to delete activity",
        description:
          "An error occurred while deleting the activity. Please try again.",
        duration: 500,
      });

      // Revert the optimistic update
      fetchExercises().then((r) => r);
    }
  };

  const exDate = currentDate.toISOString().split("T")[0];
  const topLevelExercises = exercises.filter((ex) => {
    const exerciseDate = ex.date?.toISOString().split("T")[0];
    return ex.parent_id === null && exerciseDate === exDate;
  });

  const handleUpdateExercise = async (updatedExercise: Exercise) => {
    refreshToken();
    try {
      // Indicate that an update is in progress
      setUpdateLoading();

      // Attempt to update the exercise on the server
      const response = await AddOrUpdateActivities({
        token,
        activities: updatedExercise,
      });

      if (!response.success) {
        // If the update failed, show an error message
        setUpdateError();
        setResponseMessage(response.message || "Failed to update activity");
        toast({
          variant: "destructive",
          title: "Failed to update activity",
          description: response.message || "Failed to update activity",
          duration: 500,
        });
        return;
      }

      // If successful, update the exercise in local state recursively
      setExercises((prev) => updateExerciseInTree(prev, updatedExercise));

      // Indicate that the update is done and show success message
      setUpdateDone();
      setResponseMessage("Activity updated successfully.");
    } catch (error) {
      console.error("Error updating activity:", error);
      setUpdateError();
      setResponseMessage(
        "An unexpected error occurred while updating the activity.",
      );
      toast({
        variant: "destructive",
        title: "Failed to update activity",
        description:
          "An error occurred while updating the activity. Please try again.",
        duration: 500,
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col xl:px-24 2xl:px-32">
      <Calendar
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        rerenderWeekHeader={rerenderWeekHeader}
        setRerenderWeekHeader={setRerenderWeekHeader}
      >
        {status === "loading" && (
          <div className="w-full px-8">
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        )}
        {status === "error" && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {responseMessage || "Failed to retrieve activities"}
            </AlertDescription>
          </Alert>
        )}
        {noExercises && status === "done" && (
          <Card className="mx-8">
            <CardHeader>
              <h1 className="text-center text-2xl font-semibold">
                No activities found
              </h1>
            </CardHeader>
            <CardContent>
              <p className="text-center">No activities found for today.</p>
            </CardContent>
            <CardFooter className="flex flex-col justify-center gap-2">
              <Button
                onClick={() => initiateAddExercise()}
                className="self-center"
              >
                <Plus size={24} className="mr-2" />
                Add Activity
              </Button>
              <p className="text-2xl font-semibold">OR</p>
              <Button
                variant="ghost"
                className="text-primary hover:text-orange-400"
              >
                <BotMessageSquare />
                <Link to="/chat">Chat with Genie to generate workout</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
        {/* For top-level new exercise (when parentId=0) */}
        {status === "done" &&
          topLevelExercises.map((exercise, index) => (
            <ExerciseTree
              key={exercise.id}
              exercise={exercise}
              exercises={exercises}
              expandedNodes={expandedNodes}
              onToggleExpansion={toggleNodeExpansion}
              parentId={0}
              onToggle={() => toggleExerciseCompletion(exercise.id)}
              toggleExerciseCompletion={toggleExerciseCompletion}
              onDeleteExercise={() => deleteExercise(exercise.id)}
              deleteExercise={deleteExercise}
              onAddChildExercise={() => initiateAddExercise(exercise.id)}
              addChildExercise={initiateAddExercise}
              newExercise={newExercise}
              handleNewExerciseNameChange={handleNewExerciseNameChange}
              handleNewExerciseTypeChange={handleNewExerciseDescriptionChange}
              handleSaveNewExercise={handleSaveNewExercise}
              handleCancelNewExercise={handleCancelNewExercise}
              containerRef={containerRef}
              inputRef={inputRef}
              ref={
                index === topLevelExercises.length - 1 ? lastExerciseRef : null
              }
              onUpdateExercise={handleUpdateExercise}
            />
          ))}
        {newExercise && newExercise.parentId === null && (
          <NewExercise
            name={newExercise.name}
            type={newExercise.type}
            onNameChange={handleNewExerciseNameChange}
            onTypeChange={handleNewExerciseDescriptionChange}
            onSave={handleSaveNewExercise}
            onCancel={handleCancelNewExercise}
            containerRef={containerRef}
            inputRef={inputRef}
          />
        )}
      </Calendar>
      <div className="mt-2 flex flex-none justify-end pb-1 lg:mt-4 lg:pb-6">
        <Button
          variant="ghost"
          className="rounded-lg text-lg shadow-lg"
          size="lg"
          onClick={() => initiateAddExercise()}
          aria-label="Add New Activity"
        >
          <Plus size={24} className="text-primary hover:text-orange-400" />
          <p className="text-primary hover:text-orange-400">Activity</p>
        </Button>
      </div>
    </div>
  );
};

export default Home;
