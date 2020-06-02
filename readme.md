# rejet

A state management that was inspired by Recoil

## Highlight features
1. Minimalism state management
2. Can cancel async action dispatching
3. Powerful computed states
4. Can watch action dispatching or state changing

## State

States can be read from any component.
Components that read the value of state are implicitly subscribed to that state,
so any state updates will result in a re-render of all components subscribed to that state:

```jsx harmony
import {state, select} from 'rejet';

const textState = state('default value');

const TextInput = () => {
  const text = select(textState);
  return <input value={text} />;
};
```

## Action

We can only change states inside an action

```jsx harmony
import {state, action, select} from 'rejet';

const textState = state('default value');
const changeTextAction = action(({get, set}, newText) => {
  const oldText = get(textState);
  set(textState, newText);
});

const TextInput = () => {
  const text = select(textState);
  return (
    <input onChange={(e) => changeTextAction(e.target.value)} value={text} />
  );
};
```

## Computed State

A computed state represents derived state.
Derived state is a transformation of state.
You can think of derived state as the output of passing state to a pure function that modifies the given state in some way:

```jsx harmony
import {state} from 'rejet';

const textState = state('default value');
const charCountState = state(({get}) => {
  const text = get(textState);
  return text.length;
});
```

Derived state is a powerful concept because it lets us build dynamic data that depends on other data.
In the context of our todo list application, the following are considered derived state:

Filtered todo list: derived from the complete todo list by creating a new list that has certain items filtered out based on some criteria (such as filtering out items that are already completed).
Todo list statistics: derived from the complete todo list by calculating useful attributes of the list, such as the total number of items in the list, the number of completed items, and the percentage of items that are completed.
To implement a filtered todo list, we need to choose a set of filter criteria whose value can be saved in an atom. The filter options we'll use are: "Show All", "Show Completed", and "Show Uncompleted". The default value will be "Show All":

```jsx harmony
const todoListFilterState = state('Show All');
```

Using todoListFilterState and todoListState, we can build a filteredTodoListState computed state which derives a filtered list:

```jsx harmony
const filteredTodoListState = state(({get}) => {
  const filter = get(todoListFilterState);
  const list = get(todoListState);

  switch (filter) {
    case 'Show Completed':
      return list.filter((item) => item.isComplete);
    case 'Show Uncompleted':
      return list.filter((item) => !item.isComplete);
    default:
      return list;
  }
});
```

The filteredTodoListState internally keeps track of two dependencies: todoListFilterState and todoListState so that it re-runs if either of those change.
Displaying our filtered todoList is as simple as changing one line in the TodoList component:

```jsx harmony
function TodoList() {
  // changed from todoListState to filteredTodoListState
  const todoList = select(filteredTodoListState);

  return (
    <>
      <TodoListStats />
      <TodoListFilters />
      <TodoItemCreator />

      {todoList.map((todoItem) => (
        <TodoItem item={todoItem} key={todoItem.id} />
      ))}
    </>
  );
}
```

Note the UI is the same as the todoListFilterState has a default of "Show All". In order to change the filter, we need to implement the TodoListFilters component:

```jsx harmony
const changeFilter = action(({set}, newFilter) => {
  set(todoListFilterState, newFilter);
});

function TodoListFilters() {
  const filter = select(todoListFilterState);

  const updateFilter = ({target: {value}}) => {
    changeFilter(value);
  };

  return (
    <>
      Filter:
      <select value={filter} onChange={updateFilter}>
        <option value="Show All">All</option>
        <option value="Show Completed">Completed</option>
        <option value="Show Uncompleted">Uncompleted</option>
      </select>
    </>
  );
}
```

With a few lines of code we've managed to implement filtering! We'll use the same concepts to implement the TodoListStats component.

We want to display the following stats:

Total number of todo items
Total number of completed items
Total number of uncompleted items
Percentage of items completed
While we could create a computed state for each of the stats,
an easier approach would be to create one computed state that returns an object containing the data we need. We'll call this computed state todoListStatsState:

```jsx harmony
const todoListStatsState = state(({get}) => {
  const todoList = get(filteredTodoListState);
  const totalNum = todoList.length;
  const totalCompletedNum = todoList.filter((item) => item.isComplete).length;
  const totalUncompletedNum = totalNum - totalCompletedNum;
  const percentCompleted = totalNum === 0 ? 0 : totalCompletedNum / totalNum;

  return {
    totalNum,
    totalCompletedNum,
    totalUncompletedNum,
    percentCompleted,
  };
});
```

To read the value of todoListStatsState, we use select() once again:

```jsx harmony
function TodoListStats() {
  const {
    totalNum,
    totalCompletedNum,
    totalUncompletedNum,
    percentCompleted,
  } = select(todoListStatsState);

  const formattedPercentCompleted = Math.round(percentCompleted * 100);

  return (
    <ul>
      <li>Total items: {totalNum}</li>
      <li>Items completed: {totalCompletedNum}</li>
      <li>Items not completed: {totalUncompletedNum}</li>
      <li>Percent completed: {formattedPercentCompleted}</li>
    </ul>
  );
}
```
