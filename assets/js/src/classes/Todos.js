"use strict";
/** 
 * @memeberof       Eyeful
 * @class           Todos
 * @classdesc       A class focused on the todos functionality
 * @requires        Generic
 * @param           {string}                           genericObjectInstance - the Generic instance variable name on the Global Object (i.e.: globalThis)
 * @param           {string}                           todosHeader           - query selector of the todosHeader element.
 * @param           {string}                           todosContainer        - query selector of the todosContainer element.
 * @param           {(boolean|array.<boolean|string>)} [todosOptions]        - activity boolean or array of activity boolean and query selector of the todosOptions container
 * @returns         TodosInstance
 * @throws          {(TypeError|Error)}                                      - at runtime if required arguments are not passed.
 */
export default function Todos({
  genericObjectInstance,
  todosHeader,
  todosContainer,
  todosOptions
}) {
  /** 
   * @global
   * @const
   * @access          private
   * @type            {object}
   * @this            Timer
   * @summary capturing the global this of the factory function
   */
  const THIS = this;

  /** 
   * @global
   * @const
   * @access          private
   * @type            {object}
   * @summary Generic class instance, used to call functions and access properties
   */
  const GOI = genericObjectInstance;

  /** 
   * @global
   * @access          private
   * @type            {number}
   * @summary these variables used to make unique ids to to the entries
   */
  let todosCount = 0;

  /** 
   * @global
   * @default
   * @access          private
   * @type            {boolean}
   * @summary these variables used to make unique ids to to the entries
   */
  let isAnyDeleted = false;

  /** 
   * @global
   * @access          public
   * @type            {array.<object>}
   * @description this variable is used internally and defined 
   *     as getter on the class instance for external access
   */
  let todosCache = [];

  const LANG = GOI.language.key;
  const L10N = GOI.language.localization;
  
  /** 
   * @external
   * @summary imported functions from the Generic class instance 
   */
  const {
    $get,
    interpolate,
    timeStamp,
    notify
  } = GOI;

  /**
   * @global
   * @access         public
   * @type           {object}
   * @description DOM cache, this object is defined as a property on the class instance. the 
   *     object is defined like this to get use of object chronological order and avoid unexpected 
   *     object order at runtime, because 70% of the elements depend on pre-fetched elements.
   */
  const parts = {};
  parts.todosHeader = {};
  parts.todosHeader.self = $get(todosHeader);
  parts.todosHeader.input = parts.todosHeader.self ? $get('[data-fn="input"]', parts.todosHeader.self) : null;
  parts.todosHeader.button = parts.todosHeader.self ? $get('[data-fn="button"]', parts.todosHeader.self) : null;
  parts.todosHeader.counter = parts.todosHeader.self ? $get('[data-fn="counter"]', parts.todosHeader.self) : null;
  parts.todosContainer = $get(todosContainer);
  parts.todosOptions = {};
  parts.todosOptions.enabled = todosOptions instanceof Array ? todosOptions[0] : false;
  parts.todosOptions.self = todosOptions instanceof Array ? $get(todosOptions[1]) : null;
  parts.todosOptions.delete = parts.todosOptions.self ? $get('[data-fn="delete"]', parts.todosOptions.self) : null;
  parts.todosOptions.restore = parts.todosOptions.self ? $get('[data-fn="restore"]', parts.todosOptions.self) : null;

  /** 
   * @method          _createTodo
   * @memberof        Eyeful.Todos
   * @access          private
   * @param           {string}     todoValue - start time date object.
   * @returns         object                 - an HTMLElement ready to be appended
   * @summary a function that creates a todo element, fill it up and attach the events handler function to it.
   */
  const _createTodo = (todoValue) => {
    // make an li and append some elements for
    // text, time and delete option
    const todoElement = document.createElement("LI"),
          todoTextElement = document.createElement("SPAN"),
          todoTimeElement = document.createElement("TIME"),
          todoDeleteElement = document.createElement("I");
    todosCount++;
    todoTextElement.textContent = todoValue.trim();
    todoTimeElement.textContent = timeStamp(new Date(), false);
    todoElement.dataset.id = todosCount;
    todoElement.dataset.done = "false";
    todoElement.appendChild(todoTextElement);
    todoElement.appendChild(todoTimeElement);
    todoElement.appendChild(todoDeleteElement);
    _todoEventsHandler(todoElement);
    return todoElement;
  };
  
  /** 
   * @method          _todoEventsHandler
   * @memberof        Eyeful.Todos
   * @access          private
   * @param           {string}           todoValue - todo text content
   * @returns         void
   * @summary a function that binds event based on the clicked target
   */
  const _todoEventsHandler = (element) => {
    element.addEventListener("click", (event) => {
      const clicked = event.target;
      switch (clicked.tagName) {
        case "LI":
          THIS.done(clicked);
          break;
        case "SPAN":
          THIS.done(clicked.parentElement);
          break;
        case "I":
          THIS.remove(clicked.parentElement);
          break;
        case "TIME":
          THIS.done(clicked.parentElement);
          break;
        default:
          console.log("Clicked: " + clicked.tagName);
      }
    }, false);
  };

  /**
   * @method          add
   * @memberof        Eyeful.Todos
   * @access          public
   * @returns         void
   * @description this function gets the todo input value validate it 
   *     and create a todo passing the input value to it, it also does 
   *     push the todo to the todosCache and shows a notification.
   */
  this.add = () => {
    // prevent empty todos from getting added
    let newTodo = parts.todosHeader.input.value;
    if (newTodo === "" || (/^\s+$/).test(newTodo)) {
      parts.todosHeader.input.focus();
      return notify(L10N.todos.add.hint[LANG], 7500, 'log');
    }
    const readyTodo = _createTodo(newTodo);
    todosCache.push(readyTodo);
    parts.todosContainer.appendChild(readyTodo);
    parts.todosHeader.input.value = "";
    parts.todosHeader.input.focus();
    if (parts.todosHeader.counter) {
      parts.todosHeader.counter.textContent = todosCount;
    }
    notify(interpolate(L10N.todos.add.message[LANG], todosCount));
  };

  /**
   * @method          done
   * @memberof        Eyeful.Todos
   * @access          public
   * @param           {object}     element - the todo element
   * @returns         void
   * @description this function checks the todo data-done attribute and reverses it.
   *     it also shows a notification.
   */
  this.done = (element) => {
    if (element.dataset.done == "true") {
      element.dataset.done = "false";
      notify(interpolate(L10N.todos.done.false[LANG], element.dataset.id));
    } else {
      element.dataset.done = "true";
      notify(interpolate(L10N.todos.done.true[LANG], element.dataset.id));
    }
  };

  /**
   * @method          remove
   * @memberof        Eyeful.Todos
   * @access          public
   * @param           {object}     element - the todo element
   * @returns         void
   * @description this function removes the todo from the todos container
   *     changes the global variable isAnyDeleted to true and shows a notification.
   */
  this.remove = (element) => {
    if (isAnyDeleted === false) isAnyDeleted = true;
    element.parentElement.removeChild(element);
    notify(interpolate(L10N.todos.remove.message[LANG], element.dataset.id));
  };

  /**
   * @method          delete
   * @memberof        Eyeful.Todos
   * @access          public
   * @returns         void
   * @description this function checks if the todos container contains any todos, it makes 
   *     it empty, sets the global variable isAnyDeleted to ture and shows a notification.
   */
  this.delete = () => {
    if (todosCount > 0) {
      if (isAnyDeleted === false) isAnyDeleted = true;
      parts.todosContainer.innerHTML = "";
      notify(L10N.todos.delete.message[LANG]);
    } else notify(L10N.todos.delete.hint[LANG], 7500, 'log');
  };

  /**
   * @method          restore
   * @memberof        Eyeful.Todos
   * @access          public
   * @returns         void
   * @description this function checks if global variable isAnyDeleted == true, makes the todosContainer 
   *     empty and re-append the todos elements from the todosCache array and shows a notification.
   */
  this.restore = () => {
    if (isAnyDeleted === true) {
      isAnyDeleted = false;
      parts.todosContainer.innerHTML = "";
      todosCache.forEach((storedTodo) => {
        parts.todosContainer.appendChild(storedTodo);
      }, this);
      notify(L10N.todos.restore.message[LANG]);
    } else notify(L10N.todos.restore.hint[LANG], 7500, 'log');
  };

  /** 
   * @memberof        Eyeful.Todos
   * @access          public
   * @property        {object}         todosCache - contains getter.
   * @summery defines a getter and of the todosCache on the class instance.
   */
  Object.defineProperty(this, "todosArray", {
    get() { return todosCache; },
    enumerable: false,
    configurable: false
  });

  /**
   * @function        iife
   * @memberof        Eyeful.Todos
   * @access          private
   * @returns         void
   * @description invokes a private method, binds events to some elements.
   */
  const iife = (function() {
    // binding functions and keyboard events to the controls
    parts.todosHeader.button.addEventListener("click", THIS.add);
    parts.todosHeader.input.addEventListener("keydown", (event) => {
      if (event.keyCode === 13) {
        event.preventDefault();
        THIS.add();
      }
    });
    // check if options are provided, attach functions to them.
    if (parts.todosOptions.self) {
      parts.todosOptions.self.dataset.options = parts.todosOptions.enabled;
      if (parts.todosOptions.enabled === true) {
        parts.todosOptions.delete.addEventListener("click", THIS.delete);
        parts.todosOptions.restore.addEventListener("click", THIS.restore);
      }
    }
  })();
}