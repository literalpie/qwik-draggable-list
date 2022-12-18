import {
  $,
  Component,
  component$,
  createContext,
  Signal,
  useClientEffect$,
  useContext,
  useContextProvider,
  useOn,
  useSignal,
  useStore,
  useStylesScoped$,
  useWatch$,
} from "@builder.io/qwik";
import styles from "./draggable-list.css?inline";
type DraggingState<T> = {
  allItems: Signal<T[]>;
  draggingItem?: T;
  draggedOverItem?: T;
};
export const draggingContext =
  createContext<DraggingState<unknown>>("dragging-context");

export const DraggableListUser = component$(() => {
  useStylesScoped$(styles);
  const allItems = useSignal(["test 1", "test 2 ", "test 3"]);

  return (
    <DraggableList
      list={allItems}
      listItemRenderer={component$(({ listItem, ref }) => {
        useStylesScoped$(styles);
        // scopeId needed so that styles scoped to this component will be applied to classes added to this element
        return <div ref={ref}>{listItem}</div>;
      })}
    />
  );
});

type DraggableListProps<T = unknown> = {
  list: Signal<T[]>;
  listItemRenderer: Component<{
    ref: Signal<HTMLElement | undefined>;
    listItem: T;
  }>;
};

export const DraggableList = component$(
  <T,>({ list, listItemRenderer }: DraggableListProps<T>) => {
    const draggingState = useStore<DraggingState<T>>({
      allItems: list,
    });
    useContextProvider(draggingContext, draggingState);

    return (
      <div
        onDrop$={() => {
          const droppedIndex = draggingState.allItems.value.indexOf(
            draggingState.draggedOverItem!
          );
          const newAllItems = draggingState.allItems.value.filter(
            (item) => item !== draggingState.draggingItem
          );
          newAllItems.splice(droppedIndex, 0, draggingState.draggingItem!);
          draggingState.allItems.value = newAllItems;
          draggingState.draggedOverItem = undefined;
        }}
      >
        {list.value.map((listItem) => {
          return (
            <DraggableListItem
              key={listItem as string}
              listItem={listItem as any}
              listItemRenderer={listItemRenderer}
            />
          );
        })}
      </div>
    );
  }
);
export const DraggableListItem = component$(
  <T,>({
    listItem,
    listItemRenderer: ListItemRenderer,
  }: {
    listItem: T;
    listItemRenderer: Component<{
      ref: Signal<HTMLElement | undefined>;
      listItem: T;
    }>;
  }) => {
    const { ref } = useDragItem({ item: listItem });
    return (
      // It's kind of a bummer that we need to add a div, but we need to so that the events can be listened to on it.
      <div>
        {/* I don't know why listItem type doesn't match. */}
        <ListItemRenderer ref={ref} listItem={listItem as any} />
      </div>
    );
  }
);

export const useDragItem = <T,>({ item }: { item: T }) => {
  const ref = useSignal<HTMLElement>();
  const draggingState = useContext<DraggingState<T>>(draggingContext as any);
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

  useClientEffect$(({ track }) => {
    track(() => ref.value);
    console.log("client");
    console.log("ref value changes", item);
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
