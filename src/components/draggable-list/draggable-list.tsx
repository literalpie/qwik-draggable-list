import {
  $,
  component$,
  createContext,
  Signal,
  Slot,
  useClientEffect$,
  useContext,
  useContextProvider,
  useOn,
  useSignal,
  useStore,
  useStylesScoped$,
  Context,
  QRL,
  useWatch$,
} from "@builder.io/qwik";
import styles from "./draggable-list.css?inline";

// This file aims to behave as a reusable component (and draggable-list-consumer is how a consuming app would use it)
type DraggingState<T> = {
  allItems: Signal<T[]>;
  draggingItem?: T;
  draggedOverItem?: T;
  onDrop$: QRL<
    ({
      droppedItem,
      itemDroppedOn,
    }: {
      droppedItem: T;
      itemDroppedOn: T;
    }) => void
  >;
};
export const draggingContext =
  createContext<DraggingState<unknown>>("dragging-context");

type DraggableListProps<T = unknown> = {
  list: Signal<T[]>;
  onDrop$: QRL<
    ({
      droppedItem,
      itemDroppedOn,
    }: {
      droppedItem: T;
      itemDroppedOn: T;
    }) => void
  >;
};

export const DraggableList = component$(
  <T,>({ list, onDrop$ }: DraggableListProps<T>) => {
    const draggingState = useStore<DraggingState<T>>({
      // Ideally, we wouldn't need the whole list, but I can't think of a better way of showing the correct before/after class
      // and I don't want to make the user do that calculation.
      allItems: list,
      onDrop$,
    });
    useContextProvider<DraggingState<T>>(
      draggingContext as Context<DraggingState<T>>,
      draggingState
    );

    return <Slot />;
  }
);
export const DraggableListItem = component$(
  <T,>({ listItem }: { listItem: T }) => {
    useStylesScoped$(styles);
    const { ref } = useDragItem({ item: listItem });
    return (
      <div ref={ref}>
        <Slot />
      </div>
    );
  }
);

export const useDragItem = <T,>({ item }: { item: T }) => {
  const ref = useSignal<HTMLElement>();
  const draggingState = useContext<DraggingState<T>>(draggingContext as any);
  // Yes, it would be cleaner if we listened to these events normally inside DraggableListItem
  // but having it in a hook like this might be useful if someone wants total control (making their own component that uses this hook)
  useOn(
    "dragstart",
    $(() => (draggingState.draggingItem = item))
  );
  useOn(
    "dragend",
    $(() => (draggingState.draggingItem = undefined))
  );
  useOn(
    "dragenter",
    $(() => (draggingState.draggedOverItem = item))
  );
  useOn(
    "dragleave",
    $(() =>
      draggingState.draggedOverItem === item
        ? (draggingState.draggedOverItem = undefined)
        : void 0
    )
  );
  useOn(
    "drop",
    $(() => {
      draggingState.onDrop$({
        droppedItem: draggingState.draggingItem!,
        itemDroppedOn: draggingState.draggedOverItem!,
      });
      draggingState.draggingItem = undefined;
      draggingState.draggedOverItem = undefined;
    })
  );

  useClientEffect$(({ track }) => {
    track(() => ref.value);
    ref.value ? (ref.value.draggable = true) : void 0;
    ref.value?.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
  });

  // Currently, the classes that get added for the different states are just hard-coded.
  // I think this is probably the best way, and it would just be up to the consumer
  // to add the styles they want to these classes.
  useWatch$(({ track }) => {
    track(() => draggingState.draggedOverItem);
    track(() => draggingState.draggingItem);
    track(() => draggingState.allItems);
    const possibleClasses = [
      "dragging",
      "dragging-over__after",
      "dragging-over__before",
    ];
    const draggingAfter =
      draggingState.draggedOverItem &&
      draggingState.draggingItem &&
      draggingState.allItems.value.indexOf(draggingState.draggedOverItem) >
        draggingState.allItems.value.indexOf(draggingState.draggingItem);

    const classesToAdd = [
      ...(item === draggingState.draggingItem ? ["dragging"] : []),
      ...(item === draggingState.draggedOverItem && draggingAfter
        ? ["dragging-over__after"]
        : []),
      ...(item === draggingState.draggedOverItem && !draggingAfter
        ? ["dragging-over__before"]
        : []),
    ];
    ref.value?.classList.add(...classesToAdd);
    ref.value?.classList.remove(
      ...possibleClasses.filter((cl) => !classesToAdd.includes(cl))
    );
  });

  return { ref };
};
