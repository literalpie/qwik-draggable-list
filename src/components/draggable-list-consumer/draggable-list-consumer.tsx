import { component$, useSignal } from "@builder.io/qwik";
import {
  DraggableList,
  DraggableListItem,
} from "../draggable-list/draggable-list";

export const DraggableListConsumer = component$(() => {
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
