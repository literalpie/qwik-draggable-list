import { Counter } from "./components/counter/counter";
import { DraggableListConsumer } from "./components/draggable-list-consumer/draggable-list-consumer";
import { Logo } from "./components/logo/logo";

export default () => {
  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <title>Qwik Blank App</title>
      </head>
      <body>
        <Logo />
        <Counter />
        <DraggableListConsumer />
      </body>
    </>
  );
};
