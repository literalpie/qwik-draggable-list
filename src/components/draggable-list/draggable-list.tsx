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

export const DraggableListUser = component$(() => {
  useStylesScoped$(styles);
  const allItems = useSignal(["test 1", "test 2 ", "test 3"]);

  return (
    <DraggableList
      list={allItems}
      onDrop$={({ droppedItem, itemDroppedOn }) => {
        const droppedIndex = allItems.value.indexOf(itemDroppedOn!);
        const newAllItems = allItems.value.filter(
          (item) => item !== droppedItem
        );
        newAllItems.splice(droppedIndex, 0, droppedItem!);
        allItems.value = newAllItems;
      }}
    >
      {allItems.value.map((listItem) => {
        return (
          <DraggableListItem key={listItem} listItem={listItem}>
            {listItem}
          </DraggableListItem>
        );
      })}
    </DraggableList>
  );
});
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

  useWatch$(({ track }) => {
    track(() => draggingState.draggedOverItem);
    track(() => draggingState.draggingItem);
    track(() => draggingState.allItems);
    // console.log("state", draggingState.draggingItem);
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
